import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { pageUser } from "@/lib/admin-auth";
import { formatNumber, formatPrice } from "@/lib/format";
import { card, PageTitle } from "@/components/admin/ui";
import { STATUS_LABELS } from "@/components/admin/OrdersList";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  if (!(await pageUser("reports"))) notFound();
  const [totals] = (await db.execute(sql`
    select count(*)::int as orders,
           coalesce(sum(total) filter (where status <> 'cancelled'),0)::int as revenue,
           coalesce(avg(total) filter (where status <> 'cancelled'),0)::int as avg,
           count(*) filter (where status = 'cancelled')::int as cancelled,
           coalesce(sum(discount) filter (where status <> 'cancelled'),0)::int as discounts
    from orders`)).rows as { orders: number; revenue: number; avg: number; cancelled: number; discounts: number }[];
  const daily = (await db.execute(sql`
    select to_char(d, 'MM-DD') as day, coalesce(sum(o.total) filter (where o.status <> 'cancelled'),0)::int as revenue, count(o.id)::int as orders
    from generate_series(current_date - interval '29 days', current_date, interval '1 day') d
    left join orders o on o.created_at::date = d::date
    group by d order by d`)).rows as { day: string; revenue: number; orders: number }[];
  const byStatus = (await db.execute(sql`select status, count(*)::int as n from orders group by status`)).rows as { status: string; n: number }[];
  const top = (await db.execute(sql`
    select i.name, sum(i.quantity)::int as qty, sum(i.quantity * i.unit_price)::int as revenue
    from order_items i join orders o on o.id = i.order_id
    where o.status <> 'cancelled' group by i.name order by revenue desc limit 8`)).rows as { name: string; qty: number; revenue: number }[];

  const max = Math.max(1, ...daily.map((d) => d.revenue));
  const kpis = [
    ["إجمالي المبيعات", formatPrice(totals.revenue)],
    ["عدد الطلبات", formatNumber(totals.orders)],
    ["متوسط قيمة الطلب", formatPrice(totals.avg)],
    ["طلبات ملغاة", formatNumber(totals.cancelled)],
    ["خصومات ممنوحة", formatPrice(totals.discounts)],
  ];
  return (
    <div className="space-y-8">
      <PageTitle title="التقارير والإحصائيات" hint="تُحسب من الطلبات الفعلية (بدون الملغاة)." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map(([t, v]) => (
          <div key={t} className={`${card} !p-5`}><p className="text-xs text-muted">{t}</p><p className="mt-2 font-display text-2xl font-bold">{v}</p></div>
        ))}
      </div>
      <section className={card}>
        <h2 className="font-display text-xl font-bold">المبيعات اليومية (آخر ٣٠ يومًا)</h2>
        <div className="mt-6 flex h-48 items-end gap-1" dir="ltr">
          {daily.map((d) => (
            <div key={d.day} className="group relative flex-1" title={`${d.day}: ${formatPrice(d.revenue)} (${d.orders} طلب)`}>
              <div className="w-full rounded-t bg-brass/80 transition group-hover:bg-brass-dark" style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted" dir="ltr"><span>{daily[0]?.day}</span><span>{daily[daily.length - 1]?.day}</span></div>
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <section className={card}>
          <h2 className="font-display text-xl font-bold">الطلبات حسب الحالة</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {byStatus.map((s) => <li key={s.status} className="flex justify-between"><span>{STATUS_LABELS[s.status] ?? s.status}</span><b>{formatNumber(s.n)}</b></li>)}
            {byStatus.length === 0 && <li className="text-muted">لا توجد بيانات بعد.</li>}
          </ul>
        </section>
        <section className={card}>
          <h2 className="font-display text-xl font-bold">الأكثر مبيعًا (بالقيمة)</h2>
          <ul className="mt-4 divide-y divide-stone-warm text-sm">
            {top.map((t) => <li key={t.name} className="flex justify-between gap-3 py-2"><span className="line-clamp-1">{t.name}</span><b className="shrink-0">{formatPrice(t.revenue)}</b></li>)}
            {top.length === 0 && <li className="py-2 text-muted">لا توجد بيانات بعد.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
