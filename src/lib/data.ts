import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, drafts, faqs, galleryItems, pages, products, reviews, settings, shippingZones } from "@/db/schema";
import { buildSeedReviews, seedCategories, seedProducts } from "@/db/seed-data";
import type { CategoryDTO, GalleryDTO, NavItem, PaymentMethod, ProductDTO, ReviewDTO, SiteSettings } from "./types";
import { getView } from "./mode";
import { getLang } from "./lang";
import { tr } from "./i18n";
import { DEFAULT_THEME, sanitizeTheme, type Theme } from "./theme";
import { BRAND } from "./format";
import { CONTENT_LEGACY } from "./content-keys";

let seeding: Promise<void> | null = null;

async function seed() {
  const [flag] = await db.select().from(settings).where(eq(settings.key, "seeded"));
  if (flag) return;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products);
  if (count > 0) {
    await db.insert(settings).values({ key: "seeded", value: "1" }).onConflictDoNothing();
    return;
  }

  await db
    .insert(categories)
    .values(seedCategories.map((c, i) => ({ ...c, sortOrder: i })))
    .onConflictDoNothing();
  const cats = await db.select().from(categories);
  const catId = new Map(cats.map((c) => [c.slug, c.id]));

  await db
    .insert(products)
    .values(
      seedProducts.map((p, i) => ({
        slug: p.slug,
        name: p.name,
        shortDescription: p.shortDescription,
        description: p.description,
        categoryId: catId.get(p.category)!,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        unit: p.unit,
        minQty: p.minQty,
        step: p.step,
        images: p.images,
        options: p.options,
        optionsLabel: p.optionsLabel ?? "مستوى التشطيب",
        features: p.features,
        badge: p.badge ?? null,
        featured: p.featured ?? false,
        sales: p.sales,
        leadTime: p.leadTime ?? "خلال ٣ - ٧ أيام عمل",
        sortOrder: i,
        createdAt: new Date(Date.now() - (seedProducts.length - i) * 86400000 * 3),
      })),
    )
    .onConflictDoNothing();

  const prods = await db.select({ id: products.id, slug: products.slug }).from(products);
  const prodId = new Map(prods.map((p) => [p.slug, p.id]));
  const rows = buildSeedReviews().map((r) => ({
    productId: prodId.get(r.productSlug)!,
    author: r.author,
    city: r.city,
    rating: r.rating,
    title: r.title,
    body: r.body,
    verified: r.verified,
    createdAt: new Date(Date.now() - r.daysAgo * 86400000),
  }));
  await db.insert(reviews).values(rows);
  await db.insert(settings).values({ key: "seeded", value: "1" }).onConflictDoNothing();
}

export function ensureSeeded() {
  if (!seeding) {
    seeding = seed()
      .then(() => ensureCommerceSeeded())
      .catch((e) => {
        seeding = null;
        throw e;
      });
  }
  return seeding;
}

const productSelect = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  shortDescription: products.shortDescription,
  description: products.description,
  categorySlug: categories.slug,
  categoryName: categories.name,
  price: products.price,
  compareAtPrice: products.compareAtPrice,
  unit: products.unit,
  minQty: products.minQty,
  step: products.step,
  images: products.images,
  options: products.options,
  optionsLabel: products.optionsLabel,
  features: products.features,
  badge: products.badge,
  featured: products.featured,
  sales: products.sales,
  leadTime: products.leadTime,
  sortOrder: products.sortOrder,
  sku: products.sku,
  brand: products.brand,
  stock: products.stock,
  available: products.available,
  newArrival: products.newArrival,
  colors: products.colors,
  sizes: products.sizes,
  createdAt: products.createdAt,
  active: products.active,
  catActive: categories.active,
  catNameEn: categories.nameEn,
  nameEn: products.nameEn,
  shortDescriptionEn: products.shortDescriptionEn,
  descriptionEn: products.descriptionEn,
  rating: sql<number>`coalesce((select avg(r.rating) from reviews r where r.product_id = ${products.id}), 0)::float`,
  reviewCount: sql<number>`(select count(*) from reviews r where r.product_id = ${products.id})::int`,
};

const PRODUCT_DRAFT_KEYS = [
  "name", "shortDescription", "description", "price", "compareAtPrice", "unit", "badge", "features",
  "images", "featured", "active", "leadTime", "nameEn", "shortDescriptionEn", "descriptionEn",
] as const;

