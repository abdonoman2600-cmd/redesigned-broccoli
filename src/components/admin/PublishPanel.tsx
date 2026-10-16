"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/admin-fetch";
import { formatDate } from "@/lib/format";
import { btn, btnGhost, card, Notice } from "./ui";

type Item = { id: number; scope: string; title: string; detail: string; by: string; at: string };

export default function PublishPanel({ items, previewUrl }: { items: Item[]; previewUrl: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [link, setLink] = useState(previewUrl);

  const run = async (url: string, body: Record<string, unknown>, ask: string, done: string) => {
    if (ask && !confirm(ask)) return;
    setBusy(true);
    setMsg(null);
    try {
      await api(url, "POST", body);
      setMsg({ ok: true, text: done });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "تعذّر التنفيذ" });
    }
    setBusy(false);
  };

  const openPreview = async () => {
    await api("/api/admin/mode", "POST", { mode: "preview" });
    window.location.href = "/";
  };

  const makeLink = async (action: "create" | "revoke") => {
    setBusy(true);
    try {
      const r = await api<{ url?: string }>("/api/admin/preview-link", "POST", { action });
      setLink(action === "create" ? (r.url ?? null) : null);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "تعذّر التنفيذ" });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      {msg && <Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice>}

      <section className={card}>
        <h2 className="font-display text-2xl font-bold">التعديلات غير المنشورة ({items.length})</h2>
        {items.length === 0 ? (
          <p className="mt-4 text-muted">لا توجد تعديلات معلّقة. كل ما تراه في المتجر منشور.</p>
        ) : (
          <>
            <ul className="mt-5 divide-y divide-stone-warm">
              {items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{i.title}</p>
                    <p className="mt-1 break-words text-sm text-muted">{i.detail}</p>
                    <p className="mt-1 text-xs text-muted">{i.by} · {formatDate(i.at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={busy} onClick={() => run("/api/admin/publish", { id: i.id }, "", "تم النشر ✓")} className="rounded-full bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-600">نشر</button>
                    <button disabled={busy} onClick={() => run("/api/admin/discard", { id: i.id }, "تجاهل هذا التعديل؟", "تم التجاهل")} className="rounded-full border border-ink/20 px-4 py-2 text-sm font-bold hover:bg-sand">تجاهل</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <button disabled={busy} onClick={() => run("/api/admin/publish", {}, `نشر ${items.length} تعديل ليراها كل الزوار؟`, "تم نشر كل التغييرات ✓")} className={btn}>نشر الكل</button>
              <button disabled={busy} onClick={() => run("/api/admin/discard", {}, "تجاهل كل التعديلات غير المنشورة؟", "تم تجاهل كل التعديلات")} className={btnGhost}>تجاهل الكل</button>
            </div>
          </>
        )}
      </section>

      <section className={card}>
        <h2 className="font-display text-2xl font-bold">معاينة قبل النشر</h2>
        <p className="mt-2 text-muted">شاهد المتجر بالتعديلات الجديدة قبل أن يراها الزوار.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={openPreview} className={btn}>👁 افتح المتجر في وضع المعاينة</button>
        </div>
        <div className="mt-6 border-t border-stone-warm pt-6">
          <h3 className="font-bold">رابط معاينة للعرض فقط (للمشاركة)</h3>
          <p className="mt-1 text-sm text-muted">أرسله لأي شخص ليرى المسودة دون حساب. لا يستطيع تعديل أي شيء. يمكنك إلغاؤه في أي وقت.</p>
          {link ? (
            <div className="mt-4 space-y-3">
              <input readOnly value={link} dir="ltr" onFocus={(e) => e.target.select()} className="w-full rounded-xl border border-stone-warm bg-sand px-4 py-3 text-sm" />
              <div className="flex gap-3">
                <button onClick={() => navigator.clipboard?.writeText(link)} className={btnGhost}>نسخ الرابط</button>
                <button disabled={busy} onClick={() => makeLink("create")} className={btnGhost}>إنشاء رابط جديد</button>
                <button disabled={busy} onClick={() => makeLink("revoke")} className="rounded-full border border-red-200 px-6 py-3 font-bold text-red-600 hover:bg-red-50">إلغاء الرابط</button>
              </div>
            </div>
          ) : (
            <button disabled={busy} onClick={() => makeLink("create")} className={`${btn} mt-4`}>إنشاء رابط معاينة</button>
          )}
        </div>
      </section>
    </div>
  );
}
