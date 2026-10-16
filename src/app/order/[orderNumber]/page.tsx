import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { clientKey, recordFailure, throttled } from "@/lib/admin-auth";
import { digits } from "@/lib/api";
import { getPayments, getSettings } from "@/lib/data";
import { formatDate, formatNumber, formatPrice, img, toTel } from "@/lib/format";
import { CheckIcon, PhoneIcon } from "@/components/Icons";

import Money from "@/components/Money";
import T from "@/components/T";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "طلبك", robots: { index: false, follow: false } };

const STEPS = [
  ["new", "تم الاستلام"],
  ["preparing", "قيد التجهيز"],
  ["shipped", "تم الشحن"],
  ["completed", "مكتمل"],
] as const;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ t?: string; phone?: string }>;
}) {
  const { orderNumber } = await params;
  const sp = await searchParams;
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
  if (!order) notFound();

  // Order details contain personal data: require the private link token OR the phone used for the order.
  const tokenOk = !!sp.t && sp.t === order.accessToken;
  let phoneOk = false;
  let phoneWrong = false;
  if (!tokenOk && sp.phone) {
    const key = await clientKey(`order|${orderNumber}`);
    if (!throttled(key)) {
      phoneOk = digits(sp.phone).replace(/\D/g, "") === digits(order.phone).replace(/\D/g, "");
      if (!phoneOk) {
        recordFailure(key);
        phoneWrong = true;
      }
    } else phoneWrong = true;
  }

  if (!tokenOk && !phoneOk) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-3xl font-bold">تتبّع الطلب {orderNumber}</h1>
        <p className="mt-3 text-muted"><T>لحماية بياناتك، أدخل رقم الهاتف الذي استخدمته في الطلب لعرض التفاصيل.</T></p>
        <form className="mt-8 space-y-4">
          <input name="phone" dir="ltr" inputMode="tel" placeholder="01xxxxxxxxx" className="w-full rounded-xl border border-stone-warm bg-white px-4 py-3.5 outline-none focus:border-brass" required />
          {phoneWrong && <p className="text-sm text-red-600"><T>رقم الهاتف غير مطابق أو تجاوزت عدد المحاولات.</T></p>}
          <button className="w-full rounded-full bg-ink py-4 font-bold text-white hover:bg-brass-dark"><T>عرض الطلب</T></button>
        </form>
      </div>
    );
  }

  const [items, site, payments] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    getSettings(),
    getPayments(),
  ]);
  const pay = payments.find((p) => p.id === order.paymentMethod);
  const stepIndex = order.status === "cancelled" ? -1 : STEPS.findIndex(([s]) => s === order.status);

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="text-center">
        <div className="animate-pop mx-auto grid h-24 w-24 place-items-center rounded-full bg-brass text-white shadow-xl shadow-brass/30">
          <CheckIcon width={48} height={48} strokeWidth={2} />
        </div>
        <h1 className="animate-fade-up mt-8 text-4xl font-bold md:text-5xl">شكرًا لك، {order.customerName.split(" ")[0]}!</h1>
        <p className="animate-fade-up delay-1 mt-4 leading-8 text-muted">
          <T>تم استلام طلبك بنجاح. سيتواصل معك فريقنا على</T> <span dir="ltr" className="font-bold text-ink">{order.phone}</span> <T>خلال ساعات لتأكيد الموعد.</T>
        </p>
        <div className="animate-fade-up delay-2 mt-6 inline-flex items-center gap-3 rounded-full bg-sand px-6 py-3">
          <span className="text-sm text-muted"><T>رقم الطلب</T></span>
          <span className="font-display text-xl font-bold tracking-wider" dir="ltr">{order.orderNumber}</span>
        </div>
        <p className="mt-3 text-xs text-muted"><T>احتفظ برقم الطلب ورقم هاتفك لمتابعة الحالة لاحقًا.</T></p>
      </div>

      <div className="mt-10 rounded-3xl border border-stone-warm bg-white p-6 md:p-8">
        {order.status === "cancelled" ? (
          <p className="text-center font-bold text-red-600"><T>تم إلغاء هذا الطلب</T></p>
        ) : (
          <ol className="grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
            {STEPS.map(([s, label], i) => (
              <li key={s} className="flex flex-col items-center gap-2">
                <span className={`grid h-9 w-9 place-items-center rounded-full font-bold ${i <= stepIndex ? "bg-brass text-white" : "bg-sand text-muted"}`}>
                  {i <= stepIndex ? <CheckIcon width={16} height={16} /> : i + 1}
                </span>
                <span className={i <= stepIndex ? "font-bold" : "text-muted"}>{label}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-stone-warm bg-white p-6 md:p-8">
        <h2 className="font-display text-2xl font-bold"><T>تفاصيل الطلب</T></h2>
        <ul className="mt-6 divide-y divide-stone-warm/70">
          {items.map((it) => (
            <li key={it.id} className="flex gap-4 py-4 first:pt-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(it.image, 200)} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-6">{it.name}</p>
                <p className="text-sm text-muted">
                  {[it.optionLabel, it.variant].filter(Boolean).join(" · ")}
                  {(it.optionLabel || it.variant) && " · "}
                  {formatNumber(it.quantity)} {it.unit} × <Money v={it.unitPrice} />
                </p>
              </div>
              <span className="shrink-0 font-bold"><Money v={it.unitPrice * it.quantity} /></span>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 border-t border-stone-warm pt-6 text-sm">
          <div className="flex justify-between"><dt className="text-muted"><T>المجموع الفرعي</T></dt><dd><Money v={order.subtotal} /></dd></div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-700"><dt>الخصم {order.couponCode && `(${order.couponCode})`}</dt><dd>- <Money v={order.discount} /></dd></div>
          )}
          <div className="flex justify-between"><dt className="text-muted"><T>الشحن والتجهيز</T></dt><dd>{order.shipping === 0 ? "مجاني" : formatPrice(order.shipping)}</dd></div>
          {order.tax > 0 && <div className="flex justify-between"><dt className="text-muted"><T>الضريبة</T></dt><dd><Money v={order.tax} /></dd></div>}
          <div className="flex justify-between pt-2 text-xl font-bold"><dt><T>الإجمالي</T></dt><dd><Money v={order.total} /></dd></div>
        </dl>

        <div className="mt-8 grid gap-6 border-t border-stone-warm pt-6 text-sm sm:grid-cols-2">
          <div>
            <h3 className="font-bold"><T>عنوان التنفيذ</T></h3>
            <p className="mt-1 leading-7 text-muted">{order.city}، {order.address}</p>
          </div>
          <div>
            <h3 className="font-bold"><T>طريقة الدفع</T></h3>
            <p className="mt-1 text-muted">{pay?.label ?? order.paymentMethod}</p>
            {pay && order.paymentMethod !== "cash" && <p className="mt-1 leading-7 text-muted">{pay.description}</p>}
          </div>
          {order.preferredDate && (
            <div><h3 className="font-bold"><T>موعد المعاينة المفضل</T></h3><p className="mt-1 text-muted">{formatDate(order.preferredDate)}</p></div>
          )}
          {order.notes && (
            <div><h3 className="font-bold"><T>ملاحظاتك</T></h3><p className="mt-1 leading-7 text-muted">{order.notes}</p></div>
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link href="/shop" className="rounded-full bg-ink px-9 py-4 font-bold text-white transition hover:bg-brass-dark"><T>متابعة التسوق</T></Link>
        <a href={`tel:${toTel(site.phone)}`} className="flex items-center gap-2 rounded-full border border-ink/20 px-9 py-4 font-bold transition hover:bg-sand">
          <PhoneIcon width={18} height={18} /> <T>اتصل بنا</T>
        </a>
      </div>
    </div>
  );
}
