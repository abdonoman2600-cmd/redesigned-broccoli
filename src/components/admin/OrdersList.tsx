"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/admin-fetch";
import { formatDate, formatNumber, formatPrice, toTel } from "@/lib/format";
import { card, inputCls } from "./ui";

export const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  preparing: "قيد التجهيز",
  shipped: "تم الشحن",
  completed: "مكتمل",
  cancelled: "ملغي",
};
const PAY: Record<string, string> = { cash: "عند التسليم", transfer: "تحويل بنكي", wallet: "محفظة / إنستاباي" };

export type OrderRow = {
  id: number; orderNumber: string; createdAt: string; customerName: string; phone: string; email: string | null;
  city: string; address: string; preferredDate: string | null; notes: string | null; internalNote: string | null;
  paymentMethod: string; subtotal: number; shipping: number; discount: number; tax: number; total: number;
  couponCode: string | null; status: string; accessToken: string;
  items: { id: number; name: string; optionLabel: string | null; variant: string | null; unit: string; quantity: number; unitPrice: number }[];
};

export default function OrdersList({ orders, origin }: { orders: OrderRow[]; origin: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>(Object.fromEntries(orders.map((o) => [o.id, o.internalNote ?? ""])));
  const [err, setErr] = useState("");

  const patch = async (id: number, body: Record<string, unknown>) => {
    setBusy(id);
    setErr("");
    try {
      await api(`/api/admin/orders/${id}`, "PATCH", body);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
    setBusy(null);
  };

  const list = orders.filter((o) => filter === "all" || o.status === filter);
  const count = (s: string) => orders.filter((o) => o.status === s).length;

  const wa = (o: OrderRow) => {
    const phone = toTel(o.phone).replace(/^\+/, "").replace(/^0/, "20");
    const text = `مرحبًا ${o.customerName}، تم استلام طلبك رقم ${o.orderNumber} بقيمة ${formatPrice(o.total)}. حالة الطلب: ${STATUS_LABELS[o.status]}. تفاصيل الطلب: ${origin}/order/${o.orderNumber}?t=${o.accessToken} شكرًا لثقتك برشيد.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div>
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {[["all", "الكل", orders.length], ...Object.entries(STATUS_LABELS).map(([k, l]) => [k, l, count(k)])].map(([k, l, n]) => (
          <button key={String(k)} onClick={() => setFilter(String(k))} className={`shrink-0 rounded-full border px-5 py-2 text-sm font-bold ${filter === k ? "border-ink bg-ink text-white" : "border-stone-warm bg-white"}`}>
            {l} ({n})
          </button>
        ))}
      </div>
      {err && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <ul className="space-y-5">
        {list.map((o) => (
          <li key={o.id} className={`${card} !p-6 ${busy === o.id ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-display text-xl font-bold" dir="ltr">{o.orderNumber}</span>
                <span className="ms-3 text-sm text-muted">{formatDate(o.createdAt)}</span>
              </div>
              <select value={o.status} onChange={(e) => patch(o.id, { status: e.target.value })} className={`rounded-full border px-4 py-2 text-sm font-bold outline-none ${o.status === "new" ? "border-brass bg-brass/10 text-brass-dark" : o.status === "cancelled" ? "border-red-200 bg-red-50 text-red-700" : "border-stone-warm bg-white"}`}>
                {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
              <div>
                <b>{o.customerName}</b>
                <a href={`tel:${toTel(o.phone)}`} dir="ltr" className="block text-brass-dark hover:underline" style={{ textAlign: "start" }}>{o.phone}</a>
                {o.email && <a href={`mailto:${o.email}`} dir="ltr" className="block text-xs text-muted" style={{ textAlign: "start" }}>{o.email}</a>}
                <a href={wa(o)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block rounded-full bg-[#25D366] px-3 py-1 text-xs font-bold text-white">إرسال تأكيد واتساب</a>
              </div>
              <div className="text-muted">
                {o.city}، {o.address}
                {o.preferredDate && <div>الموعد المفضل: {formatDate(o.preferredDate)}</div>}
                {o.notes && <div>ملاحظات العميل: {o.notes}</div>}
              </div>
              <div className="text-muted">
                الدفع: {PAY[o.paymentMethod] ?? o.paymentMethod}
                {o.discount > 0 && <div>خصم {o.couponCode}: − {formatPrice(o.discount)}</div>}
                <div>شحن: {o.shipping ? formatPrice(o.shipping) : "مجاني"}{o.tax > 0 && <> · ضريبة: {formatPrice(o.tax)}</>}</div>
                <div className="text-lg font-bold text-ink">{formatPrice(o.total)}</div>
              </div>
            </div>
            <ul className="mt-4 space-y-1 border-t border-stone-warm pt-4 text-sm">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4">
                  <span>{i.name}{(i.optionLabel || i.variant) && <span className="text-muted"> · {[i.optionLabel, i.variant].filter(Boolean).join(" · ")}</span>}</span>
                  <span className="shrink-0 text-muted">{formatNumber(i.quantity)} {i.unit}</span>
                </li>
              ))}
            </ul>
            <textarea
              className={`${inputCls} mt-4 min-h-16 text-sm`}
              placeholder="ملاحظة داخلية (لا يراها العميل)..."
              value={notes[o.id]}
              onChange={(e) => setNotes((n) => ({ ...n, [o.id]: e.target.value }))}
              onBlur={() => notes[o.id] !== (o.internalNote ?? "") && patch(o.id, { internalNote: notes[o.id] })}
            />
          </li>
        ))}
        {list.length === 0 && <li className="rounded-3xl bg-sand p-12 text-center text-muted">لا توجد طلبات.</li>}
      </ul>
    </div>
  );
}
