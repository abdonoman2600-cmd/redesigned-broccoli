import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { readBody } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const a = await auth();
  if (a.deny) return a.deny;
  const b = await readBody(req);
  if (b.id) await db.update(notifications).set({ read: true }).where(eq(notifications.id, Number(b.id)));
  else await db.update(notifications).set({ read: true });
  return Response.json({ ok: true });
}
