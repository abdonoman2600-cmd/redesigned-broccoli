"use client";

import { useCallback, useEffect, useState } from "react";
import { img } from "@/lib/format";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./Icons";

import T from "@/components/T";
export default function ProductGallery({ images, name, badge }: { images: string[]; name: string; badge: string | null }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const next = useCallback(() => setActive((a) => (a + 1) % images.length), [images.length]);
  const prev = useCallback(() => setActive((a) => (a - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      // RTL: right arrow = previous visually
      if (e.key === "ArrowLeft") next();
      if (e.key === "ArrowRight") prev();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, next, prev]);

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      <div className="no-scrollbar flex gap-3 overflow-x-auto md:max-h-[640px] md:flex-col md:overflow-y-auto">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => setActive(i)}
            className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition md:h-24 md:w-24 ${
              i === active ? "border-brass" : "border-transparent opacity-70 hover:opacity-100"
            }`}
            aria-label={`عرض الصورة ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(src, 300)} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <div className="relative flex-1">
        <div
          className="group relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-3xl bg-sand md:aspect-[5/6]"
          onClick={() => setLightbox(true)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={img(src, 1200)}
              alt={`${name} - صورة ${i + 1}`}
              fetchPriority={i === 0 ? "high" : "auto"}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
              style={
                i === active && zoom
                  ? { transform: "scale(1.6)", transformOrigin: `${zoom.x}% ${zoom.y}%`, transition: "transform .15s ease-out, opacity .5s" }
                  : { transition: "transform .4s ease-out, opacity .5s" }
              }
            />
          ))}
          {badge && (
            <span className="absolute right-4 top-4 rounded-full bg-ink px-4 py-1.5 text-sm font-bold text-white">{badge}</span>
          )}
          <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs backdrop-blur">
            <T>اضغط للتكبير</T>
          </span>
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-lg backdrop-blur transition hover:bg-white"
              aria-label="الصورة السابقة"
            >
              <ChevronRightIcon />
            </button>
            <button
              onClick={next}
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-lg backdrop-blur transition hover:bg-white"
              aria-label="الصورة التالية"
            >
              <ChevronLeftIcon />
            </button>
          </>
        )}
      </div>

      {lightbox && (
        <div className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-4" onClick={() => setLightbox(false)}>
          <button className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="إغلاق">
            <CloseIcon />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute right-5 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="السابقة"
              >
                <ChevronRightIcon />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute left-5 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="التالية"
              >
                <ChevronLeftIcon />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img(images[active], 1600)}
            alt={name}
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
