"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GalleryDTO } from "@/lib/types";
import { api } from "@/lib/admin-fetch";
import { img } from "@/lib/format";
import { useEdit } from "./EditProvider";
import { GalleryEditModal } from "./EditModals";
import { upload } from "./admin/ImageUploader";
import FilePick from "./FilePick";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./Icons";

import T from "@/components/T";
export default function GalleryClient({ items }: { items: GalleryDTO[] }) {
  const router = useRouter();
  const { editing, notify } = useEdit();
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<GalleryDTO | null>(null);
  const [uploading, setUploading] = useState("");

  const visible = useMemo(() => items.filter((i) => i.active || editing), [items, editing]);
  const cats = useMemo(() => [...new Set(visible.map((i) => i.category).filter(Boolean))], [visible]);
  const list = useMemo(() => (cat ? visible.filter((i) => i.category === cat) : visible), [visible, cat]);

  const next = useCallback(() => setOpen((o) => (o === null ? o : (o + 1) % list.length)), [list.length]);
  const prev = useCallback(() => setOpen((o) => (o === null ? o : (o - 1 + list.length) % list.length)), [list.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowLeft") next();
      if (e.key === "ArrowRight") prev();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, next, prev]);

  const onFiles = async (files: File[]) => {
    try {
      const arr = files.slice(0, 20);
      const urls: string[] = [];
      for (let i = 0; i < arr.length; i++) {
        setUploading(`جارٍ رفع ${i + 1} من ${arr.length}...`);
        urls.push(await upload(arr[i]));
      }
      await api("/api/admin/gallery", "POST", { items: urls.map((image) => ({ image, category: cat })) });
      notify(`تمت إضافة ${urls.length} صورة ✓`);
      router.refresh();
    } catch (e) {
      notify(e instanceof Error ? e.message : "فشل الرفع", false);
    }
    setUploading("");
  };

  const move = async (id: number, dir: number) => {
    const idx = list.findIndex((i) => i.id === id);
    const other = list[idx + dir];
    if (!other) return;
    const full = [...items];
    const a = full.findIndex((x) => x.id === id);
    const b = full.findIndex((x) => x.id === other.id);
    [full[a], full[b]] = [full[b], full[a]];
    await api("/api/admin/gallery", "PATCH", { ids: full.map((x) => x.id) });
    router.refresh();
  };

  const current = !editing && open !== null ? list[open] : null;

  return (
    <>
      {editing && (
        <div className="mb-8 rounded-3xl border-2 border-dashed border-brass/50 bg-brass/5 p-6 text-center">
          <FilePick
            multiple
            onFiles={onFiles}
            disabled={!!uploading}
            className="inline-block rounded-full bg-brass px-8 py-3.5 font-bold text-white transition hover:bg-brass-dark"
          >
            {uploading || "+ رفع صور جديدة للمعرض"}
          </FilePick>
          <p className="mt-2 text-sm text-muted"><T>اختر حتى ٢٠ صورة. اضغط على أي صورة أدناه لتعديل عنوانها أو حذفها أو إخفائها.</T></p>
        </div>
      )}

      {cats.length > 0 && (
        <div className="no-scrollbar -mx-6 flex justify-start gap-2 overflow-x-auto px-6 md:justify-center">
          {["", ...cats].map((c) => (
            <button
              key={c || "all"}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-6 py-2.5 text-sm font-bold transition ${
                cat === c ? "border-ink bg-ink text-white" : "border-stone-warm bg-white hover:border-ink"
              }`}
            >
              <T>{c || "الكل"}</T>
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <p className="mt-14 rounded-3xl bg-sand p-14 text-center text-muted"><T>لا توجد صور في هذا التصنيف حاليًا.</T></p>
      ) : (
        <div key={cat} className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {list.map((it, i) => (
            <div key={it.id} className="animate-fade-up relative mb-5 break-inside-avoid" style={{ animationDelay: `${Math.min(i, 9) * 60}ms` }}>
              <button
                onClick={() => (editing ? setEditItem(it) : setOpen(i))}
                className={`group relative block w-full overflow-hidden rounded-3xl bg-sand text-start ${it.active ? "" : "opacity-60 grayscale"}`}
                aria-label={editing ? `تعديل ${it.title}` : `عرض ${it.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(it.image, 800)} alt={it.title} loading="lazy" className="w-full transition duration-700 ease-out group-hover:scale-105" />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/80 via-ink/10 to-transparent p-5 text-white opacity-0 transition duration-500 group-hover:opacity-100 max-md:opacity-100">
                  {it.category && <span className="text-xs text-brass-light">{it.category}</span>}
                  <h3 className="font-display text-lg font-bold leading-snug">{it.title}</h3>
                </div>
              </button>
              {editing && (
                <>
                  <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-brass px-3 py-1 text-xs font-bold text-white">
                    {it.active ? "✎ اضغط للتعديل" : "مخفية"}
                  </span>
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <button onClick={() => move(it.id, -1)} disabled={i === 0} className="grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-lg disabled:opacity-30" aria-label="تقديم">
                      <ChevronRightIcon width={18} height={18} />
                    </button>
                    <button onClick={() => move(it.id, 1)} disabled={i === list.length - 1} className="grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-lg disabled:opacity-30" aria-label="تأخير">
                      <ChevronLeftIcon width={18} height={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {editItem && <GalleryEditModal key={editItem.id} item={editItem} onClose={() => setEditItem(null)} />}

      {current && (
        <div className="animate-fade-in fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink/95 p-4" onClick={() => setOpen(null)}>
          <button className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="إغلاق">
            <CloseIcon />
          </button>
          {list.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="السابقة">
                <ChevronRightIcon />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="التالية">
                <ChevronLeftIcon />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={current.id} src={img(current.image, 1600)} alt={current.title} className="animate-fade-in max-h-[78vh] max-w-full rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          <div className="mt-5 max-w-2xl text-center text-white" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl font-bold">{current.title}</h2>
            {current.description && <p className="mt-2 leading-7 text-white/75">{current.description}</p>}
          </div>
        </div>
      )}
    </>
  );
}
