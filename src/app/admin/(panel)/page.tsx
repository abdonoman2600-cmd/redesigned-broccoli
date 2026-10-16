import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { drafts, messages, orders, products } from "@/db/schema";
import { can, getUser, recoveryEnabled } from "@/lib/admin-auth";
import { ensureSeeded } from "@/lib/data";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { card, Notice, PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await ensureSeeded();
  const user = (await getUser())!;
  const owner = user.role === "owner";

  const [[p], [o], [d], [m], low, recent] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int`, hidden: sql<number>`count(*) filter (where not active)::int` }).from(products),
    db.select({
      total: sql<number>`count(*)::int`,
      fresh: sql<number>`count(*) filter (where status = 'new')::int`,
      revenue: sql<number>`coalesce(sum(total) filter (where status <> 'cancelled'),0)::int`,
    }).from(orders),
    db.select({ n: sql<number>`count(*)::int` }).from(drafts),
    db.select({ n: sql<number>`count(*)::int` }).from(messages).where(eq(messages.read, false)),
    db.select({ id: products.id, name: products.name, stock: products.stock }).from(products).where(sql`${products.stock} is not null and ${products.stock} <= 5`).limit(8),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5),
  ]);

  const stats = [
    ["المنتجات", formatNumber(p.total), p.hidden ? `${formatNumber(p.hidden)} مخفي` : "كلها ظاهرة"],
    ["طلبات جديدة", formatNumber(o.fresh), `من ${formatNumber(o.total)} طلب`],
    ["إجمالي المبيعات", formatPrice(o.revenue), "بدون الطلبات الملغاة"],
    ["تعديلات غير منشورة", formatNumber(d.n), d.n ? "تنتظر النشر" : "كل شيء منشور"],
  ];

  return (
    <div>
      <PageTitle title={`أهلًا ${user.name} 👋`} hint="من هنا تتحكم في كل شيء يظهر في متجرك." />

      <Link href="/" className="mb-6 flex items-center justify-between gap-4 rounded-3xl bg-ink p-6 text-white transition hover:bg-brass-dark">
        <span>
          <b className="block font-display text-2xl">✎ تعديل المتجر مباشرة</b>
          <span className="text-sm text-white/70">افتح المتجر واضغط على أي نص أو صورة أو منتج لتعديله، ثم «نشر التغييرات»</span>
        </span>
        <span className="shrink-0 text-2xl">←</span>
      </Link>

      {d.n > 0 && can(user, "content") && (
        <Link href="/admin/publish" className="mb-6 block rounded-2xl bg-amber-50 p-5 text-amber-900 hover:bg-amber-100">
          ⚠️ لديك <b>{formatNumber(d.n)}</b> تعديل غير منشور. راجعها وانشرها من هنا.
        </Link>
      )}
      {m.n > 0 && <Link href="/admin/messages" className="mb-6 block rounded-2xl bg-sand p-5 hover:bg-stone-warm">✉️ لديك <b>{formatNumber(m.n)}</b> رسالة جديدة من العملاء.</Link>}

      <div className="grid gap-5 md:grid-cols-4">
        {stats.map(([t, v, s]) => (
          <div key={t} className={card + " !p-5"}>
            <p className="text-sm text-muted">{t}</p>
            <p className="mt-2 font-display text-3xl font-bold">{v}</p>
            <p className="mt-1 text-xs text-muted">{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className={card}>
          <h2 className="font-display text-xl font-bold">آخر الطلبات</h2>
          <ul className="mt-4 divide-y divide-stone-warm text-sm">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <span><b dir="ltr">{r.orderNumber}</b><span className="block text-xs text-muted">{r.customerName} · {formatDate(r.createdAt)}</span></span>
                <b>{formatPrice(r.total)}</b>
              </li>
            ))}
            {recent.length === 0 && <li className="py-6 text-center text-muted">لا توجد طلبات بعد.</li>}
          </ul>
        </section>
        <section className={card}>
          <h2 className="font-display text-xl font-bold">تنبيهات المخزون</h2>
          <ul className="mt-4 divide-y divide-stone-warm text-sm">
            {low.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <Link href={`/admin/products/${r.id}`} className="hover:text-brass-dark">{r.name}</Link>
                <b className={r.stock === 0 ? "text-red-600" : "text-amber-700"}>{r.stock === 0 ? "نفد" : `متبقي ${r.stock}`}</b>
              </li>
            ))}
            {low.length === 0 && <li className="py-6 text-center text-muted">لا توجد منتجات منخفضة المخزون.</li>}
          </ul>
        </section>
      </div>

      {owner && (
        <section className={`${card} mt-8`}>
          <h2 className="font-display text-xl font-bold">قائمة الإعداد (ما يحتاج تفعيلًا منك)</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>{recoveryEnabled() ? "✅" : "⚠️"} استعادة كلمة المرور: {recoveryEnabled() ? "مفعّلة" : "أضف المتغير ADMIN_RECOVERY_KEY في الاستضافة"}</li>
            <li>{process.env.NOTIFY_WEBHOOK_URL ? "✅" : "ℹ️"} إشعار خارجي بالطلبات الجديدة (واتساب/تيليجرام/سلاك عبر ويبهوك): {process.env.NOTIFY_WEBHOOK_URL ? "مفعّل" : "اختياري — أضف NOTIFY_WEBHOOK_URL"}</li>
            <li>ℹ️ البريد الإلكتروني (رسائل التأكيد للعملاء): غير مفعّل — يحتاج خدمة بريد (SMTP/Resend). الإشعارات تصلك داخل اللوحة.</li>
            <li>ℹ️ الدفع الإلكتروني بالبطاقة: غير مربوط — يحتاج حساب بوابة دفع (Paymob/Fawry/Stripe) ومفاتيحها. المتاح الآن: الدفع عند التسليم، التحويل، المحافظ.</li>
          </ul>
          <div className="mt-4"><Notice kind="info">قاعدة البيانات PostgreSQL محفوظة بشكل دائم؛ لا تُفقد المنتجات والطلبات عند تحديث الموقع. حمّل نسخة احتياطية دوريًا من «النسخ الاحتياطي».</Notice></div>
        </section>
      )}
    </div>
  );
}
