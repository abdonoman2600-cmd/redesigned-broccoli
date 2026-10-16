"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlusIcon } from "../Icons";
import FilePick from "../FilePick";

const MAX_SIDE = 1800;
const MAX_BYTES = 7.5 * 1024 * 1024;

async function prepare(file: File): Promise<Blob> {
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    return blob ?? file;
  } catch {
    return file;
  }
}

export async function upload(file: File): Promise<string> {
  const blob = await prepare(file);
  if (blob.size > MAX_BYTES) {
    throw new Error("حجم الصورة كبير جدًا. اختر صورة أصغر أو بصيغة JPG/PNG");
  }
  if (blob.type && !blob.type.startsWith("image/")) throw new Error("الملف المختار ليس صورة");
  const fd = new FormData();
  fd.append("file", blob, file.name.replace(/\.[^.]+$/, "") + (blob.type === "image/jpeg" ? ".jpg" : ""));
  let res: Response;
  try {
    res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "same-origin" });
  } catch {
    throw new Error("تعذّر الاتصال بالخادم، تحقق من الإنترنت وحاول مرة أخرى");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("انتهت جلسة الدخول، أعد تسجيل الدخول من /admin");
  if (!res.ok) throw new Error(data.error || "فشل رفع الصورة");
  return data.url as string;
}

export default function ImageUploader({
  value,
  onChange,
  multiple = false,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  multiple?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");

  const handleFiles = async (files: File[]) => {
    setBusy(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const f of files.slice(0, multiple ? 10 : 1)) urls.push(await upload(f));
      onChange(multiple ? [...value, ...urls] : urls);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const addUrl = () => {
    const u = url.trim();
    if (!/^https?:\/\//.test(u)) {
      setError("الرابط يجب أن يبدأ بـ https://");
      return;
    }
    setError("");
    onChange(multiple ? [...value, u] : [u]);
    setUrl("");
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {value.map((src, i) => (
          <div key={src + i} className="group relative aspect-square overflow-hidden rounded-xl border border-stone-warm bg-sand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            {multiple && i === 0 && (
              <span className="absolute right-2 top-2 rounded-full bg-brass px-2 py-0.5 text-[11px] font-bold text-white">الرئيسية</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-ink/80 to-transparent p-2 text-white">
              {multiple ? (
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid h-8 w-8 place-items-center rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-30" aria-label="تقديم">
                    <ChevronRightIcon width={16} height={16} />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="grid h-8 w-8 place-items-center rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-30" aria-label="تأخير">
                    <ChevronLeftIcon width={16} height={16} />
                  </button>
                </div>
              ) : (
                <span />
              )}
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="grid h-8 w-8 place-items-center rounded-full bg-red-600 hover:bg-red-700" aria-label="حذف الصورة">
                <CloseIcon width={14} height={14} />
              </button>
            </div>
          </div>
        ))}

        {(multiple || value.length === 0) && (
          <FilePick
            multiple={multiple}
            disabled={busy}
            onFiles={handleFiles}
            className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-stone-warm bg-white text-center text-sm text-muted transition hover:border-brass hover:text-brass-dark"
          >
            <span className="flex flex-col items-center gap-2">
              {busy ? (
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-stone-warm border-t-brass" />
              ) : (
                <PlusIcon width={26} height={26} />
              )}
              {busy ? "جارٍ الرفع..." : multiple ? "رفع صور" : "رفع صورة"}
            </span>
          </FilePick>
        )}
      </div>

      {!multiple && value.length > 0 && (
        <FilePick onFiles={handleFiles} disabled={busy} className="mt-3 inline-block text-sm font-bold text-brass-dark hover:underline">
          {busy ? "جارٍ الرفع..." : "استبدال الصورة"}
        </FilePick>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="أو الصق رابط صورة https://..."
          dir="ltr"
          className="min-w-0 flex-1 rounded-xl border border-stone-warm bg-white px-3 py-2 text-sm outline-none focus:border-brass"
        />
        <button type="button" onClick={addUrl} className="rounded-xl border border-stone-warm px-4 text-sm font-bold hover:bg-sand">
          إضافة
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
