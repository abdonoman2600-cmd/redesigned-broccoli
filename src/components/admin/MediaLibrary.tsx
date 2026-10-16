"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/admin-fetch";
import FilePick from "../FilePick";
import { upload } from "./ImageUploader";
import { btn, card, Notice } from "./ui";

type Row = { id: number; filename: string; createdAt: string; size: number; used: number };

export default function MediaLibrary({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const unused = rows.filter((r) => !r.used);
  const total = rows.reduce((s, r) => s + r.size, 0);

  const onFiles = async (files: File[]) => {
    setBusy(true);
    setMsg(null);
    try {
      for (const f of files.slice(0, 20)) await upload(f);
      setMsg({ ok: true, text: `تم رفع ${files.length} صورة ✓` });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "فشل الرفع" });
    }
    setBusy(false);
  };

  const del = async (id: number) => {
    try {
      await api(`/api/admin/media/${id}`, "DELETE");
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "تعذّر الحذف" });
    }
  };

  const sweep = async () => {
    if (!confirm(`حذف ${unused.length} صورة غير مستخدمة نهائيًا؟`)) return;
    setBusy(true);
    for (const r of unused) await api(`/api/admin/media/${r.id}`, "DELETE").catch(() => null);
    setBusy(false);
    router.refresh();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <FilePick multiple onFiles={onFiles} disabled={busy} className={`${btn} inline-block`}>{busy ? "جارٍ..." : "+ رفع صور"}</FilePick>
        {unused.length > 0 && <button onClick={sweep} disabled={busy} className="rounded-full border border-red-200 px-6 py-3 font-bold text-red-600 hover:bg-red-50">حذف غير المستخدم ({unused.length})</button>}
        <span className="text-sm text-muted">{rows.length} صورة · {(total / 1048576).toFixed(1)} ميجا</span>
      </div>
      {msg && <div className="mb-5"><Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice></div>}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {rows.map((r) => (
          <li key={r.id} className={`${card} !p-3`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/media/${r.id}`} alt={r.filename} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
            <p className="mt-2 line-clamp-1 text-xs text-muted" dir="ltr">{r.filename}</p>
            <p className="text-xs">{(r.size / 1024).toFixed(0)} ك.ب · {r.used ? <b className="text-green-700">مستخدمة</b> : <b className="text-amber-700">غير مستخدمة</b>}</p>
            <div className="mt-2 flex gap-3 text-xs font-bold">
              <button onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/api/media/${r.id}`)} className="text-brass-dark hover:underline">نسخ الرابط</button>
              {!r.used && <button onClick={() => del(r.id)} className="text-red-600 hover:underline">حذف</button>}
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="col-span-full rounded-3xl bg-sand p-12 text-center text-muted">لا توجد صور مرفوعة بعد.</li>}
      </ul>
    </div>
  );
}
