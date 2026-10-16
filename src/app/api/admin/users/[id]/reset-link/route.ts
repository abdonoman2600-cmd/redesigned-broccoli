import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth, createResetToken } from "@/lib/admin-auth";
import { bad, origin } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await auth("owner");
  if (a.deny) return a.deny;
  const id = Number((await params).id);
  const [u] = await db.select().from(users).where(eq(users.id, id));
  if (!u) return bad("غير موجود", 404);
  const token = await createResetToken(id, 24);
  await logAudit({ user: a.user, action: "reset-link", entity: "user", entityId: id, summary: `إنشاء رابط إعادة كلمة المرور: ${u.name}` });
  return Response.json({ ok: true, link: `${origin(req)}/admin/reset/${token}` });
}
