import "server-only";
import { products } from "@/db/schema";
import { digits, validImg } from "./api";

export type ProductSet = Partial<typeof products.$inferInsert>;

const toInt = (v: unknown) => {
  const n = Math.round(Number(digits(String(v))));
  return Number.isFinite(n) ? n : NaN;
};
const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const hex = /^#[0-9a-fA-F]{6}$/;

/** Validates & normalises a (partial) product update. Used by drafts, direct edits, import and restore. */
export function sanitizePatch(
  p: Record<string, unknown>,
  cur?: { name: string; price: number; compareAtPrice: number | null },
): { set: ProductSet; error?: string } {
  const set: ProductSet = {};
  const fail = (error: string) => ({ set, error });

  if (p.name !== undefined) {
    const n = text(p.name, 160);
    if (n.length < 2) return fail("اسم المنتج قصير جدًا");
    set.name = n;
  }
  if (p.nameEn !== undefined) set.nameEn = text(p.nameEn, 160);
  if (p.shortDescription !== undefined) set.shortDescription = text(p.shortDescription, 300) || cur?.name || "";
  if (p.shortDescriptionEn !== undefined) set.shortDescriptionEn = text(p.shortDescriptionEn, 300);
  if (p.description !== undefined) set.description = text(p.description, 5000) || cur?.name || "";
  if (p.descriptionEn !== undefined) set.descriptionEn = text(p.descriptionEn, 5000);
  if (typeof p.unit === "string" && p.unit.trim()) set.unit = text(p.unit, 30);
  if (p.badge !== undefined) set.badge = text(p.badge, 30) || null;
  if (typeof p.leadTime === "string" && p.leadTime.trim()) set.leadTime = text(p.leadTime, 60);
  if (typeof p.optionsLabel === "string") set.optionsLabel = text(p.optionsLabel, 40) || "الخيارات";
  if (typeof p.active === "boolean") set.active = p.active;
  if (typeof p.featured === "boolean") set.featured = p.featured;
  if (typeof p.available === "boolean") set.available = p.available;
  if (typeof p.newArrival === "boolean") set.newArrival = p.newArrival;
  if (p.sku !== undefined) set.sku = text(p.sku, 60);
  if (p.brand !== undefined) set.brand = text(p.brand, 60);

  if (p.stock !== undefined) {
    if (p.stock === null || p.stock === "") set.stock = null;
    else {
      const n = toInt(p.stock);
      if (!(n >= 0)) return fail("الكمية المتوفرة غير صحيحة");
      set.stock = n;
    }
  }
  if (p.minQty !== undefined) set.minQty = Math.max(1, toInt(p.minQty) || 1);
  if (p.step !== undefined) set.step = Math.max(1, toInt(p.step) || 1);
  if (p.categoryId !== undefined) {
    const c = toInt(p.categoryId);
    if (!(c > 0)) return fail("اختر القسم");
    set.categoryId = c;
  }
  if (typeof p.slug === "string") {
    const slug = p.slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
    if (slug) set.slug = slug;
  }
  if (Array.isArray(p.features)) set.features = p.features.map((f) => text(f, 160)).filter(Boolean).slice(0, 12);
  if (Array.isArray(p.sizes)) set.sizes = p.sizes.map((f) => text(f, 30)).filter(Boolean).slice(0, 20);
  if (Array.isArray(p.colors)) {
    set.colors = (p.colors as Record<string, unknown>[])
      .map((c) => ({ name: text(c.name, 30), hex: hex.test(String(c.hex)) ? String(c.hex) : "#cccccc" }))
      .filter((c) => c.name)
      .slice(0, 20);
  }
  if (Array.isArray(p.options)) {
    set.options = (p.options as Record<string, unknown>[])
      .map((o) => ({ label: text(o.label, 80), priceDelta: toInt(o.priceDelta) || 0 }))
      .filter((o) => o.label)
      .slice(0, 20);
  }
  if (p.price !== undefined) {
    const price = toInt(p.price);
    if (!(price >= 1)) return fail("السعر غير صحيح");
    set.price = price;
  }
  const price = set.price ?? cur?.price;
  if (p.compareAtPrice !== undefined) {
    const c = p.compareAtPrice === null || p.compareAtPrice === "" ? 0 : toInt(p.compareAtPrice);
    set.compareAtPrice = price && c > price ? c : null;
  } else if (set.price !== undefined && cur?.compareAtPrice && cur.compareAtPrice <= set.price) {
    set.compareAtPrice = null;
  }
  if (Array.isArray(p.images)) {
    const imgs = p.images.map((x) => String(x).trim()).filter(validImg).slice(0, 12);
    if (imgs.length === 0) return fail("أضف صورة واحدة على الأقل");
    set.images = imgs;
  }
  return { set };
}

export function pickBefore<T extends Record<string, unknown>>(row: T, keys: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = row[k];
  return out;
}
