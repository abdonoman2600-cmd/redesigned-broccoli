import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { bad, readBody, str } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const ORDER_STATUSES = ["new", "preparing", "shipped", "completed", "cancelled"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await auth("orders");
  if (a.deny) return a.deny;
  const id = Number((await params).id);
  const [cur] = await db.select().from(orders).where(eq(orders.id, id));
  if (!cur) return bad("الطلب غير موجود", 404);
  const b = await readBody(req);
  const set: Partial<typeof orders.$inferInsert> = {};

  if (b.status !== undefined) {
    if (!ORDER_STATUSES.includes(String(b.status))) return bad("حالة غير صالحة");
    set.status = String(b.status);
  }
  if (b.internalNote !== undefined) set.internalNote = str(b.internalNote, 1000) || null;

  try {
    await db.transaction(async (tx) => {
      const wasCancelled = cur.status === "cancelled";
      const willCancel = set.status === "cancelled";
      if (set.status && willCancel !== wasCancelled) {
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
        for (const it of items) {
          const [p] = await tx.select({ stock: products.stock }).from(products).where(eq(products.id, it.productId));
          if (!p || p.stock === null) continue;
          if (willCancel) {
            await tx.update(products).set({ stock: sql`${products.stock} + ${it.quantity}` }).where(eq(products.id, it.productId));
          } else {
            const ok = await tx
              .update(products)
              .set({ stock: sql`${products.stock} - ${it.quantity}` })
              .where(sql`${products.id} = ${it.productId} and ${products.stock} >= ${it.quantity}`)
              .returning({ id: products.id });
            if (!ok.length) throw new Error("STOCK");
          }
        }
      }
      await tx.update(orders).set(set).where(eq(orders.id, id));
    });
  } catch (e) {
    if (e instanceof Error && e.message === "STOCK") return bad("المخزون غير كافٍ لإعادة تفعيل هذا الطلب");
    return bad("تعذّر الحفظ", 500);
  }
  await logAudit({
    user: a.user, action: "update", entity: "order", entityId: id,
    summary: `طلب ${cur.orderNumber}: ${set.status ? `الحالة → ${set.status}` : "ملاحظة داخلية"}`,
  });
  return Response.json({ ok: true });
}