async function loadProductDrafts(): Promise<Map<number, Record<string, unknown>>> {
  const view = await getView();
  if (!view.showDrafts) return new Map();
  const rows = await db.select().from(drafts).where(eq(drafts.scope, "product"));
  return new Map(rows.map((r) => [Number(r.ref), r.data]));
}

/** Prices are removed from the data sent to the browser unless they are shown, or the owner is editing (needs real numbers). */
async function shouldStripPrices() {
  const [[row], view] = await Promise.all([db.select().from(settings).where(eq(settings.key, "showPrices")), getView()]);
  return row?.value !== "1" && !view.canEdit;
}

type Row = Awaited<ReturnType<typeof selectProductRows>>[number];

function selectProductRows() {
  return db
    .select(productSelect)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id));
}

/** Words that announce a price/discount in a badge ("خصم ١٠٪", "Save 17%"). Hidden together with prices. */
const PRICE_BADGE = /خصم|وفّر|وفر|%|٪|off\b|save/i;

function build(
  rows: Row[],
  draftMap: Map<number, Record<string, unknown>>,
  lang: "ar" | "en",
  strip: boolean,
): ProductDTO[] {
  const out: ProductDTO[] = [];
  for (const r of rows) {
    const d = draftMap.get(r.id);
    const m: Record<string, unknown> = { ...r };
    if (d) for (const k of PRODUCT_DRAFT_KEYS) if (k in d) m[k] = d[k];
    const x = m as unknown as Row;
    if (!x.active || !x.catActive) continue;
    const en = lang === "en";
    const L = (v: string) => (en ? tr("en", v) : v);
    out.push({
      id: x.id,
      slug: x.slug,
      name: en && x.nameEn ? x.nameEn : x.name,
      shortDescription: en && x.shortDescriptionEn ? x.shortDescriptionEn : x.shortDescription,
      description: en ? x.descriptionEn || x.shortDescriptionEn || x.description : x.description,
      categorySlug: x.categorySlug,
      categoryName: en && x.catNameEn ? x.catNameEn : x.categoryName,
      // when prices are hidden, the numbers never leave the server (not even in the page source)
      price: strip ? 0 : x.price,
      compareAtPrice: !strip && x.compareAtPrice && x.compareAtPrice > x.price ? x.compareAtPrice : null,
      unit: L(x.unit),
      minQty: x.minQty,
      step: x.step,
      images: x.images,
      options: x.options.map((o) => ({ label: o.label, priceDelta: strip ? 0 : o.priceDelta, display: L(o.label) })),
      optionsLabel: L(x.optionsLabel),
      features: x.features.map(L),
      badge: x.badge && !(strip && PRICE_BADGE.test(x.badge)) ? L(x.badge) : null,
      featured: x.featured,
      sales: x.sales,
      leadTime: L(x.leadTime),
      sortOrder: x.sortOrder,
      rating: Math.round(x.rating * 10) / 10,
      reviewCount: x.reviewCount,
      sku: x.sku,
      brand: x.brand,
      stock: x.stock,
      available: x.available && (x.stock === null || x.stock > 0),
      newArrival: x.newArrival,
      colors: x.colors,
      sizes: x.sizes,
      createdAt: x.createdAt.toISOString(),
      active: x.active,
      hasDraft: !!d,
      raw: {
        name: x.name,
        nameEn: x.nameEn,
        shortDescription: x.shortDescription,
        shortDescriptionEn: x.shortDescriptionEn,
        description: x.description,
        descriptionEn: x.descriptionEn,
      },
    });
  }
  return out;
}

export async function getProducts(): Promise<ProductDTO[]> {
  await ensureSeeded();
  const [rows, draftMap, lang, strip] = await Promise.all([
    selectProductRows().orderBy(products.sortOrder),
    loadProductDrafts(),
    getLang(),
    shouldStripPrices(),
  ]);
  return build(rows, draftMap, lang, strip);
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  await ensureSeeded();
  const [rows, draftMap, lang, strip] = await Promise.all([
    selectProductRows().where(eq(products.slug, slug)).limit(1),
    loadProductDrafts(),
    getLang(),
    shouldStripPrices(),
  ]);
  return build(rows, draftMap, lang, strip)[0] ?? null;
}

