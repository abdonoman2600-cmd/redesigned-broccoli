import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth, PERMISSIONS } from "@/lib/admin-auth";
import { bad, readBody, str } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const a = await auth("owner");
  if (a.deny) return a.deny;
  const id = Number((await params).id);
  const [u] = await db.select().from(users).where(eq(users.id, id));
  if (!u) return bad("غير موجود", 404);
  if (u.role === "owner") return bad("لا يمكن تعديل حساب المالك من هنا");
  const b = await readBody(req);
  const set: Partial<typeof users.$inferInsert> = {};
  if (typeof b.name === "string" && b.name.trim().length >= 2) set.name = str(b.name, 80);
  if (Array.isArray(b.permissions)) set.permissions = b.permissions.map(String).filter((p) => p in PERMISSIONS);
  if (typeof b.active === "boolean") {
    set.active = b.active;
    if (!b.active) set.sessionVersion = sql`${users.sessionVersion} + 1` as never;
  }
  await db.update(users).set(set).where(eq(users.id, id));
  await logAudit({ user: a.user, action: "update", entity: "user", entityId: id, summary: `تعديل صلاحيات/حالة الموظف: ${u.name}` });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const a = await auth("owner");
  if (a.deny) return a.deny;
  const id = Number((await params).id);
  const [u] = await db.select().from(users).where(and(eq(users.id, id)));
  if (!u) return Response.json({ ok: true });
  if (u.role === "owner") return bad("لا يمكن حذف حساب المالك");
  await db.delete(users).where(eq(users.id, id));
  await logAudit({ user: a.user, action: "delete", entity: "user", entityId: id, summary: `حذف الموظف: ${u.name}` });
  return Response.json({ ok: true });
}
