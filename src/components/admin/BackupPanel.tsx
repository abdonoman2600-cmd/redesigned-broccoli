"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/admin-fetch";
import { btn, btnGhost, card, Notice } from "./ui";

export default function BackupPanel() {
  const file = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<{ name: string; json: unknown } | null>(null);
  const [orders, setOrders] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    try {
      setData({ name: f.name, json: JSON.parse(await f.text()) });
      setMsg(null);
    } catch {
      setMsg({ ok: false, text: "الملف ليس نسخة احتياطية صالحة" });
    }
  };

  const restore = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/admin/restore", "POST", { confirm: "RESTORE", data: data!.json, includeOrders: orders });
      setMsg({ ok: true, text: "تم الاسترجاع بنجاح ✓" });
      setData(null);
      setConfirmText("");
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "فشل الاسترجاع" });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      {msg && <Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice>}
      <section className={card}>
        <h2 className="font-display text-2xl font-bold">تنزيل نسخة احتياطية</h2>
        <p className="mt-2 text-muted">ملف JSON يحتوي المنتجات والتصنيفات والتقييمات والمعرض والإعدادات والصفحات والكوبونات والشحن والعملاء والطلبات. لا يتضمن كلمات المرور أو حسابات الموظفين.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="/api/admin/backup" className={`${btn} inline-block`}>⬇ نسخة بدون الصور (صغيرة)</a>
          <a href="/api/admin/backup?media=1" className={`${btnGhost} inline-block`}>⬇ نسخة كاملة مع الصور</a>
        </div>
        <p className="mt-4 text-xs text-muted">احتفظ بالنسخة في مكان آمن (جوجل درايف مثلًا) وكرّر ذلك أسبوعيًا. النسخ التلقائية اليومية تحتاج إعداد استضافة قاعدة البيانات (مثل Neon/Supabase/Railway لديها نسخ تلقائية) أو مهمة مجدولة <code dir="ltr">pg_dump</code>.</p>
      </section>

      <section className={card}>
        <h2 className="font-display text-2xl font-bold">استرجاع من نسخة</h2>
        <Notice kind="warn">
          الاسترجاع <b>يستبدل</b> المنتجات والتصنيفات والتقييمات والمعرض والإعدادات والصفحات بما في الملف. الطلبات الحالية لا تُمس إلا إن اخترت ذلك. يتم داخل عملية واحدة: إن فشل شيء لا يتغير أي شيء. نزّل نسخة من وضعك الحالي أولًا.
        </Notice>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={() => file.current?.click()} className={btnGhost}>اختيار ملف النسخة</button>
          <input ref={file} type="file" accept=".json,application/json" hidden onChange={(e) => pick(e.target.files?.[0])} />
          {data && <span className="text-sm">{data.name}</span>}
        </div>
        {data && (
          <div className="mt-5 space-y-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#a97c3f]" checked={orders} onChange={(e) => setOrders(e.target.checked)} />استرجاع الطلبات والعملاء والرسائل أيضًا (سيحذف الطلبات الحالية!)</label>
            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="اكتب RESTORE للتأكيد" dir="ltr" className="w-full max-w-xs rounded-xl border border-stone-warm px-4 py-3" />
            <div><button disabled={busy || confirmText !== "RESTORE"} onClick={restore} className="rounded-full bg-red-600 px-7 py-3.5 font-bold text-white hover:bg-red-700 disabled:opacity-50">{busy ? "جارٍ الاسترجاع..." : "استرجاع الآن"}</button></div>
          </div>
        )}
      </section>
    </div>
  );
}
