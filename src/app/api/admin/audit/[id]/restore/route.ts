import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, galleryItems, products } from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { bad } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { sanitizePatch } from "@/lib/product-patch";
import { RESOURCES } from "@/lib/resources";
import { putSetting } from "@/lib/settings-store";

export const dynamic = "force-dynamic";

/** Restore the value a change replaced ("استعادة التعديل السابق"). Owner only. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await auth("owner");
  if (a.deny) return a.deny;
  const [row] = await db.select().from(auditLog).where(eq(auditLog.id, Number((await params).id)));
  if (!row || !row.restorable || row.restoredAt || !row.before) return bad("لا يمكن استعادة هذا السجل");
  const before = row.before as Record<string, unknown>;

  try {
    if (row.entity === "content" || row.entity === "setting") {
      await putSetting(String(before.key), before.value == null ? null : String(before.value));
    } else if (row.entity === "product") {
      const { set, error } = sanitizePatch(before);
      if (error) return bad(error);
      await db.update(products).set(set).where(eq(products.id, Number(row.entityId)));
    } else if (row.entity === "gallery") {
      await db.update(galleryItems).set(before as never).where(eq(galleryItems.id, Number(row.entityId)));
    } else if (row.entity.startsWith("r:")) {
      const res = RESOURCES[row.entity.slice(2)];
      if (!res) return bad("غير مدعوم");
      const { id: _drop, ...rest } = before;
      void _drop;
      await db.update(res.table).set(rest).where(eq(res.table.id, Number(row.entityId)));
    } else return bad("هذا النوع لا يدعم الاستعادة");
  } catch {
    return bad("تعذّرت الاستعادة (ربما حُذف العنصر)", 500);
  }
  await db.update(auditLog).set({ restoredAt: new Date() }).where(eq(auditLog.id, row.id));
  await logAudit({ user: a.user, action: "restore", entity: row.entity, entityId: row.entityId, summary: `استعادة: ${row.summary}` });
  return Response.json({ ok: true });
}
