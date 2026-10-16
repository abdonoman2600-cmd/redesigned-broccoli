import { desc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { pageUser } from "@/lib/admin-auth";
import CustomersTable from "@/components/admin/CustomersTable";
import { Notice, PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  if (!(await pageUser("customers"))) notFound();
  const rows = await db
    .select({
      c: customers,
      orders: sql<number>`(select count(*)::int from orders o where o.customer_id = ${customers.id} and o.status <> 'cancelled')`,
      spent: sql<number>`(select coalesce(sum(o.total),0)::int from orders o where o.customer_id = ${customers.id} and o.status <> 'cancelled')`,
    })
    .from(customers)
    .orderBy(desc(customers.createdAt));
  return (
    <div>
      <PageTitle title="العملاء" hint="يُنشأ العميل تلقائيًا من طلباته. البيانات الشخصية تظهر فقط لمن لديه صلاحية «العملاء»." />
      <div className="mb-6"><Notice kind="info">حسابات تسجيل دخول للعملاء على المتجر غير مفعّلة حاليًا (الشراء كضيف). يمكنك مسح البيانات الشخصية لأي عميل عند طلبه؛ تبقى الطلبات للمحاسبة بدون هوية.</Notice></div>
      <CustomersTable rows={rows.map(({ c, orders, spent }) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email, city: c.city, notes: c.notes, orders, spent }))} />
    </div>
  );
}
