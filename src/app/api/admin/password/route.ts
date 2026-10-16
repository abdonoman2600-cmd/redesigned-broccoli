import { auth, changePassword, checkUserPassword, createSession, passwordProblem } from "@/lib/admin-auth";
import { bad, isSecure, readBody } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const a = await auth(undefined, { allowMustChange: true });
  if (a.deny) return a.deny;
  const b = await readBody(req);
  const current = String(b.current ?? "");
  const next = String(b.next ?? "");
  if (!(await checkUserPassword(a.user.id, current))) return bad("كلمة المرور الحالية غير صحيحة");
  const problem = passwordProblem(next);
  if (problem) return bad(problem);
  if (next === current) return bad("اختر كلمة مرور مختلفة عن الحالية");
  const u = await changePassword(a.user.id, next);
  await createSession(u.id, u.sessionVersion, isSecure(req)); // this device stays signed in, others are signed out
  await logAudit({ user: a.user, action: "password", entity: "user", entityId: u.id, summary: "تغيير كلمة المرور" });
  return Response.json({ ok: true });
}
