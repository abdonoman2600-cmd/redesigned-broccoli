"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/admin-fetch";
import type { Theme } from "@/lib/theme";
import type { NavItem } from "@/lib/types";
import ImageUploader from "./ImageUploader";
import { btn, btnGhost, card, inputCls, Label, Notice } from "./ui";

export default function BrandingForm({ logo, theme, nav, brandName, brandTagline }: { logo: string; theme: Theme; nav: NavItem[]; brandName: string; brandTagline: string }) {
  const router = useRouter();
  const [l, setL] = useState(logo);
  const [t, setT] = useState(theme);
  const [n, setN] = useState(nav);
  const [name, setName] = useState(brandName);
  const [tag, setTag] = useState(brandTagline);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/admin/settings", "PUT", { logo: l, theme: t, nav: n, brandName: name, brandTagline: tag });
      setMsg({ ok: true, text: "تم الحفظ والنشر ✓" });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "تعذّر الحفظ" });
    }
    setBusy(false);
  };

  const color = (k: "accent" | "dark" | "bg", label: string) => (
    <Label label={label}>
      <div className="flex items-center gap-3">
        <input type="color" value={t[k]} onChange={(e) => setT({ ...t, [k]: e.target.value })} className="h-12 w-16 cursor-pointer rounded-xl border border-stone-warm bg-white p-1" />
        <input className={inputCls} dir="ltr" value={t[k]} onChange={(e) => setT({ ...t, [k]: e.target.value })} maxLength={7} />
      </div>
    </Label>
  );

  return (
    <div className="space-y-6">
      <section className={card}>
        <h2 className="font-display text-2xl font-bold">الاسم والشعار</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Label label="اسم المتجر"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></Label>
          <Label label="الوصف تحت الاسم"><input className={inputCls} value={tag} onChange={(e) => setTag(e.target.value)} maxLength={80} /></Label>
        </div>
        <div className="mt-6 max-w-[220px]">
          <p className="mb-2 text-sm font-bold">الشعار (صورة شفافة PNG أفضل)</p>
          <ImageUploader value={l ? [l] : []} onChange={(v) => setL(v[0] ?? "")} />
          {l && <button onClick={() => setL("")} className="mt-2 text-xs font-bold text-red-600">إزالة الشعار (استخدام الحرف الافتراضي)</button>}
        </div>
      </section>

      <section className={card}>
        <h2 className="font-display text-2xl font-bold">الألوان والخط</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {color("accent", "لون الهوية (الأزرار والتمييز)")}
          {color("dark", "اللون الداكن (النصوص والتذييل)")}
          {color("bg", "لون خلفية الصفحات")}
        </div>
        <Label label="الخط" className="mt-5 max-w-sm">
          <select className={inputCls} value={t.font} onChange={(e) => setT({ ...t, font: e.target.value as Theme["font"] })}>
            <option value="default">الافتراضي (المسيري للعناوين + تجوّل)</option>
            <option value="cairo">القاهرة (Cairo) لكل النصوص</option>
          </select>
        </Label>
        <button onClick={() => setT({ accent: "#a97c3f", dark: "#1b1a17", bg: "#faf6ef", font: "default" })} className={`${btnGhost} mt-5`}>استعادة الألوان الافتراضية</button>
        <p className="mt-3 text-xs text-muted">صورة الواجهة الرئيسية (الخلفية) والبنرات تُغيَّر من الصفحة الرئيسية مباشرة (زر 📷 على الصورة).</p>
      </section>

      <section className={card}>
        <h2 className="font-display text-2xl font-bold">قائمة التنقل</h2>
        <p className="mb-5 mt-1 text-sm text-muted">رابط داخلي مثل /shop أو /about أو /shop?category=ceilings أو /page/اسم-صفحة، أو رابط خارجي https://...</p>
        <div className="space-y-3">
          {n.map((it, i) => (
            <div key={i} className="grid gap-2 rounded-2xl border border-stone-warm p-3 sm:grid-cols-[1fr_1fr_1.3fr_auto_auto]">
              <input className={inputCls} placeholder="الاسم (عربي)" value={it.label} onChange={(e) => setN(n.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
              <input className={inputCls} dir="ltr" placeholder="Name (English)" value={it.labelEn} onChange={(e) => setN(n.map((x, k) => (k === i ? { ...x, labelEn: e.target.value } : x)))} />
              <input className={inputCls} dir="ltr" placeholder="/shop" value={it.href} onChange={(e) => setN(n.map((x, k) => (k === i ? { ...x, href: e.target.value } : x)))} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#a97c3f]" checked={it.visible} onChange={(e) => setN(n.map((x, k) => (k === i ? { ...x, visible: e.target.checked } : x)))} />ظاهر</label>
              <div className="flex items-center gap-2 text-sm">
                <button onClick={() => i > 0 && setN(n.map((x, k) => (k === i - 1 ? n[i] : k === i ? n[i - 1] : x)))} disabled={i === 0} className="disabled:opacity-20" aria-label="أعلى">▲</button>
                <button onClick={() => i < n.length - 1 && setN(n.map((x, k) => (k === i + 1 ? n[i] : k === i ? n[i + 1] : x)))} disabled={i === n.length - 1} className="disabled:opacity-20" aria-label="أسفل">▼</button>
                <button onClick={() => setN(n.filter((_, k) => k !== i))} className="font-bold text-red-600">حذف</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setN([...n, { label: "", labelEn: "", href: "/", visible: true }])} className="mt-4 text-sm font-bold text-brass-dark hover:underline">+ إضافة رابط</button>
      </section>

      {msg && <Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice>}
      <button onClick={save} disabled={busy} className={btn}>{busy ? "جارٍ الحفظ..." : "حفظ ونشر"}</button>
    </div>
  );
}
