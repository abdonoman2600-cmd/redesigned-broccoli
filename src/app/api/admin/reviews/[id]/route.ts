import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { guard } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard("content");
  if (denied) return denied;
  await db.delete(reviews).where(eq(reviews.id, Number((await params).id)));
  return Response.json({ ok: true });
}
