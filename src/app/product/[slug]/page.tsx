import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts, getReviews, getSettings } from "@/lib/data";
import { formatNumber, formatPrice, img } from "@/lib/format";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchase from "@/components/ProductPurchase";
import ProductCard from "@/components/ProductCard";
import Reviews from "@/components/Reviews";
import Reveal from "@/components/Reveal";
import Stars from "@/components/Stars";
import { CheckIcon, ClockIcon, RulerIcon, ShieldIcon } from "@/components/Icons";
import Editable from "@/components/Editable";
import EditableProductField from "@/components/EditableProductField";
import { ProductAdminControls } from "@/components/EditModals";

import Money from "@/components/Money";
import T from "@/components/T";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "المنتج غير موجود" };
  return {
    title: p.name,
    description: p.shortDescription,
    openGraph: { title: p.name, description: p.shortDescription, images: [img(p.images[0], 1200)] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, all, site] = await Promise.all([getReviews(product.id), getProducts(), getSettings()]);
  const related = all
    .filter((p) => p.id !== product.id)
    .sort(
      (a, b) =>
        Number(b.categorySlug === product.categorySlug) - Number(a.categorySlug === product.categorySlug) ||
        b.sales - a.sales,
    )
    .slice(0, 4);

  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.sku || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    image: product.images,
    ...(site.showPrices && {
      offers: {
        "@type": "Offer",
        priceCurrency: "EGP",
        price: product.price,
        availability: product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    }),
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      },
    }),
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pb-8 pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="مسار التنقل">
        <Link href="/" className="hover:text-ink"><T>الرئيسية</T></Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-ink"><T>المتجر</T></Link>
        <span>/</span>
        <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-ink">
          {product.categoryName}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="animate-fade-in lg:sticky lg:top-28 lg:self-start">
          <ProductGallery images={product.images} name={product.name} badge={product.badge} />
        </div>

        <div className="animate-fade-up">
          <ProductAdminControls product={product} variant="page" />
          <Link href={`/shop?category=${product.categorySlug}`} className="text-sm font-bold text-brass-dark">
            {product.categoryName}
          </Link>
          <EditableProductField productId={product.id} field="name" value={product.name} as="h1" className="mt-2 text-3xl font-bold leading-snug md:text-4xl" />

          <a href="#reviews" className="mt-4 inline-flex items-center gap-3">
            <Stars rating={product.rating} size={18} />
            <span className="font-bold">{formatNumber(product.rating)}</span>
            <span className="text-sm text-muted underline-offset-4 hover:underline">
              (<T>{`${formatNumber(product.reviewCount)} تقييم`}</T>)
            </span>
          </a>

          {!site.showPrices && (
            <div className="mt-6 rounded-2xl border border-brass/30 bg-brass/5 p-5">
              <p className="font-display text-xl font-bold"><T>اطلب عرض سعر مجاني</T></p>
              <p className="mt-1 text-sm leading-7 text-muted">
                <T>السعر يُحدَّد حسب المساحة ونوع التشطيب. أضف ما يعجبك إلى قائمتك وأرسلها لنا على واتساب لنرسل لك عرض سعر خلال ٢٤ ساعة.</T>
              </p>
            </div>
          )}
          {site.showPrices && (
          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <EditableProductField productId={product.id} field="price" value={product.price} numeric as="span" className="font-display text-4xl font-bold">
              <span className="font-display text-4xl font-bold"><Money v={product.price} /></span>
            </EditableProductField>
            <span className="text-muted">/ {product.unit}</span>
            {product.compareAtPrice && (
              <>
                <span className="text-lg text-muted line-through decoration-brass/60">
                  <Money v={product.compareAtPrice} />
                </span>
                <span className="rounded-full bg-brass px-3 py-1 text-sm font-bold text-white">
                  <T>وفّر</T> {formatNumber(discount)}٪
                </span>
              </>
            )}
          </div>
          )}
          <EditableProductField productId={product.id} field="shortDescription" value={product.shortDescription} as="p" multiline className="mt-5 block leading-8 text-charcoal/90" />

          {(product.brand || product.sku) && (
            <p className="mt-4 flex flex-wrap gap-x-5 text-sm text-muted">
              {product.brand && <span><T>العلامة التجارية:</T> <b className="text-ink">{product.brand}</b></span>}
              {product.sku && <span dir="ltr">SKU: <b className="text-ink">{product.sku}</b></span>}
            </p>
          )}

          <ProductPurchase product={product} />

          <ul className="mt-9 grid gap-4 border-t border-stone-warm pt-8 sm:grid-cols-3">
            {[
              [RulerIcon, "معاينة مجانية", "قياس وتصميم قبل التنفيذ"],
              [ClockIcon, "مدة التنفيذ", product.leadTime],
              [ShieldIcon, "ضمان مكتوب", "حتى ٥ سنوات"],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof RulerIcon;
              return (
                <li key={t as string} className="flex items-start gap-3">
                  <I width={24} height={24} className="mt-0.5 shrink-0 text-brass" />
                  <div>
                    <div className="text-sm font-bold"><T>{t as string}</T></div>
                    <div className="text-xs leading-5 text-muted"><T>{d as string}</T></div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* details */}
      <section className="mt-20 grid gap-12 border-t border-stone-warm pt-16 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <Editable id="product.descTitle" as="h2" className="text-3xl font-bold">وصف الخدمة</Editable>
          <EditableProductField productId={product.id} field="description" value={product.description} multiline className="mt-6 block leading-9 text-charcoal/90">
            <div className="mt-6 space-y-4 leading-9 text-charcoal/90">
              {product.description.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </EditableProductField>
        </Reveal>
        <Reveal delay={120}>
          <div className="rounded-3xl bg-sand p-8">
            <Editable id="product.featuresTitle" as="h3" className="font-display text-2xl font-bold">ماذا تشمل؟</Editable>
            <ul className="mt-5 space-y-4">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brass text-white">
                    <CheckIcon width={14} height={14} />
                  </span>
                  <span className="leading-7">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* reviews */}
      <section className="mt-20 border-t border-stone-warm pt-16">
        <Editable id="product.reviewsTitle" as="h2" className="mb-10 block text-3xl font-bold">تقييمات العملاء</Editable>
        <Reviews productId={product.id} reviews={reviews} rating={product.rating} />
      </section>

      {/* related */}
      <section className="mt-24">
        <Reveal>
          <Editable id="product.relatedTitle" as="h2" className="text-3xl font-bold">قد يعجبك أيضًا</Editable>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {related.map((p, i) => (
            <Reveal key={p.id} delay={i * 90}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
