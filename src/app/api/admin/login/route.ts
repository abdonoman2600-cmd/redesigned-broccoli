import { auth, clearFailures, clientKey, createSession, destroySession, login, recordFailure, throttled } from "@/lib/admin-auth";
import { bad, isSecure, readBody, str } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readBody(req);
  const email = str(b.email, 120).toLowerCase();
  const password = String(b.password ?? "").slice(0, 200);
  const key = await clientKey(email);
  if (throttled(key)) return bad("محاولات كثيرة خاطئة. حاول مرة أخرى بعد ١٥ دقيقة.", 429);

  const u = await login(email, password);
  if (!u) {
    recordFailure(key);
    await new Promise((r) => setTimeout(r, 700));
    return bad("البريد الإلكتروني أو كلمة المرور غير صحيحة", 401);
  }
  clearFailures(key);
  await createSession(u.id, u.sessionVersion, isSecure(req));
  await logAudit({
    user: { id: u.id, email: u.email, name: u.name, role: u.role, permissions: u.permissions, mustChangePassword: u.mustChangePassword },
    action: "login",
    entity: "user",
    entityId: u.id,
    summary: `تسجيل دخول: ${u.name}`,
  });
  return Response.json({ ok: true, mustChange: u.mustChangePassword });
}

export async function DELETE() {
  const a = await auth(undefined, { allowMustChange: true });
  await destroySession();
  return a.deny ? Response.json({ ok: true }) : Response.json({ ok: true });
}
