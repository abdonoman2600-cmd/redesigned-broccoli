import { eq } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { readBody } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const a = await auth("orders");
  if (a.deny) return a.deny;
  const b = await readBody(req);
  await db.update(messages).set({ read: b.read !== false }).where(eq(messages.id, Number((await params).id)));
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const a = await auth("orders");
  if (a.deny) return a.deny;
  await db.delete(messages).where(eq(messages.id, Number((await params).id)));
  return Response.json({ ok: true });
}
