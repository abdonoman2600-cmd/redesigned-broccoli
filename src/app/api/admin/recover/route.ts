import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { changePassword, clearFailures, clientKey, passwordProblem, recordFailure, recoveryEnabled, recoveryKeyValid, throttled } from "@/lib/admin-auth";
import { bad, readBody, str } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Owner password recovery using the server-side ADMIN_RECOVERY_KEY (no e-mail service required). */
export async function POST(req: Request) {
  if (!recoveryEnabled()) {
    return bad("الاستعادة غير مفعّلة. أضف المتغير ADMIN_RECOVERY_KEY (١٢ حرفًا على الأقل) في إعدادات الاستضافة.", 400);
  }
  const b = await readBody(req);
  const email = str(b.email, 120).toLowerCase();
  const key = await clientKey(`recover|${email}`);
  if (throttled(key)) return bad("محاولات كثيرة. حاول بعد ١٥ دقيقة.", 429);
  const password = String(b.password ?? "");
  const problem = passwordProblem(password);
  if (problem) return bad(problem);

  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (!u || !recoveryKeyValid(String(b.key ?? ""))) {
    recordFailure(key);
    await new Promise((r) => setTimeout(r, 700));
    return bad("البريد أو مفتاح الاستعادة غير صحيح", 401);
  }
  clearFailures(key);
  await changePassword(u.id, password);
  await logAudit({ user: null, action: "recover", entity: "user", entityId: u.id, summary: `استعادة كلمة مرور: ${u.email}` });
  return Response.json({ ok: true });
}
