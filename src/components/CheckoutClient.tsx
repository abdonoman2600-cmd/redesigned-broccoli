"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "./CartProvider";
import { formatNumber, formatPrice, img } from "@/lib/format";
import { computeTotals, type CouponInfo, type Zone } from "@/lib/totals";
import type { PaymentMethod } from "@/lib/types";
import { CheckIcon, ShieldIcon } from "./Icons";

import Money from "@/components/Money";
import T from "@/components/T";
type Errors = Record<string, string>;

export default function CheckoutClient({
  payments,
  zones,
  taxRate,
  taxIncluded,
}: {
  payments: PaymentMethod[];
  zones: Zone[];
  taxRate: number;
  taxIncluded: boolean;
}) {
  const router = useRouter();
  const { items, hydrated, subtotal, clear, openCart } = useCart();
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    preferredDate: "",
    notes: "",
    paymentMethod: payments[0]?.id ?? "cash",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<CouponInfo>(null);
  const [couponMsg, setCouponMsg] = useState("");

  const cities = useMemo(
    () => [...new Set(zones.flatMap((z) => z.regions.split(/[,،]/).map((s) => s.trim()).filter(Boolean)))],
    [zones],
  );

  const totals = useMemo(
    () => computeTotals({ subtotal, city: form.city, zones, taxRate, taxIncluded, coupon }),
    [subtotal, form.city, zones, taxRate, taxIncluded, coupon],
  );

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: "" }));
  };

  const applyCoupon = async () => {
    setCouponMsg("");
    if (!code.trim()) return;
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotal }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setCoupon(d.coupon);
      setCouponMsg("تم تطبيق كود الخصم ✓");
    } else {
      setCoupon(null);
      setCouponMsg(d.error || "كود غير صالح");
    }
  };

  const validate = () => {
    const e: Errors = {};
    if (form.customerName.trim().length < 3) e.customerName = "من فضلك أدخل الاسم بالكامل";
    if (!/^[+0-9٠-٩]{8,15}$/.test(form.phone.replace(/[\s-]/g, ""))) e.phone = "رقم الهاتف غير صحيح";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "البريد الإلكتروني غير صحيح";
    if (form.city.trim().length < 2) e.city = "أدخل المدينة";
    if (form.address.trim().length < 6) e.address = "أدخل العنوان بالتفصيل";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) {
      document.querySelector("[data-error='true']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          couponCode: coupon?.code ?? "",
          items: items.map((i) => ({ productId: i.productId, optionLabel: i.optionLabel, quantity: i.quantity, color: i.color, size: i.size })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.error || "تعذّر إتمام الطلب");
      }
      setDone(true);
      router.push(`/order/${data.orderNumber}?t=${data.token}`);
      setTimeout(clear, 400);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      setBusy(false);
    }
  };

  const field = (hasErr: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-3.5 outline-none transition focus:ring-4 ${
      hasErr ? "border-red-400 focus:ring-red-100" : "border-stone-warm focus:border-brass focus:ring-brass/15"
    }`;

  if (!hydrated || done) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-warm border-t-brass" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-bold"><T>سلتك فارغة</T></h1>
        <p className="mt-3 text-muted"><T>أضف بعض المنتجات أولًا ثم عد لإتمام الطلب.</T></p>
        <Link href="/shop" className="mt-8 rounded-full bg-ink px-9 py-4 font-bold text-white hover:bg-brass-dark">
          <T>تصفح المنتجات</T>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <ol className="flex items-center gap-3 text-sm">
          <li className="flex items-center gap-2 text-muted">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brass text-white"><CheckIcon width={14} height={14} /></span>
            <T>السلة</T>
          </li>
          <span className="h-px w-8 bg-stone-warm" />
          <li className="flex items-center gap-2 font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-white">2</span>
            <T>بيانات الطلب</T>
          </li>
          <span className="h-px w-8 bg-stone-warm" />
          <li className="flex items-center gap-2 text-muted">
            <span className="grid h-7 w-7 place-items-center rounded-full border border-stone-warm">3</span>
            <T>التأكيد</T>
          </li>
        </ol>
        <h1 className="mt-6 text-4xl font-bold"><T>إتمام الطلب</T></h1>
      </div>

      <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="space-y-8">
          <section className="rounded-3xl border border-stone-warm bg-white p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold"><T>1. بيانات التواصل</T></h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block" data-error={!!errors.customerName}>
                <span className="mb-2 block text-sm font-bold"><T>الاسم بالكامل *</T></span>
                <input className={field(!!errors.customerName)} value={form.customerName} onChange={set("customerName")} autoComplete="name" />
                {errors.customerName && <span className="mt-1 block text-sm text-red-600">{errors.customerName}</span>}
              </label>
              <label className="block" data-error={!!errors.phone}>
                <span className="mb-2 block text-sm font-bold"><T>رقم الموبايل *</T></span>
                <input className={field(!!errors.phone)} value={form.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="01xxxxxxxxx" dir="ltr" style={{ textAlign: "start" }} />
                {errors.phone && <span className="mt-1 block text-sm text-red-600">{errors.phone}</span>}
              </label>
              <label className="block sm:col-span-2" data-error={!!errors.email}>
                <span className="mb-2 block text-sm font-bold"><T>البريد الإلكتروني (اختياري)</T></span>
                <input className={field(!!errors.email)} value={form.email} onChange={set("email")} inputMode="email" autoComplete="email" dir="ltr" style={{ textAlign: "start" }} />
                {errors.email && <span className="mt-1 block text-sm text-red-600">{errors.email}</span>}
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-stone-warm bg-white p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold"><T>2. موقع التنفيذ والموعد</T></h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block" data-error={!!errors.city}>
                <span className="mb-2 block text-sm font-bold"><T>المدينة / المحافظة *</T></span>
                <input className={field(!!errors.city)} value={form.city} onChange={set("city")} list="cities" autoComplete="address-level2" />
                <datalist id="cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
                {errors.city && <span className="mt-1 block text-sm text-red-600">{errors.city}</span>}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold"><T>موعد المعاينة المفضل</T></span>
                <input type="date" className={field(false)} value={form.preferredDate} onChange={set("preferredDate")} min={new Date().toISOString().slice(0, 10)} />
              </label>
              <label className="block sm:col-span-2" data-error={!!errors.address}>
                <span className="mb-2 block text-sm font-bold"><T>العنوان بالتفصيل *</T></span>
                <input className={field(!!errors.address)} value={form.address} onChange={set("address")} autoComplete="street-address" />
                {errors.address && <span className="mt-1 block text-sm text-red-600">{errors.address}</span>}
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold"><T>ملاحظات إضافية</T></span>
                <textarea className={`${field(false)} min-h-24`} value={form.notes} onChange={set("notes")} />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-stone-warm bg-white p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold"><T>3. طريقة الدفع</T></h2>
            <div className="mt-6 space-y-3">
              {payments.map((p) => {
                const active = form.paymentMethod === p.id;
                return (
                  <label key={p.id} className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition ${active ? "border-brass bg-brass/5" : "border-stone-warm hover:border-brass/50"}`}>
                    <input type="radio" name="payment" className="sr-only" checked={active} onChange={() => setForm((f) => ({ ...f, paymentMethod: p.id }))} />
                    <span className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-brass" : "border-stone-warm"}`}>
                      {active && <span className="h-2.5 w-2.5 rounded-full bg-brass" />}
                    </span>
                    <span>
                      <span className="block font-bold">{p.label}</span>
                      <span className="mt-0.5 block text-sm text-muted">{p.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_50px_-20px_rgba(27,26,23,0.25)] ring-1 ring-stone-warm md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold"><T>ملخص الطلب</T></h2>
              <button type="button" onClick={openCart} className="text-sm font-bold text-brass-dark hover:underline"><T>تعديل</T></button>
            </div>
            <ul className="mt-6 max-h-80 divide-y divide-stone-warm/70 overflow-y-auto">
              {items.map((it) => (
                <li key={it.key} className="flex gap-4 py-4 first:pt-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(it.image, 200)} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold leading-6">{it.name}</p>
                    <p className="text-xs text-muted">
                      {[it.optionLabel, it.variant].filter(Boolean).join(" · ")}
                      {(it.optionLabel || it.variant) && " · "}
                      {formatNumber(it.quantity)} {it.unit}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold"><Money v={it.unitPrice * it.quantity} /></span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="كود الخصم"
                dir="ltr"
                className="min-w-0 flex-1 rounded-xl border border-stone-warm px-4 py-2.5 text-sm outline-none focus:border-brass"
              />
              <button type="button" onClick={applyCoupon} className="rounded-xl border border-ink/20 px-5 text-sm font-bold hover:bg-ink hover:text-white"><T>تطبيق</T></button>
            </div>
            {couponMsg && <p className={`mt-2 text-xs ${coupon ? "text-green-700" : "text-red-600"}`}>{couponMsg}</p>}

            <dl className="mt-6 space-y-3 border-t border-stone-warm pt-6 text-sm">
              <div className="flex justify-between"><dt className="text-muted"><T>المجموع الفرعي</T></dt><dd><Money v={subtotal} /></dd></div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-green-700"><dt><T>الخصم</T></dt><dd>- <Money v={totals.discount} /></dd></div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted"><T>الشحن والتجهيز</T></dt>
                <dd>{totals.shipping === 0 ? <span className="font-bold text-green-700"><T>مجاني</T></span> : formatPrice(totals.shipping)}</dd>
              </div>
              {totals.tax > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted"><T>{totals.taxIncluded ? "الضريبة (شاملة)" : "الضريبة"}</T></dt>
                  <dd><Money v={totals.tax} /></dd>
                </div>
              )}
              {!form.city.trim() && zones.length > 1 && <p className="text-xs text-muted"><T>أدخل المدينة لحساب الشحن بدقة.</T></p>}
              <div className="flex justify-between border-t border-stone-warm pt-4 text-xl font-bold"><dt><T>الإجمالي</T></dt><dd><Money v={totals.total} /></dd></div>
            </dl>

            {serverError && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{serverError}</p>}

            <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-lg font-bold text-white transition hover:bg-brass-dark disabled:opacity-60">
              <T>{busy ? "جارٍ تأكيد الطلب..." : "تأكيد الطلب"}</T>
            </button>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
              <ShieldIcon width={16} height={16} className="text-brass" />
              <T>لن يتم خصم أي مبلغ الآن. سنتواصل معك لتأكيد الموعد.</T>
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
