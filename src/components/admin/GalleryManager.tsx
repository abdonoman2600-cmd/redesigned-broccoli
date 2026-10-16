"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { GalleryDTO } from "@/lib/types";
import { upload } from "./ImageUploader";
import FilePick from "../FilePick";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from "../Icons";

const inputCls =
  "w-full rounded-xl border border-stone-warm bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brass focus:ring-4 focus:ring-brass/15";

type Item = GalleryDTO;

export default function GalleryManager({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initial);
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  const flash = (id: number) => {
    setSaved((s) => ({ ...s, [id]: true }));
    setTimeout(() => setSaved((s) => ({ ...s, [id]: false })), 1500);
  };

  const patch = async (id: number, data: Partial<Item>) => {
    const res = await fetch(`/api/admin/gallery/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      flash(id);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "تعذّر الحفظ");
    }
  };

  const local = (id: number, data: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...data } : i)));

  const createFromUrls = async (urls: string[]) => {
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: urls.map((image) => ({ image })) }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "تعذّر الحفظ");
    router.refresh();
    // reload list from server through refresh; also optimistic fetch
    const list = await fetch("/api/admin/gallery/list").then((r) => r.json());
    setItems(list.items);
  };

  const onFiles = async (files: File[]) => {
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      const arr = files.slice(0, 20);
      for (let i = 0; i < arr.length; i++) {
        setProgress(`جارٍ رفع الصورة ${i + 1} من ${arr.length}...`);
        urls.push(await upload(arr[i]));
      }
      await createFromUrls(urls);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  const addUrl = async () => {
    if (!/^https?:\/\//.test(url.trim())) {
      setError("الرابط يجب أن يبدأ بـ https://");
      return;
    }
    setError("");
    try {
      await createFromUrls([url.trim()]);
      setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    }
  };

  const replaceImage = async (id: number, file: File | undefined) => {
    if (!file) return;
    setError("");
    try {
      const newUrl = await upload(file);
      local(id, { image: newUrl });
      await patch(id, { image: newUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("حذف هذه الصورة نهائيًا من المعرض؟")) return;
    setItems((l) => l.filter((i) => i.id !== id));
    await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const move = async (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    await fetch("/api/admin/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((n) => n.id) }),
    });
    router.refresh();
  };

  return (
    <div>
      <div className="rounded-3xl border-2 border-dashed border-stone-warm bg-white p-8 text-center">
        <FilePick
          multiple
          onFiles={onFiles}
          disabled={uploading}
          className="mx-auto inline-flex items-center gap-3 rounded-full bg-brass px-9 py-4 text-lg font-bold text-white transition hover:bg-brass-dark"
        >
          {uploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <PlusIcon width={22} height={22} />
          )}
          {uploading ? progress || "جارٍ الرفع..." : "رفع صور جديدة"}
        </FilePick>
        <p className="mt-3 text-sm text-muted">يمكنك اختيار حتى ٢٠ صورة مرة واحدة من الجوال أو الكمبيوتر، وتظهر فورًا في المعرض.</p>
        <div className="mx-auto mt-5 flex max-w-lg gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="أو الصق رابط صورة https://..."
            dir="ltr"
            className={inputCls}
          />
          <button onClick={addUrl} className="shrink-0 rounded-xl border border-stone-warm px-5 text-sm font-bold hover:bg-sand">
            إضافة
          </button>
        </div>
        {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
      </div>

      <div className="mb-4 mt-10 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">صور المعرض ({items.length})</h2>
        <a href="/gallery" target="_blank" className="text-sm font-bold text-brass-dark hover:underline">
          معاينة الصفحة ↗
        </a>
      </div>

      {items.length === 0 ? (
        <p className="rounded-3xl bg-sand p-12 text-center text-muted">لا توجد صور بعد. ارفع أول صورة لأعمالك.</p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {items.map((it, i) => (
            <li key={it.id} className={`overflow-hidden rounded-3xl border border-stone-warm bg-white ${it.active ? "" : "opacity-70"}`}>
              <div className="relative aspect-[16/10] bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt={it.title} className={`h-full w-full object-cover ${it.active ? "" : "grayscale"}`} />
                {!it.active && (
                  <span className="absolute right-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">مخفية</span>
                )}
                {saved[it.id] && (
                  <span className="animate-fade-in absolute left-3 top-3 rounded-full bg-green-700 px-3 py-1 text-xs font-bold text-white">تم الحفظ ✓</span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-ink/80 to-transparent p-3 text-white">
                  <div className="flex gap-1.5">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="grid h-9 w-9 place-items-center rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-30" aria-label="تقديم">
                      <ChevronRightIcon width={18} height={18} />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="grid h-9 w-9 place-items-center rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-30" aria-label="تأخير">
                      <ChevronLeftIcon width={18} height={18} />
                    </button>
                  </div>
                  <FilePick onFiles={(f) => replaceImage(it.id, f[0])} className="rounded-full bg-white/20 px-4 py-2 text-xs font-bold hover:bg-white/40">
                    استبدال الصورة
                  </FilePick>
                </div>
              </div>

              <div className="space-y-3 p-5">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-muted">العنوان</span>
                  <input
                    className={inputCls}
                    value={it.title}
                    maxLength={120}
                    onChange={(e) => local(it.id, { title: e.target.value })}
                    onBlur={() => it.title.trim() && patch(it.id, { title: it.title })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-muted">وصف قصير (اختياري)</span>
                  <input
                    className={inputCls}
                    value={it.description}
                    maxLength={400}
                    onChange={(e) => local(it.id, { description: e.target.value })}
                    onBlur={() => patch(it.id, { description: it.description })}
                  />
                </label>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="min-w-0 flex-1 basis-40">
                    <span className="mb-1 block text-xs font-bold text-muted">التصنيف</span>
                    <input
                      className={inputCls}
                      list="gallery-cats"
                      value={it.category}
                      maxLength={40}
                      placeholder="مثل: أسقف، جدران..."
                      onChange={(e) => local(it.id, { category: e.target.value })}
                      onBlur={() => patch(it.id, { category: it.category })}
                    />
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#a97c3f]"
                      checked={it.active}
                      onChange={(e) => {
                        local(it.id, { active: e.target.checked });
                        patch(it.id, { active: e.target.checked });
                      }}
                    />
                    ظاهرة
                  </label>
                  <button onClick={() => remove(it.id)} className="flex items-center gap-1.5 pb-2.5 text-sm font-bold text-red-600 hover:underline">
                    <TrashIcon width={16} height={16} /> حذف
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <datalist id="gallery-cats">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  );
}
