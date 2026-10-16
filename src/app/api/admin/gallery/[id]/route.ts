import { eq } from "drizzle-orm";
import { db } from "@/db";
import { galleryItems } from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { bad, readBody, validImg } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const a = await auth("content");
  if (a.deny) return a.deny;
  const id = Number((await params).id);
  const b = await readBody(req);
  const [cur] = await db.select().from(galleryItems).where(eq(galleryItems.id, id));
  if (!cur) return bad("غير موجود", 404);

  const patch: Partial<typeof galleryItems.$inferInsert> = {};
  if (typeof b.title === "string") {
    const t = b.title.trim().slice(0, 120);
    if (!t) return bad("العنوان لا يمكن أن يكون فارغًا");
    patch.title = t;
  }
  if (typeof b.description === "string") patch.description = b.description.trim().slice(0, 400);
  if (typeof b.category === "string") patch.category = b.category.trim().slice(0, 40);
  if (typeof b.active === "boolean") patch.active = b.active;
  if (typeof b.image === "string" && validImg(b.image)) patch.image = b.image;
  if (Object.keys(patch).length === 0) return Response.json({ ok: true });

  const before: Record<string, unknown> = {};
  for (const k of Object.keys(patch)) before[k] = (cur as Record<string, unknown>)[k];
  await db.update(galleryItems).set(patch).where(eq(galleryItems.id, id));
  await logAudit({ user: a.user, action: "update", entity: "gallery", entityId: id, summary: `تعديل صورة المعرض: ${cur.title}`, before, after: patch, restorable: true });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const a = await auth("content");
  if (a.deny) return a.deny;
  const id = Number((await params).id);
  const [row] = await db.delete(galleryItems).where(eq(galleryItems.id, id)).returning();
  if (row) await logAudit({ user: a.user, action: "delete", entity: "gallery", entityId: id, summary: `حذف صورة من المعرض: ${row.title}`, before: row });
  return Response.json({ ok: true });
}
