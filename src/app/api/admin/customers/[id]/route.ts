import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { bad, readBody, str } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const a = await auth("customers");
  if (a.deny) return a.deny;
  const id = Number((await params).id);
  const b = await readBody(req);
  const set: Partial<typeof customers.$inferInsert> = {};
  if (b.notes !== undefined) set.notes = str(b.notes, 1000);
  if (b.name !== undefined && str(b.name, 80).length >= 2) set.name = str(b.name, 80);
  if (b.email !== undefined) set.email = str(b.email, 120) || null;
  await db.update(customers).set(set).where(eq(customers.id, id));
  await logAudit({ user: a.user, action: "update", entity: "customer", entityId: id, summary: "تعديل بيانات عميل" });
  return Response.json({ ok: true });
}

/** Erase a customer's personal data (privacy request). Orders are kept for accounting but anonymised. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const a = await auth("customers");
  if (a.deny) return a.deny;
  const id = Number((await params).id);
  const [c] = await db.select().from(customers).where(eq(customers.id, id));
  if (!c) return bad("غير موجود", 404);
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ customerName: "عميل محذوف", phone: `deleted-${id}`, email: null, address: "—", notes: null, customerId: null })
      .where(eq(orders.customerId, id));
    await tx.delete(customers).where(eq(customers.id, id));
  });
  await logAudit({ user: a.user, action: "erase", entity: "customer", entityId: id, summary: `مسح البيانات الشخصية لعميل #${id}` });
  return Response.json({ ok: true });
}
