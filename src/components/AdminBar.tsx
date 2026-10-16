"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/admin-fetch";
import { useEdit } from "./EditProvider";

const MODES = [
  { id: "edit", label: "✎ تعديل" },
  { id: "preview", label: "👁 معاينة" },
  { id: "live", label: "🌐 المنشور" },
] as const;

export default function AdminBar() {
  const { isAdmin, mode, viewerPreview, draftCount, toast, notify } = useEdit();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (viewerPreview && !isAdmin) {
    return (
      <div className="fixed inset-x-0 top-0 z-[95] bg-amber-400 px-4 py-1.5 text-center text-sm font-bold text-ink">
        معاينة قبل النشر — للعرض فقط · التعديلات غير المنشورة ظاهرة هنا ·{" "}
        <a href="/api/preview/exit" className="underline">
          خروج من المعاينة
        </a>
      </div>
    );
  }
  if (!isAdmin) return null;

  const setMode = async (m: string) => {
    if (m === mode) return;
    setBusy(true);
    try {
      await api("/api/admin/mode", "POST", { mode: m });
      router.refresh();
    } catch (e) {
      notify(e instanceof Error ? e.message : "تعذّر التبديل", false);
    }
    setBusy(false);
  };

  const run = async (url: string, ask: string, done: string) => {
    if (!confirm(ask)) return;
    setBusy(true);
    try {
      await api(url, "POST", {});
      notify(done);
      router.refresh();
    } catch (e) {
      notify(e instanceof Error ? e.message : "تعذّر التنفيذ", false);
    }
    setBusy(false);
  };

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  };

  return (
    <>
      {mode === "preview" && (
        <div className="fixed inset-x-0 top-0 z-[95] bg-amber-400 px-4 py-1.5 text-center text-sm font-bold text-ink">
          وضع المعاينة — هكذا سيبدو المتجر بعد النشر (للعرض فقط)
        </div>
      )}
      {mode === "live" && (
        <div className="fixed inset-x-0 top-0 z-[95] bg-green-700 px-4 py-1.5 text-center text-sm font-bold text-white">
          أنت ترى النسخة المنشورة كما يراها الزوار
        </div>
      )}
      {toast && (
        <div
          className={`animate-toast fixed bottom-24 left-1/2 z-[90] max-w-[90vw] -translate-x-1/2 rounded-full px-6 py-3 text-center text-sm font-bold text-white shadow-2xl ${toast.ok ? "bg-green-700" : "bg-red-600"}`}
          role="status"
        >
          {toast.text}
        </div>
      )}
      <div className="pointer-events-none fixed bottom-4 left-3 right-[84px] z-[65] flex justify-center">
        <div className={`no-scrollbar pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-brass/40 bg-ink/95 p-1.5 text-sm text-white shadow-2xl backdrop-blur ${busy ? "opacity-70" : ""}`}>
          <div className="flex shrink-0 rounded-full bg-white/10 p-0.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                disabled={busy}
                aria-pressed={mode === m.id}
                className={`rounded-full px-3.5 py-2 font-bold transition ${mode === m.id ? "bg-brass text-white" : "text-white/75 hover:text-white"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {draftCount > 0 && (
            <>
              <button
                onClick={() => run("/api/admin/publish", `نشر ${draftCount} تعديل ليراها كل الزوار الآن؟`, "تم نشر التغييرات ✓")}
                disabled={busy}
                className="shrink-0 rounded-full bg-green-600 px-4 py-2.5 font-bold text-white transition hover:bg-green-500"
              >
                نشر التغييرات ({draftCount})
              </button>
              <button
                onClick={() => run("/api/admin/discard", "تجاهل كل التعديلات غير المنشورة؟ لا يمكن التراجع.", "تم تجاهل التعديلات")}
                disabled={busy}
                className="shrink-0 rounded-full px-3.5 py-2.5 text-white/80 transition hover:bg-white/15"
              >
                إلغاء التعديلات
              </button>
            </>
          )}
          <Link href="/admin/publish" className="shrink-0 rounded-full px-3.5 py-2.5 transition hover:bg-white/15">
            مراجعة
          </Link>
          <Link href="/admin" className="shrink-0 rounded-full px-3.5 py-2.5 transition hover:bg-white/15">
            لوحة التحكم
          </Link>
          <button onClick={logout} className="shrink-0 rounded-full px-3.5 py-2.5 text-white/70 transition hover:bg-red-600 hover:text-white">
            خروج
          </button>
        </div>
      </div>
    </>
  );
}
