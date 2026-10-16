import { randomBytes } from "crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth, createResetToken, hashPassword, PERMISSIONS } from "@/lib/admin-auth";
import { bad, origin, readBody, str, isUnique } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Owner creates a staff account; the staff member sets their own password from a one-time link. */
export async function POST(req: Request) {
  const a = await auth("owner");
  if (a.deny) return a.deny;
  const b = await readBody(req);
  const email = str(b.email, 120).toLowerCase();
  const name = str(b.name, 80);
  if (!/^\S+@\S+\.\S+$/.test(email)) return bad("بريد إلكتروني غير صحيح");
  if (name.length < 2) return bad("الاسم مطلوب");
  const permissions = (Array.isArray(b.permissions) ? b.permissions : []).map(String).filter((p) => p in PERMISSIONS);
  try {
    const [u] = await db
      .insert(users)
      .values({ email, name, role: "staff", permissions, passwordHash: hashPassword(randomBytes(24).toString("hex")), mustChangePassword: true })
      .returning({ id: users.id });
    const token = await createResetToken(u.id, 24 * 7);
    await logAudit({ user: a.user, action: "create", entity: "user", entityId: u.id, summary: `إضافة موظف: ${name} (${email})` });
    return Response.json({ ok: true, link: `${origin(req)}/admin/reset/${token}` }, { status: 201 });
  } catch (e) {
    if (isUnique(e)) return bad("هذا البريد مسجّل بالفعل");
    return bad("تعذّر الحفظ", 500);
  }
}
