import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { drafts } from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { bad, digits, readBody, str } from "@/lib/api";
import { contentStorageKey } from "@/lib/data";
import { getSetting } from "@/lib/settings-store";

export const dynamic = "force-dynamic";

/** Saves ONE piece of in-place content as an unpublished DRAFT. Nothing changes for visitors until "publish". */
export async function PUT(req: Request) {
  const a = await auth("content");
  if (a.deny) return a.deny;
  const b = await readBody(req);
  const key = str(b.key, 90);
  if (!/^[a-zA-Z0-9_.-]{1,90}$/.test(key)) return bad("مفتاح غير صالح");

  const storage = contentStorageKey(key);
  let value = str(b.value, 2000);
  if (storage === "whatsapp") value = digits(value).replace(/\D/g, "");
  if (key.includes("image") && value && !(value.startsWith("/api/media/") || /^https?:\/\//.test(value))) {
    return bad("رابط الصورة غير صالح");
  }

  const published = (await getSetting(storage)) ?? "";
  if (value === published) {
    await db.delete(drafts).where(and(eq(drafts.scope, "content"), eq(drafts.ref, key)));
  } else {
    await db
      .insert(drafts)
      .values({ scope: "content", ref: key, data: { value }, updatedBy: a.user.name })
      .onConflictDoUpdate({ target: [drafts.scope, drafts.ref], set: { data: { value }, updatedBy: a.user.name, updatedAt: new Date() } });
  }
  return Response.json({ ok: true });
}
