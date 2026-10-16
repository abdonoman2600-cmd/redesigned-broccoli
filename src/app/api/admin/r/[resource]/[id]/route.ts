import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/admin-auth";
import { bad, readBody, isUnique } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { coerce, RESOURCES } from "@/lib/resources";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const p = await params;
  const res = RESOURCES[p.resource];
  if (!res) return bad("غير موجود", 404);
  const a = await auth(res.perm);
  if (a.deny) return a.deny;
  const id = Number(p.id);
  const [cur] = await db.select().from(res.table).where(eq(res.table.id, id));
  if (!cur) return bad("غير موجود", 404);
  const { value, error } = coerce(res, await readBody(req), true);
  if (!value) return bad(error ?? "بيانات غير صالحة");
  if (res.name === "pages" && ["about", "contact"].includes(cur.slug) && value.slug && value.slug !== cur.slug) {
    return bad("لا يمكن تغيير رابط الصفحتين الأساسيتين");
  }
  try {
    await db.update(res.table).set(value).where(eq(res.table.id, id));
  } catch (e) {
    if (isUnique(e)) return bad("القيمة مستخدمة بالفعل (الرابط أو الكود)");
    return bad("تعذّر الحفظ", 500);
  }
  await logAudit({ user: a.user, action: "update", entity: `r:${res.name}`, entityId: id, summary: `تعديل ${res.label}`, before: cur, after: value, restorable: true });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const p = await params;
  const res = RESOURCES[p.resource];
  if (!res) return bad("غير موجود", 404);
  const a = await auth(res.perm);
  if (a.deny) return a.deny;
  const id = Number(p.id);
  const [cur] = await db.select().from(res.table).where(eq(res.table.id, id));
  if (!cur) return Response.json({ ok: true });
  if (res.name === "pages" && ["about", "contact"].includes(cur.slug)) return bad("لا يمكن حذف الصفحتين الأساسيتين. يمكنك إخفاؤهما.");
  const blocked = res.guardDelete ? await res.guardDelete(id) : null;
  if (blocked) return bad(blocked);
  await db.delete(res.table).where(eq(res.table.id, id));
  await logAudit({ user: a.user, action: "delete", entity: `r:${res.name}`, entityId: id, summary: `حذف ${res.label}`, before: cur });
  return Response.json({ ok: true });
}
