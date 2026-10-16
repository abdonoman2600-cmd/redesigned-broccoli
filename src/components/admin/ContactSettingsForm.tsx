"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/admin-fetch";
import { btn, card, inputCls, Label, Notice } from "./ui";

export default function ContactSettingsForm({ initial }: { initial: { phone: string; whatsapp: string; address: string; email: string; showPrices: boolean } }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/admin/settings", "PUT", s);
      setMsg({ ok: true, text: "تم الحفظ والنشر ✓" });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "تعذّر الحفظ" });
    }
    setBusy(false);
  };
  return (
    <form onSubmit={save} className={`${card} grid gap-5 md:grid-cols-2`}>
      <Label label="رقم الهاتف (للاتصال)"><input className={inputCls} dir="ltr" value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} placeholder="01012345678" /></Label>
      <Label label="رقم الواتساب (بكود الدولة)" hint="مثال مصر: 20 ثم الرقم بدون الصفر الأول"><input className={inputCls} dir="ltr" value={s.whatsapp} onChange={(e) => setS({ ...s, whatsapp: e.target.value })} placeholder="201012345678" /></Label>
      <Label label="البريد الإلكتروني"><input className={inputCls} dir="ltr" value={s.email} onChange={(e) => setS({ ...s, email: e.target.value })} /></Label>
      <Label label="العنوان"><input className={inputCls} value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} /></Label>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-sand p-4 md:col-span-2">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-[#a97c3f]" checked={s.showPrices} onChange={(e) => setS({ ...s, showPrices: e.target.checked })} />
        <span>
          <b className="block">إظهار الأسعار في المتجر</b>
          <span className="text-sm text-muted">
            متوقف: المتجر كتالوج بلا أسعار، ويرسل الزائر «قائمته» إلى واتساب المالك لطلب عرض سعر. مفعّل: تظهر الأسعار وتعمل السلة والدفع كالمعتاد. الأسعار محفوظة في كلا الحالتين ولا تُحذف.
          </span>
        </span>
      </label>
      {msg && <div className="md:col-span-2"><Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice></div>}
      <div className="md:col-span-2"><button disabled={busy} className={btn}>{busy ? "جارٍ الحفظ..." : "حفظ ونشر"}</button></div>
    </form>
  );
}
