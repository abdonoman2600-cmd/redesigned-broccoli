import { eq } from "drizzle-orm";
import { db } from "@/db";
import { drafts } from "@/db/schema";
import { auth, can } from "@/lib/admin-auth";
import { readBody } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const a = await auth();
  if (a.deny) return a.deny;
  const { id } = await readBody(req);
  const rows = id ? await db.select().from(drafts).where(eq(drafts.id, Number(id))) : await db.select().from(drafts);
  let n = 0;
  for (const r of rows) {
    if (!can(a.user, r.scope === "product" ? "products" : "content")) continue;
    await db.delete(drafts).where(eq(drafts.id, r.id));
    n++;
  }
  if (n) await logAudit({ user: a.user, action: "discard", entity: "draft", summary: `تجاهل ${n} تعديل غير منشور` });
  return Response.json({ ok: true, discarded: n });
}