export async function getCategories(): Promise<CategoryDTO[]> {
  await ensureSeeded();
  const lang = await getLang();
  const [rows, prods] = await Promise.all([
    db.select().from(categories).orderBy(categories.sortOrder),
    getProducts(),
  ]);
  const counts = new Map<string, number>();
  prods.forEach((p) => counts.set(p.categorySlug, (counts.get(p.categorySlug) ?? 0) + 1));
  return rows
    .filter((c) => c.active)
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: lang === "en" && c.nameEn ? c.nameEn : c.name,
      description: lang === "en" && c.descriptionEn ? c.descriptionEn : c.description,
      image: c.image,
      productCount: counts.get(c.slug) ?? 0,
      raw: { name: c.name, description: c.description, nameEn: c.nameEn, descriptionEn: c.descriptionEn },
    }));
}

export async function getReviews(productId: number): Promise<ReviewDTO[]> {
  await ensureSeeded();
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));
  return rows.map((r) => ({
    id: r.id,
    author: r.author,
    city: r.city,
    rating: r.rating,
    title: r.title,
    body: r.body,
    verified: r.verified,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getTopReviews(limit = 6): Promise<ReviewDTO[]> {
  await ensureSeeded();
  const rows = await db
    .select({
      id: reviews.id,
      author: reviews.author,
      city: reviews.city,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      verified: reviews.verified,
      createdAt: reviews.createdAt,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .where(eq(reviews.rating, 5))
    .orderBy(desc(reviews.createdAt))
    .limit(60);
  // pick distinct authors for variety
  const seen = new Set<string>();
  const out: ReviewDTO[] = [];
  for (const r of rows) {
    if (seen.has(r.author)) continue;
    seen.add(r.author);
    out.push({ ...r, createdAt: r.createdAt.toISOString() });
    if (out.length >= limit) break;
  }
  return out;
}

export async function getStoreStats() {
  await ensureSeeded();
  const [row] = await db
    .select({
      reviewCount: sql<number>`count(*)::int`,
      avg: sql<number>`coalesce(avg(rating),0)::float`,
    })
    .from(reviews);
  return { reviewCount: row.reviewCount, avg: Math.round(row.avg * 10) / 10 };
}

export const DEFAULT_HERO =
  "https://images.pexels.com/photos/6980724/pexels-photo-6980724.jpeg?auto=compress&cs=tinysrgb&w=1920";
export const DEFAULT_HERO_TITLE = "مساحتك تستحق";
export const DEFAULT_HERO_HIGHLIGHT = "لمسة رشيد";
export const DEFAULT_HERO_TEXT =
  "أسقف جبس بورد بإضاءة مخفية، ديكورات جدران فاخرة ودهانات متقنة. نصمّم وننفّذ لكل من يرغب في بيت أو مكتب أو محل بمستوى راقٍ — بسعر واضح وضمان حقيقي.";

export const DEFAULT_NAV: NavItem[] = [
  { label: "الرئيسية", labelEn: "Home", href: "/", visible: true },
  { label: "المتجر", labelEn: "Shop", href: "/shop", visible: true },
  { label: "أسقف الجبس", labelEn: "Gypsum ceilings", href: "/shop?category=ceilings", visible: true },
  { label: "الدهانات والرنج", labelEn: "Paints", href: "/shop?category=paint", visible: true },
  { label: "معرض الأعمال", labelEn: "Gallery", href: "/gallery", visible: true },
  { label: "من نحن", labelEn: "About", href: "/about", visible: true },
  { label: "اتصل بنا", labelEn: "Contact", href: "/contact", visible: true },
];

export const DEFAULT_PAYMENTS: PaymentMethod[] = [
  { id: "cash", label: "الدفع عند المعاينة / التسليم", description: "ادفع نقدًا لمندوبنا بعد تأكيد الطلب", enabled: true },
  { id: "transfer", label: "تحويل بنكي", description: "سنرسل لك بيانات الحساب بعد تأكيد الطلب", enabled: true },
  { id: "wallet", label: "محفظة إلكترونية / إنستاباي", description: "فودافون كاش، اتصالات كاش، إنستاباي", enabled: true },
];

function parseJson<T>(v: string | undefined, fallback: T): T {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export async function getSettingsMap() {
  const rows = await db.select().from(settings);
  return new Map(rows.map((r) => [r.key, r.value]));
}

export async function getThemeFromMap(m: Map<string, string>): Promise<Theme> {
  return sanitizeTheme(parseJson<Partial<Theme>>(m.get("theme"), DEFAULT_THEME));
}

export async function getSettings(): Promise<SiteSettings> {
  const [m, lang, zones] = await Promise.all([
    getSettingsMap(),
    getLang(),
    db.select().from(shippingZones).where(eq(shippingZones.active, true)).orderBy(shippingZones.sortOrder),
  ]);
  const def = zones.find((z) => !z.regions.trim()) ?? zones[0];
  return {
    phone: m.get("phone") || BRAND.phone,
    whatsapp: m.get("whatsapp") || BRAND.whatsapp,
    address: m.get("address") || BRAND.address,
    email: m.get("email") || BRAND.email,
    heroImage: m.get("heroImage") || DEFAULT_HERO,
    heroTitle: m.get("heroTitle") || DEFAULT_HERO_TITLE,
    heroHighlight: m.get("heroHighlight") || DEFAULT_HERO_HIGHLIGHT,
    heroText: m.get("heroText") || DEFAULT_HERO_TEXT,
    logo: m.get("logo") || "",
    nav: parseJson<NavItem[]>(m.get("nav"), DEFAULT_NAV),
    shipFee: def?.fee ?? 0,
    shipFreeOver: def?.freeOver ?? 0,
    taxRate: Number(m.get("taxRate") || 0),
    taxIncluded: (m.get("taxIncluded") ?? "1") === "1",
    showPrices: m.get("showPrices") === "1",
    lang,
  };
}

export async function getPayments(): Promise<PaymentMethod[]> {
  const m = await getSettingsMap();
  return parseJson<PaymentMethod[]>(m.get("payments"), DEFAULT_PAYMENTS);
}

/** All owner-editable content (id → text / image). Unpublished drafts are merged only in edit/preview mode. */
export async function getContent(): Promise<Record<string, string>> {
  const [m, view] = await Promise.all([getSettingsMap(), getView()]);
  const out: Record<string, string> = {};
  for (const [k, v] of m) if (k.startsWith("c:")) out[k.slice(2)] = v;
  for (const [id, legacy] of Object.entries(CONTENT_LEGACY)) {
    const v = m.get(legacy);
    if (v) out[id] = v;
  }
  if (view.showDrafts) {
    const rows = await db.select().from(drafts).where(eq(drafts.scope, "content"));
    for (const r of rows) {
      const v = String((r.data as { value?: string }).value ?? "");
      if (v === "") delete out[r.ref];
      else out[r.ref] = v;
    }
  }
  return out;
}

/** The storage key in `settings` for a content id (legacy ids keep their old key). */
export function contentStorageKey(id: string) {
  return CONTENT_LEGACY[id] ?? `c:${id}`;
}

/* ---------------- Gallery ---------------- */

const gp = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

const gallerySeed = [
  [6238608, "ممر بسقف جبس وإضاءة LED مخفية", "أسقف"],
  [6585766, "وحدة تلفزيون بتكسية خشبية دافئة", "جدران"],
  [6980724, "صالة معيشة بسقف جبس وثريا مركزية", "أسقف"],
  [7218683, "دهان جدران بلاستيك بتشطيب ناعم", "دهانات"],
  [7227625, "جدار تلفزيون بتصميم حديث", "جدران"],
  [11427405, "تركيب فواصل جبس بورد عازلة", "فواصل"],
  [6394592, "غرفة نوم بإضاءة هادئة ودافئة", "أسقف"],
  [8089161, "جدار رئيسي بدهان استكو فينيسي", "دهانات"],
  [8135119, "مكتب أنيق بسقف مضيء", "أسقف"],
  [7166945, "شقة بتشطيب كامل تسليم مفتاح", "تشطيب كامل"],
] as const;

let gallerySeeding: Promise<void> | null = null;

async function seedGallery() {
  const [flag] = await db.select().from(settings).where(eq(settings.key, "gallerySeeded"));
  if (flag) return;
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(galleryItems);
  if (count === 0) {
    await db.insert(galleryItems).values(
      gallerySeed.map(([id, title, category], i) => ({
        title,
        category,
        description: "",
        image: gp(id),
        sortOrder: i,
      })),
    );
  }
  await db.insert(settings).values({ key: "gallerySeeded", value: "1" }).onConflictDoNothing();
}

export function ensureGallerySeeded() {
  if (!gallerySeeding) {
    gallerySeeding = seedGallery().catch((e) => {
      gallerySeeding = null;
      throw e;
    });
  }
  return gallerySeeding;
}

export async function getGallery(opts: { includeHidden?: boolean; limit?: number } = {}): Promise<GalleryDTO[]> {
  await ensureGallerySeeded();
  const q = db.select().from(galleryItems);
  const rows = await (opts.includeHidden ? q : q.where(eq(galleryItems.active, true)))
    .orderBy(galleryItems.sortOrder, desc(galleryItems.id))
    .limit(opts.limit ?? 500);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    image: r.image,
    category: r.category,
    active: r.active,
    sortOrder: r.sortOrder,
  }));
}

/* ---------------- first-run defaults for new modules (never overwrites anything) ---------------- */

let commerceSeeding: Promise<void> | null = null;
async function seedCommerce() {
  const [flag] = await db.select().from(settings).where(eq(settings.key, "commerceSeeded"));
  if (flag) return;
  const [z] = await db.select({ n: sql<number>`count(*)::int` }).from(shippingZones);
  if (z.n === 0) {
    await db.insert(shippingZones).values({ name: "كل المناطق", regions: "", fee: 250, freeOver: 15000, active: true, sortOrder: 0 });
  }
  const [pg] = await db.select({ n: sql<number>`count(*)::int` }).from(pages);
  if (pg.n === 0) {
    await db.insert(pages).values([
      {
        slug: "about",
        title: "من نحن",
        titleEn: "About us",
        body: "رشيد للديكور والجبس بورد: منذ أكثر من ١٢ عامًا نحوّل الجدران والأسقف العادية إلى مساحات تُلفت الأنظار.\n\nنعمل بفرق متخصصة في الجبس بورد والدهانات والديكور، ونستخدم خامات أصلية فقط، مع معاينة وتصميم مجانيين وضمان مكتوب حتى ٥ سنوات.",
        bodyEn: "Rashid Decor & Gypsum Board: for over 12 years we have been turning ordinary walls and ceilings into spaces that stand out.\n\nOur specialised teams work in gypsum board, painting and decoration using original materials only, with a free site visit and design and a written warranty of up to 5 years.",
        sortOrder: 0,
      },
      {
        slug: "contact",
        title: "اتصل بنا",
        titleEn: "Contact us",
        body: "يسعدنا تواصلكم في أي وقت. احجز معاينة مجانية أو اسأل عن أي خدمة، وسنرد عليك في أقرب وقت.",
        bodyEn: "We would love to hear from you. Book a free site visit or ask about any service and we will get back to you shortly.",
        sortOrder: 1,
      },
    ]);
  }
  const [fq] = await db.select({ n: sql<number>`count(*)::int` }).from(faqs);
  if (fq.n === 0) {
    await db.insert(faqs).values([
      { question: "هل المعاينة مجانية؟", answer: "نعم، المعاينة والقياس والتصميم المبدئي مجانية بدون أي التزام.", questionEn: "Is the site visit free?", answerEn: "Yes. The visit, measurements and initial design are free with no obligation.", sortOrder: 0 },
      { question: "كم مدة التنفيذ؟", answer: "تختلف حسب الخدمة والمساحة، وتظهر المدة التقديرية في صفحة كل منتج. نلتزم بجدول زمني واضح.", questionEn: "How long does the work take?", answerEn: "It depends on the service and area. The estimated duration is shown on each product page and we follow a clear schedule.", sortOrder: 1 },
      { question: "هل توجد ضمانات؟", answer: "نعم، ضمان مكتوب على التنفيذ والخامات يصل إلى ٥ سنوات.", questionEn: "Do you offer a warranty?", answerEn: "Yes. A written warranty on workmanship and materials of up to 5 years.", sortOrder: 2 },
      { question: "ما طرق الدفع المتاحة؟", answer: "الدفع عند المعاينة أو التسليم، التحويل البنكي، أو المحافظ الإلكترونية وإنستاباي.", questionEn: "Which payment methods are available?", answerEn: "Cash on visit or delivery, bank transfer, e-wallets and InstaPay.", sortOrder: 3 },
    ]);
  }
  await db.insert(settings).values({ key: "commerceSeeded", value: "1" }).onConflictDoNothing();
}

export function ensureCommerceSeeded() {
  if (!commerceSeeding) {
    commerceSeeding = seedCommerce().catch((e) => {
      commerceSeeding = null;
      throw e;
    });
  }
  return commerceSeeding;
}
