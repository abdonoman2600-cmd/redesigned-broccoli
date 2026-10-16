import { consumeResetToken, passwordProblem } from "@/lib/admin-auth";
import { bad, readBody } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Set a password from a one-time link created by the owner (staff invitations & resets). */
export async function POST(req: Request) {
  const b = await readBody(req);
  const problem = passwordProblem(String(b.password ?? ""));
  if (problem) return bad(problem);
  const u = await consumeResetToken(String(b.token ?? ""), String(b.password));
  if (!u) return bad("الرابط غير صالح أو منتهي. اطلب رابطًا جديدًا من المالك.", 400);
  await logAudit({ user: null, action: "reset", entity: "user", entityId: u.id, summary: `تعيين كلمة مرور عبر رابط: ${u.email}` });
  return Response.json({ ok: true });
}
