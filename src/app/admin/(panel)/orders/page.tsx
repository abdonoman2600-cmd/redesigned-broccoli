import { desc } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { resolveOrigin } from "@/lib/origin";
import { pageUser } from "@/lib/admin-auth";
import { notFound } from "next/navigation";
import OrdersList from "@/components/admin/OrdersList";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  if (!(await pageUser("orders"))) notFound();
  const [list, items, h] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200),
    db.select().from(orderItems),
    headers(),
  ]);
  const by = new Map<number, typeof items>();
  items.forEach((i) => by.set(i.orderId, [...(by.get(i.orderId) ?? []), i]));
  const origin = resolveOrigin(h.get("x-forwarded-host") ?? h.get("host"), h.get("x-forwarded-proto"));
  return (
    <div>
      <PageTitle title="الطلبات" hint="غيّر حالة الطلب، أضف ملاحظة داخلية، وأرسل تأكيدًا للعميل على واتساب. عند الإلغاء يعود المخزون تلقائيًا." />
      <OrdersList
        origin={origin}
        orders={list.map((o) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
          items: (by.get(o.id) ?? []).map((i) => ({ id: i.id, name: i.name, optionLabel: i.optionLabel, variant: i.variant, unit: i.unit, quantity: i.quantity, unitPrice: i.unitPrice })),
        }))}
      />
    </div>
  );
}
