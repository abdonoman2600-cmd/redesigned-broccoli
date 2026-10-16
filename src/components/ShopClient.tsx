"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductDTO } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { useT } from "./T";
import { useSite } from "./SiteProvider";
import ProductCard from "./ProductCard";
import Stars from "./Stars";
import { CloseIcon, FilterIcon, SearchIcon } from "./Icons";

import T from "@/components/T";
type Sort = "featured" | "popular" | "price-asc" | "price-desc" | "rating" | "newest";

const sortOptions: { value: Sort; label: string }[] = [
  { value: "featured", label: "المميزة أولًا" },
  { value: "popular", label: "الأكثر مبيعًا" },
  { value: "rating", label: "الأعلى تقييمًا" },
  { value: "price-asc", label: "السعر: من الأقل للأعلى" },
  { value: "price-desc", label: "السعر: من الأعلى للأقل" },
  { value: "newest", label: "الأحدث" },
];

const PRICE_BUCKETS = [
  { id: "all", label: "كل الأسعار", min: 0, max: Infinity },
  { id: "u100", label: "أقل من ١٠٠ ج.م", min: 0, max: 100 },
  { id: "100-300", label: "١٠٠ - ٣٠٠ ج.م", min: 100, max: 300 },
  { id: "300-600", label: "٣٠٠ - ٦٠٠ ج.م", min: 300, max: 600 },
  { id: "600+", label: "أكثر من ٦٠٠ ج.م", min: 600, max: Infinity },
];

