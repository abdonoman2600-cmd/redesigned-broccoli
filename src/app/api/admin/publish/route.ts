import { eq } from "drizzle-orm";
import { db } from "@/db";
import { drafts, products } from "@/db/schema";
import { auth, can } from "@/lib/admin-auth";
import { readBody } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { contentStorageKey } from "@/lib/data";
import { pickBefore, sanitizePatch } from "@/lib/product-patch";
import { getSetting, putSetting } from "@/lib/settings-store";

export const dynamic = "force-dynamic";

/** Publish all drafts (or one: { id }) so they appear to every visitor. Each change is logged and restorable. */
export async function POST(req: Request) {
  const a = await auth();
  if (a.deny) return a.deny;
  const { id } = await readBody(req);
  const rows = id ? await db.select().from(drafts).where(eq(drafts.id, Number(id))) : await db.select().from(drafts);

  let published = 0;
  let skipped = 0;
  for (const r of rows) {
    if (r.scope === "content") {
      if (!can(a.user, "content")) { skipped++; continue; }
      const storage = contentStorageKey(r.ref);
      const before = await getSetting(storage);
      const value = String((r.data as { value?: string }).value ?? "");
      await putSetting(storage, value || null);
      await logAudit({
        user: a.user, action: "publish", entity: "content", entityId: storage,
        summary: `نشر تعديل في الصفحة: ${r.ref}`,
        before: { key: storage, value: before }, after: { key: storage, value: value || null }, restorable: true,
      });
    } else if (r.scope === "product") {
      if (!can(a.user, "products")) { skipped++; continue; }
      const pid = Number(r.ref);
      const [cur] = await db.select().from(products).where(eq(products.id, pid));
      if (!cur) { await db.delete(drafts).where(eq(drafts.id, r.id)); continue; }
      const { set, error } = sanitizePatch(r.data, cur);
      if (error) { skipped++; continue; }
      const before = pickBefore(cur as never, Object.keys(set));
      await db.update(products).set(set).where(eq(products.id, pid));
      await logAudit({
        user: a.user, action: "publish", entity: "product", entityId: pid,
        summary: `نشر تعديلات المنتج: ${set.name ?? cur.name}`, before, after: set, restorable: true,
      });
    }
    await db.delete(drafts).where(eq(drafts.id, r.id));
    published++;
  }
  return Response.json({ ok: true, published, skipped });
}
