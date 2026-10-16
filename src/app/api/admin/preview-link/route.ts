import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { bad, origin, readBody } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Create / revoke the shareable READ-ONLY preview link (shows unpublished drafts, no editing tools). */
export async function POST(req: Request) {
  const a = await auth("content");
  if (a.deny) return a.deny;
  const { action } = await readBody(req);
  if (action === "revoke") {
    await db.delete(settings).where(eq(settings.key, "previewToken"));
    await logAudit({ user: a.user, action: "revoke", entity: "preview", summary: "إلغاء رابط المعاينة" });
    return Response.json({ ok: true });
  }
  if (action !== "create") return bad("إجراء غير صالح");
  const token = randomBytes(18).toString("hex");
  await db.insert(settings).values({ key: "previewToken", value: token }).onConflictDoUpdate({ target: settings.key, set: { value: token } });
  await logAudit({ user: a.user, action: "create", entity: "preview", summary: "إنشاء رابط معاينة جديد" });
  return Response.json({ ok: true, url: `${origin(req)}/preview/${token}` });
}