export default function ShopClient({
  products,
  categories,
  initialCategory,
  initialQuery,
  initialSort,
  initialOnSale,
}: {
  products: ProductDTO[];
  categories: { slug: string; name: string }[];
  initialCategory: string | null;
  initialQuery: string;
  initialSort: string | null;
  initialOnSale: boolean;
}) {
  const t = useT();
  const { showPrices } = useSite();
  const validInitial = categories.some((c) => c.slug === initialCategory) ? initialCategory : null;
  const [category, setCategory] = useState<string | null>(validInitial);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<Sort>(sortOptions.some((o) => o.value === initialSort && (showPrices || !o.value.startsWith("price"))) ? (initialSort as Sort) : "featured");
  const [bucket, setBucket] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [onSale, setOnSale] = useState(initialOnSale && showPrices);
  const [drawer, setDrawer] = useState(false);

  // keep url in sync with category (so links are shareable)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (category) url.searchParams.set("category", category);
    else url.searchParams.delete("category");
    window.history.replaceState(null, "", url.toString());
  }, [category]);

  // follow header link navigations (?category=) while staying on /shop
  useEffect(() => {
    setCategory(validInitial);
    setQuery(initialQuery);
  }, [validInitial, initialQuery]);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    products.forEach((p) => m.set(p.categorySlug, (m.get(p.categorySlug) ?? 0) + 1));
    return m;
  }, [products]);

  const filtered = useMemo(() => {
    const b = PRICE_BUCKETS.find((x) => x.id === bucket)!;
    const q = query.trim();
    let list = products.filter((p) => {
      if (category && p.categorySlug !== category) return false;
      if (p.price < b.min || p.price >= b.max) return false;
      if (minRating && p.rating < minRating) return false;
      if (onSale && !p.compareAtPrice) return false;
      if (q && !(p.name + p.shortDescription + p.categoryName + p.sku + p.brand).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    list = [...list];
    switch (sort) {
      case "featured":
        list.sort((a, b) => Number(b.featured) - Number(a.featured) || b.sales - a.sales);
        break;
      case "popular":
        list.sort((a, b) => b.sales - a.sales);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        list.sort((a, b) => Number(b.newArrival) - Number(a.newArrival) || +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
    }
    return list;
  }, [products, category, bucket, minRating, onSale, query, sort]);

  const activeCount =
    (category ? 1 : 0) + (bucket !== "all" ? 1 : 0) + (minRating ? 1 : 0) + (onSale ? 1 : 0) + (query ? 1 : 0);

  const reset = () => {
    setCategory(null);
    setBucket("all");
    setMinRating(0);
    setOnSale(false);
    setQuery("");
  };

  const filters = (
    <div className="space-y-9">
      <div>
        <h3 className="font-display text-lg font-bold"><T>الأقسام</T></h3>
        <ul className="mt-4 space-y-1">
          <li>
            <FilterRow active={!category} onClick={() => setCategory(null)} label="الكل" count={products.length} />
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <FilterRow
                active={category === c.slug}
                onClick={() => setCategory(c.slug)}
                label={c.name}
                count={counts.get(c.slug) ?? 0}
              />
            </li>
          ))}
        </ul>
      </div>

      {showPrices && (
      <div>
        <h3 className="font-display text-lg font-bold"><T>السعر</T></h3>
        <ul className="mt-4 space-y-1">
          {PRICE_BUCKETS.map((b) => (
            <li key={b.id}>
              <FilterRow active={bucket === b.id} onClick={() => setBucket(b.id)} label={b.label} />
            </li>
          ))}
        </ul>
      </div>
      )}

      <div>
        <h3 className="font-display text-lg font-bold"><T>التقييم</T></h3>
        <ul className="mt-4 space-y-1">
          {[0, 4.5, 4].map((r) => (
            <li key={r}>
              <button
                onClick={() => setMinRating(r)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${
                  minRating === r ? "bg-ink text-white" : "hover:bg-sand"
                }`}
              >
                {r === 0 ? (
                  <T>كل التقييمات</T>
                ) : (
                  <>
                    <Stars rating={r} size={14} />
                    <span className="text-sm">{formatNumber(r)} <T>فأكثر</T></span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {showPrices && (
      <label className="flex cursor-pointer items-center justify-between rounded-xl bg-sand px-4 py-3.5">
        <span className="font-bold"><T>العروض والتخفيضات فقط</T></span>
        <span
          className={`relative h-6 w-11 rounded-full transition ${onSale ? "bg-brass" : "bg-stone-warm"}`}
        >
          <input
            type="checkbox"
            checked={onSale}
            onChange={(e) => setOnSale(e.target.checked)}
            className="peer sr-only"
          />
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              onSale ? "right-[22px]" : "right-0.5"
            }`}
          />
        </span>
      </label>
      )}

      {activeCount > 0 && (
        <button onClick={reset} className="w-full rounded-full border border-ink/20 py-3 text-sm font-bold transition hover:bg-ink hover:text-white">
          <T>مسح كل الفلاتر</T>
        </button>
      )}
    </div>
  );

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-96">
          <SearchIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("ابحث عن سقف، دهان، ديكور...")}
            className="w-full rounded-full border border-stone-warm bg-white py-3.5 pl-5 pr-12 outline-none transition focus:border-brass focus:ring-4 focus:ring-brass/15"
            aria-label="بحث"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawer(true)}
            className="flex items-center gap-2 rounded-full border border-stone-warm bg-white px-5 py-3 font-medium lg:hidden"
          >
            <FilterIcon width={18} height={18} />
            <T>تصفية</T>
            {activeCount > 0 && (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-brass text-xs text-white">
                {formatNumber(activeCount)}
              </span>
            )}
          </button>
          <label className="flex flex-1 items-center gap-2 rounded-full border border-stone-warm bg-white px-4 py-1 md:flex-none">
            <span className="hidden text-sm text-muted sm:inline"><T>ترتيب:</T></span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="w-full bg-transparent py-2.5 font-medium outline-none"
              aria-label="ترتيب المنتجات"
            >
              {sortOptions.filter((o) => showPrices || !o.value.startsWith("price")).map((o) => (
                <option key={o.value} value={o.value}>
                  {t(o.label)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* category chips (mobile + quick) */}
      <div className="no-scrollbar -mx-6 mt-6 flex gap-2 overflow-x-auto px-6 lg:hidden">
        {[{ slug: "", name: "الكل" }, ...categories].map((c) => {
          const active = (category ?? "") === c.slug;
          return (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug || null)}
              className={`shrink-0 rounded-full border px-5 py-2 text-sm font-medium transition ${
                active ? "border-ink bg-ink text-white" : "border-stone-warm bg-white"
              }`}
            >
              {t(c.name)}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">{filters}</div>
        </aside>

        <div>
          <div className="mb-6 flex items-center justify-between text-sm text-muted">
            <span>
              <T>عرض</T> <b className="text-ink">{formatNumber(filtered.length)}</b> <T>من</T> {formatNumber(products.length)} <T>منتج</T>
            </span>
            {activeCount > 0 && (
              <button onClick={reset} className="font-bold text-brass-dark hover:underline">
                <T>مسح الفلاتر</T>
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-warm bg-white/60 px-6 py-24 text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-sand text-brass">
                <SearchIcon width={34} height={34} />
              </div>
              <h3 className="mt-6 font-display text-2xl"><T>لا توجد نتائج مطابقة</T></h3>
              <p className="mt-2 text-muted"><T>جرّب تغيير الفلاتر أو كلمات البحث.</T></p>
              <button onClick={reset} className="mt-6 rounded-full bg-ink px-8 py-3 font-bold text-white hover:bg-brass-dark">
                <T>إعادة ضبط الفلاتر</T>
              </button>
            </div>
          ) : (
            <div
              key={`${category}-${bucket}-${minRating}-${onSale}-${sort}-${query}`}
              className="grid grid-cols-2 gap-x-4 gap-y-10 xl:grid-cols-3 xl:gap-x-6"
            >
              {filtered.map((p, i) => (
                <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
          <div className="animate-drawer-right absolute bottom-0 right-0 top-0 flex w-[88%] max-w-sm flex-col bg-ivory">
            <div className="flex items-center justify-between border-b border-stone-warm px-6 py-5">
              <h2 className="font-display text-2xl font-bold"><T>تصفية المنتجات</T></h2>
              <button onClick={() => setDrawer(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand" aria-label="إغلاق">
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{filters}</div>
            <div className="border-t border-stone-warm p-5">
              <button onClick={() => setDrawer(false)} className="w-full rounded-full bg-ink py-4 font-bold text-white">
                <T>عرض</T> {formatNumber(filtered.length)} <T>منتج</T>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function FilterRow({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start transition ${
        active ? "bg-ink text-white" : "hover:bg-sand"
      }`}
    >
      <span>{useT()(label)}</span>
      {count !== undefined && (
        <span className={`text-xs ${active ? "text-white/70" : "text-muted"}`}>{formatNumber(count)}</span>
      )}
    </button>
  );
}
