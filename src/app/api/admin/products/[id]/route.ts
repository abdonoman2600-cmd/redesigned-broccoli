import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { drafts, products } from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { bad, readBody, isUnique } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { pickBefore, sanitizePatch } from "@/lib/product-patch";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Direct (published immediately) edit from the admin forms / inventory table. Logged and restorable. */
export async function PUT(req: Request, { params }: Ctx) {
  const a = await auth("products");
  if (a.deny) return a.deny;
  const id = Number((await params).id);
  const [cur] = await db.select().from(products).where(eq(products.id, id));
  if (!cur) return bad("المنتج غير موجود", 404);
  const { set, error } = sanitizePatch(await readBody(req), cur);
  if (error) return bad(error);
  if (Object.keys(set).length === 0) return Response.json({ ok: true });
  try {
    await db.update(products).set(set).where(eq(products.id, id));
  } catch (e) {
    if (isUnique(e)) return bad("رابط المنتج (slug) مستخدم بالفعل، غيّره");
    return bad("تعذّر الحفظ", 500);
  }
  await db.delete(drafts).where(and(eq(drafts.scope, "product"), eq(drafts.ref, String(id))));
  await logAudit({
    user: a.user, action: "update", entity: "product", entityId: id,
    summary: `تعديل المنتج: ${set.name ?? cur.name}`,
    before: pickBefore(cur as never, Object.keys(set)), after: set, restorable: true,
  });
  return Response.json({ ok: true });
}

/** In-place edit from the storefront: stored as an unpublished DRAFT until the owner publishes. */
export async function PATCH(req: Request, { params }: Ctx) {
  const a = await auth("products");
  if (a.deny) return a.deny;
  const id = Number((await params).id);
  const [cur] = await db.select().from(products).where(eq(products.id, id));
  if (!cur) return bad("المنتج غير موجود", 404);
  const body = await readBody(req);
  const { set, error } = sanitizePatch((body.patch ?? {}) as Record<string, unknown>, cur);
  if (error) return bad(error);
  if (Object.keys(set).length === 0) return Response.json({ ok: true });

  const [existing] = await db.select().from(drafts).where(and(eq(drafts.scope, "product"), eq(drafts.ref, String(id))));
  const data = { ...(existing?.data ?? {}), ...set } as Record<string, unknown>;
  await db
    .insert(drafts)
    .values({ scope: "product", ref: String(id), data, updatedBy: a.user.name })
    .onConflictDoUpdate({ target: [drafts.scope, drafts.ref], set: { data, updatedBy: a.user.name, updatedAt: new Date() } });
  return Response.json({ ok: true, draft: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const a = await auth("products");
  if (a.deny) return a.deny;
  const id = Number((await params).id);
  const [cur] = await db.select().from(products).where(eq(products.id, id));
  if (!cur) return Response.json({ ok: true });
  await db.delete(drafts).where(and(eq(drafts.scope, "product"), eq(drafts.ref, String(id))));
  await db.delete(products).where(eq(products.id, id));
  await logAudit({ user: a.user, action: "delete", entity: "product", entityId: id, summary: `حذف المنتج: ${cur.name}`, before: cur });
  return Response.json({ ok: true });
}
