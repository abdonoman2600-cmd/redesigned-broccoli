"use client";

import { useState } from "react";
import { img } from "@/lib/format";
import { useEdit } from "./EditProvider";
import { upload } from "./admin/ImageUploader";
import FilePick from "./FilePick";

/** An <img> the owner can replace in place. Place inside a `relative` parent. */
export default function EditableImage({
  id,
  src,
  alt,
  className = "",
  width = 1000,
  overlayClass = "left-3 top-3",
  label = "📷 تغيير الصورة",
  priority = false,
}: {
  id: string;
  src: string;
  alt: string;
  className?: string;
  width?: number;
  overlayClass?: string;
  label?: string;
  priority?: boolean;
}) {
  const { content, editing, save, notify } = useEdit();
  const [busy, setBusy] = useState(false);
  const value = content[id] ?? src;

  const onFiles = async (files: File[]) => {
    setBusy(true);
    try {
      const url = await upload(files[0]);
      await save(id, url);
    } catch (e) {
      notify(e instanceof Error ? e.message : "فشل رفع الصورة", false);
    }
    setBusy(false);
  };

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img(value, width)}
        alt={alt}
        className={className}
        loading={priority ? undefined : "lazy"}
        fetchPriority={priority ? "high" : undefined}
      />
      {editing && (
        <div className={`absolute z-30 ${overlayClass}`}>
          <FilePick
            onFiles={onFiles}
            disabled={busy}
            className="inline-block rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-ink shadow-lg ring-1 ring-brass/60 transition hover:bg-brass hover:text-white"
          >
            {busy ? "جارٍ الرفع..." : label}
          </FilePick>
        </div>
      )}
    </>
  );
}
