"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProductDTO } from "@/lib/types";
import { formatNumber, formatPrice, img } from "@/lib/format";
import { buildCartItem } from "@/lib/cart-utils";
import { useCart } from "./CartProvider";
import { useSite } from "./SiteProvider";
import Stars from "./Stars";
import { CheckIcon, PlusIcon } from "./Icons";
import { ProductAdminControls } from "./EditModals";

import Money from "@/components/Money";
import T from "@/components/T";
export default function ProductCard({ product: p }: { product: ProductDTO }) {
  const { addItem } = useCart();
  const { showPrices } = useSite();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const discount = showPrices && p.compareAtPrice ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!p.available) return;
    if (p.colors.length || p.sizes.length) {
      router.push(`/product/${p.slug}`);
      return;
    }
    addItem(buildCartItem(p, 0));
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative">
        <ProductAdminControls product={p} />
      <Link
        href={`/product/${p.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-sand"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img(p.images[0], 700)}
          alt={p.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img(p.images[1] ?? p.images[0], 700)}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

        <div className="absolute right-3 top-3 flex flex-col items-start gap-1.5">
          {!p.available && (
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white"><T>غير متاح</T></span>
          )}
          {p.badge && (
            <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">{p.badge}</span>
          )}
          {discount > 0 && !p.badge?.includes("%") && !p.badge?.includes("٪") && (
            <span className="rounded-full bg-brass px-3 py-1 text-xs font-bold text-white">
              -{formatNumber(discount)}٪
            </span>
          )}
        </div>
      </Link>

      <button
        onClick={quickAdd}
        aria-label={`أضف ${p.name} إلى السلة`}
        className={`absolute inset-x-3 bottom-3 z-10 hidden h-12 items-center justify-center gap-2 rounded-full text-sm font-bold shadow-lg transition-all duration-300 md:flex ${
          added
            ? "translate-y-0 bg-green-700 text-white opacity-100"
            : "translate-y-3 bg-white text-ink opacity-0 hover:bg-ink hover:text-white group-hover:translate-y-0 group-hover:opacity-100"
        }`}
      >
        {added ? <CheckIcon width={18} height={18} /> : <PlusIcon width={18} height={18} />}
        <T>{added ? (showPrices ? "أُضيف للسلة" : "أُضيف للقائمة") : showPrices ? "أضف للسلة" : "أضف للقائمة"}</T>
      </button>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-xs text-brass-dark">{p.categoryName}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[3.2rem] font-display text-lg font-semibold leading-snug">
          <Link href={`/product/${p.slug}`} className="transition hover:text-brass-dark">
            {p.name}
          </Link>
        </h3>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <Stars rating={p.rating} size={14} />
          <span>({formatNumber(p.reviewCount)})</span>
        </div>
        {showPrices ? (
          <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-3">
            <span className="text-lg font-extrabold"><Money v={p.price} /></span>
            <span className="text-xs text-muted">/ {p.unit}</span>
            {p.compareAtPrice && (
              <span className="text-sm text-muted line-through decoration-brass/60">
                {formatNumber(p.compareAtPrice)}
              </span>
            )}
          </div>
        ) : (
          <p className="mt-auto line-clamp-2 pt-2 text-sm leading-6 text-muted">{p.shortDescription}</p>
        )}
        <button
          onClick={quickAdd}
          className="mt-3 flex items-center justify-center gap-2 rounded-full border border-ink/15 py-2.5 text-sm font-bold transition hover:bg-ink hover:text-white md:hidden"
        >
          {added ? <CheckIcon width={16} height={16} /> : <PlusIcon width={16} height={16} />}
          <T>{added ? (showPrices ? "أُضيف للسلة" : "أُضيف للقائمة") : showPrices ? "أضف للسلة" : "أضف للقائمة"}</T>
        </button>
      </div>
    </article>
  );
}
