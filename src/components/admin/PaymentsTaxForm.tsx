"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/admin-fetch";
import type { PaymentMethod } from "@/lib/types";
import { btn, card, inputCls, Label, Notice } from "./ui";

export default function PaymentsTaxForm({ payments, taxRate, taxIncluded }: { payments: PaymentMethod[]; taxRate: number; taxIncluded: boolean }) {
  const router = useRouter();
  const [pay, setPay] = useState(payments);
  const [rate, setRate] = useState(String(taxRate));
  const [incl, setIncl] = useState(taxIncluded);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/admin/settings", "PUT", { payments: pay, taxRate: Number(rate) || 0, taxIncluded: incl });
      setMsg({ ok: true, text: "تم الحفظ والنشر ✓" });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "تعذّر الحفظ" });
    }
    setBusy(false);
  };

  return (
    <section className={card}>
      <h2 className="font-display text-2xl font-bold">وسائل الدفع</h2>
      <p className="mb-5 mt-1 text-sm text-muted">فعّل ما تقبله وعدّل النص الذي يراه العميل (مثل رقم الحساب البنكي أو رقم المحفظة).</p>
      <div className="space-y-4">
        {pay.map((p, i) => (
          <div key={p.id} className="rounded-2xl border border-stone-warm p-4">
            <label className="mb-3 flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="h-5 w-5 accent-[#a97c3f]" checked={p.enabled} onChange={(e) => setPay(pay.map((x, k) => (k === i ? { ...x, enabled: e.target.checked } : x)))} />
              <b>{p.enabled ? "مفعّلة" : "متوقفة"}</b>
            </label>
            <input className={inputCls} value={p.label} onChange={(e) => setPay(pay.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
            <textarea className={`${inputCls} mt-3 min-h-20`} value={p.description} onChange={(e) => setPay(pay.map((x, k) => (k === i ? { ...x, description: e.target.value } : x)))} placeholder="تعليمات الدفع..." />
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-2xl font-bold">الضرائب</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <Label label="نسبة الضريبة ٪" hint="٠ = بدون ضريبة. مثال مصر: ١٤"><input type="number" min={0} max={100} step="0.5" className={inputCls} value={rate} onChange={(e) => setRate(e.target.value)} /></Label>
        <Label label="طريقة الاحتساب">
          <select className={inputCls} value={incl ? "1" : "0"} onChange={(e) => setIncl(e.target.value === "1")}>
            <option value="1">الأسعار شاملة الضريبة (تُعرض فقط في الفاتورة)</option>
            <option value="0">تُضاف الضريبة فوق الأسعار</option>
          </select>
        </Label>
      </div>
      {msg && <div className="mt-5"><Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice></div>}
      <button onClick={save} disabled={busy} className={`${btn} mt-6`}>{busy ? "جارٍ الحفظ..." : "حفظ وسائل الدفع والضريبة"}</button>
    </section>
  );
}
