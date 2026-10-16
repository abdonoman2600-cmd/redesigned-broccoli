"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProductDTO } from "@/lib/types";
import { formatNumber, formatPrice } from "@/lib/format";
import { buildCartItem } from "@/lib/cart-utils";
import { useCart } from "./CartProvider";
import { useSite } from "./SiteProvider";
import QtyStepper from "./QtyStepper";
import { CheckIcon, WhatsAppIcon } from "./Icons";

import Money from "@/components/Money";
import T from "@/components/T";
export default function ProductPurchase({ product: p }: { product: ProductDTO }) {
  const { addItem } = useCart();
  const site = useSite();
  const [optionIndex, setOptionIndex] = useState(0);
  const [qty, setQty] = useState(p.minQty);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [missing, setMissing] = useState("");

  const opt = p.options[optionIndex];
  const unitPrice = p.price + (opt?.priceDelta ?? 0);
  const total = unitPrice * qty;
  const maxQty = p.stock ?? undefined;

  const validate = () => {
    if (p.colors.length && !color) return "اختر اللون أولًا";
    if (p.sizes.length && !size) return "اختر المقاس أولًا";
    return "";
  };

  const add = () => {
    const m = validate();
    setMissing(m);
    if (m) return false;
    addItem(buildCartItem(p, optionIndex, qty, color, size));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    return true;
  };

  const waText = encodeURIComponent(
    `مرحبًا رشيد، أرغب في الاستفسار عن: ${p.name}${opt ? ` (${opt.label})` : ""} - الكمية ${qty} ${p.unit}`,
  );

  return (
    <div className="mt-8 space-y-7">
      {p.options.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-bold">{p.optionsLabel}</span>
            {opt && <span className="text-sm text-muted">{opt.display ?? opt.label}</span>}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {p.options.map((o, i) => (
              <button
                key={o.label}
                onClick={() => setOptionIndex(i)}
                aria-pressed={i === optionIndex}
                className={`rounded-full border px-5 py-2.5 text-sm font-medium transition ${
                  i === optionIndex ? "border-ink bg-ink text-white" : "border-stone-warm bg-white hover:border-ink"
                }`}
              >
                {o.display ?? o.label}
                {site.showPrices && o.priceDelta > 0 && (
                  <span className={`ms-2 text-xs ${i === optionIndex ? "text-white/70" : "text-muted"}`}>+{formatNumber(o.priceDelta)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {p.colors.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-bold"><T>اللون</T></span>
            <span className="text-sm text-muted">{color ?? ""}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {p.colors.map((c) => (
              <button
                key={c.name}
                onClick={() => { setColor(c.name); setMissing(""); }}
                aria-label={c.name}
                aria-pressed={color === c.name}
                title={c.name}
                className={`h-10 w-10 rounded-full border-2 transition ${color === c.name ? "border-ink ring-2 ring-brass ring-offset-2" : "border-stone-warm hover:border-ink"}`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {p.sizes.length > 0 && (
        <div>
          <div className="mb-3 font-bold"><T>المقاس</T></div>
          <div className="flex flex-wrap gap-2.5">
            {p.sizes.map((s) => (
              <button
                key={s}
                onClick={() => { setSize(s); setMissing(""); }}
                aria-pressed={size === s}
                className={`min-w-12 rounded-full border px-4 py-2.5 text-sm font-medium transition ${size === s ? "border-ink bg-ink text-white" : "border-stone-warm bg-white hover:border-ink"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {p.available ? (
        <>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold"><T>{site.showPrices ? "الكمية" : "الكمية / المساحة"}</T> ({p.unit})</span>
              <span className="text-sm text-muted">
                <T>الحد الأدنى</T> {formatNumber(p.minQty)} {p.unit}
                {p.stock !== null && p.stock <= 20 && <b className="ms-3 text-red-600"><T>متبقي</T> {formatNumber(p.stock)} <T>فقط</T></b>}
              </span>
            </div>
            <QtyStepper value={qty} min={p.minQty} step={p.step} onChange={(v) => setQty(maxQty ? Math.min(v, maxQty) : v)} editable />
          </div>

          {site.showPrices && (
          <div className="rounded-2xl bg-sand p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted"><T>السعر الإجمالي التقديري</T></p>
                <p className="mt-1 font-display text-3xl font-bold text-ink"><Money v={total} /></p>
              </div>
              <p className="text-sm text-muted"><Money v={unitPrice} /> × {formatNumber(qty)} {p.unit}</p>
            </div>
          </div>
          )}

          {missing && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700" role="alert"><T>{missing}</T></p>}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => add()}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full py-4 text-lg font-bold text-white transition ${added ? "bg-green-700" : "bg-ink hover:bg-brass-dark"}`}
            >
              {added ? (<><CheckIcon width={22} height={22} /> <T>{site.showPrices ? "تمت الإضافة للسلة" : "أُضيف للقائمة"}</T></>) : <T>{site.showPrices ? "أضف إلى السلة" : "أضف إلى قائمتي"}</T>}
            </button>
            <a
              href={`https://wa.me/${site.whatsapp}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full border border-ink/20 px-7 py-4 font-bold transition hover:border-[#25D366] hover:bg-[#25D366] hover:text-white"
            >
              <WhatsAppIcon width={22} height={22} />
              <T>اسأل عبر واتساب</T>
            </a>
          </div>
          {site.showPrices && (
          <Link
            href="/checkout"
            onClick={(e) => {
              if (!add()) e.preventDefault();
            }}
            className="block text-center text-sm font-bold text-brass-dark underline-offset-4 hover:underline"
          >
            <T>اشترِ الآن وانتقل للدفع مباشرة</T>
          </Link>
          )}
        </>
      ) : (
        <div className="rounded-2xl bg-red-50 p-6 text-center">
          <p className="font-display text-xl font-bold text-red-700"><T>هذا المنتج غير متاح حاليًا</T></p>
          <a
            href={`https://wa.me/${site.whatsapp}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-7 py-3 font-bold text-white"
          >
            <WhatsAppIcon width={20} height={20} />
            <T>اسأل عن موعد التوفر</T>
          </a>
        </div>
      )}
    </div>
  );
}
