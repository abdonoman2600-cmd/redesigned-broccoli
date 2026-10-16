import type { ProductOption } from "./types";

export type ProductInput = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  categoryId: number;
  price: number;
  compareAtPrice: number | null;
  unit: string;
  minQty: number;
  step: number;
  images: string[];
  options: ProductOption[];
  optionsLabel: string;
  features: string[];
  badge: string | null;
  featured: boolean;
  active: boolean;
  leadTime: string;
};

const int = (v: unknown, d = 0) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : d;
};

export function parseProductInput(b: Record<string, unknown>): { value?: ProductInput; error?: string } {
  const name = String(b.name ?? "").trim().slice(0, 160);
  if (name.length < 3) return { error: "اسم المنتج مطلوب" };

  const images = (Array.isArray(b.images) ? b.images : [])
    .map((x) => String(x).trim())
    .filter((x) => x.startsWith("/api/media/") || /^https?:\/\//.test(x))
    .slice(0, 12);
  if (images.length === 0) return { error: "أضف صورة واحدة على الأقل" };

  const price = int(b.price);
  if (price < 1) return { error: "السعر غير صحيح" };
  const compare = int(b.compareAtPrice);
  const categoryId = int(b.categoryId);
  if (!categoryId) return { error: "اختر القسم" };

  const options = (Array.isArray(b.options) ? (b.options as Record<string, unknown>[]) : [])
    .map((o) => ({ label: String(o.label ?? "").trim().slice(0, 80), priceDelta: int(o.priceDelta) }))
    .filter((o) => o.label);

  const features = (Array.isArray(b.features) ? b.features : [])
    .map((f) => String(f).trim().slice(0, 160))
    .filter(Boolean)
    .slice(0, 12);

  let slug = String(b.slug ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (!slug) slug = `p-${Date.now().toString(36)}`;

  return {
    value: {
      slug,
      name,
      shortDescription: String(b.shortDescription ?? "").trim().slice(0, 300) || name,
      description: String(b.description ?? "").trim().slice(0, 5000) || name,
      categoryId,
      price,
      compareAtPrice: compare > price ? compare : null,
      unit: String(b.unit ?? "").trim().slice(0, 30) || "م²",
      minQty: Math.max(1, int(b.minQty, 1)),
      step: Math.max(1, int(b.step, 1)),
      images,
      options,
      optionsLabel: String(b.optionsLabel ?? "").trim().slice(0, 40) || "الخيارات",
      features,
      badge: String(b.badge ?? "").trim().slice(0, 30) || null,
      featured: Boolean(b.featured),
      active: b.active === undefined ? true : Boolean(b.active),
      leadTime: String(b.leadTime ?? "").trim().slice(0, 60) || "خلال ٣ - ٧ أيام عمل",
    },
  };
}
