import Link from "next/link";
import {
  DEFAULT_HERO_HIGHLIGHT,
  DEFAULT_HERO_TEXT,
  DEFAULT_HERO_TITLE,
  getCategories,
  getGallery,
  getProducts,
  getSettings,
  getStoreStats,
  getTopReviews,
} from "@/lib/data";
import { formatDate, formatNumber, img } from "@/lib/format";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import Stars from "@/components/Stars";
import Editable from "@/components/Editable";
import EditableImage from "@/components/EditableImage";
import EditableMarquee from "@/components/EditableMarquee";
import { CategoryAdminButton } from "@/components/EditModals";
import { ArrowLeftIcon, CheckIcon, RulerIcon, ShieldIcon, SparkIcon, TruckIcon } from "@/components/Icons";

import T from "@/components/T";
export const dynamic = "force-dynamic";

const ABOUT = "https://images.pexels.com/photos/11427524/pexels-photo-11427524.jpeg?auto=compress&cs=tinysrgb&w=1200";
const ABOUT2 = "https://images.pexels.com/photos/6238608/pexels-photo-6238608.jpeg?auto=compress&cs=tinysrgb&w=1200";
const CTA = "https://images.pexels.com/photos/8135119/pexels-photo-8135119.jpeg?auto=compress&cs=tinysrgb&w=1920";

const marquee = [
  "أسقف جبس بورد",
  "ديكور جدران",
  "دهانات ورنج",
  "إضاءة مخفية",
  "وحدات تلفزيون",
  "كرانيش وبانوهات",
  "فواصل عازلة",
  "تشطيب شقق",
];

const steps = [
  { n: "١", title: "اطلب أو تواصل معنا", text: "اختر المنتج من المتجر أو كلمنا واتساب وأخبرنا بفكرتك." },
  { n: "٢", title: "معاينة وقياس مجاني", text: "يزورك مهندسنا، يقيس المكان ويؤكد التصميم والسعر النهائي." },
  { n: "٣", title: "تنفيذ بأيدي محترفين", text: "فريق متخصص يلتزم بالجدول الزمني ويحافظ على نظافة المكان." },
  { n: "٤", title: "تسليم وضمان", text: "نراجع معك كل التفاصيل ونسلّمك المكان مع ضمان مكتوب." },
];

const why = [
  { Icon: RulerIcon, title: "معاينة وتصميم مجانيان", text: "نزورك ونقيس المكان ونعرض تصورًا ثلاثي الأبعاد قبل أي التزام." },
  { Icon: ShieldIcon, title: "ضمان حتى ٥ سنوات", text: "ضمان مكتوب على التنفيذ والخامات، وخدمة ما بعد التسليم." },
  { Icon: TruckIcon, title: "التزام بالمواعيد", text: "جدول زمني واضح ونظافة تامة للموقع يوميًا وعند التسليم." },
];

const heroStats = [
  [`+${formatNumber(12)}`, "سنة خبرة"],
  [`+${formatNumber(850)}`, "مشروع منفّذ"],
  [formatNumber(5), "سنوات ضمان"],
];

export default async function HomePage() {
  const [products, categories, topReviews, stats, site, gallery] = await Promise.all([
    getProducts(),
    getCategories(),
    getTopReviews(3),
    getStoreStats(),
    getSettings(),
    getGallery({ limit: 6 }),
  ]);

  const top = (list: typeof products, n = 4) => list.slice(0, n);
  const sections = [
    { id: "featured", eyebrow: "مختارات", title: "المنتجات المميزة", cta: "عرض الكل", href: "/shop", list: top(products.filter((p) => p.featured).sort((a, b) => b.sales - a.sales)) },
    { id: "best", eyebrow: "الأكثر طلبًا", title: "الأكثر مبيعًا", cta: "عرض الكل", href: "/shop?sort=popular", list: top([...products].sort((a, b) => b.sales - a.sales)) },
    { id: "new", eyebrow: "جديدنا", title: "وصل حديثًا", cta: "عرض الكل", href: "/shop?sort=newest", list: top([...products].sort((a, b) => Number(b.newArrival) - Number(a.newArrival) || +new Date(b.createdAt) - +new Date(a.createdAt))) },
    ...(site.showPrices ? [{ id: "offers", eyebrow: "وفّر أكثر", title: "العروض والتخفيضات", cta: "كل العروض", href: "/shop?offers=1", list: top(products.filter((p) => p.compareAtPrice).sort((a, b) => (b.compareAtPrice! - b.price) / b.compareAtPrice! - (a.compareAtPrice! - a.price) / a.compareAtPrice!)) }] : []),
  ];

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-ink text-white">
        <EditableImage
          id="hero.image"
          src={site.heroImage}
          alt="صالة حديثة بسقف جبس بورد وإضاءة مخفية"
          className="animate-slow-zoom absolute inset-0 -z-20 h-full w-full object-cover"
          width={1920}
          priority
          overlayClass="left-4 bottom-48 md:bottom-40"
          label="📷 تغيير صورة الواجهة"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-l from-ink/90 via-ink/60 to-ink/20" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink/70 to-transparent" />

        <div className="mx-auto w-full max-w-7xl px-6 pb-52 pt-36 md:pb-32">
          <div className="max-w-2xl">
            <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              <SparkIcon width={16} height={16} className="text-brass-light" />
              <Editable id="home.hero.badge">ديكور · جبس بورد · رنج</Editable>
            </p>
            <h1 className="animate-fade-up delay-1 mt-6 text-5xl font-bold leading-[1.2] md:text-7xl">
              <Editable id="hero.title" className="block">{DEFAULT_HERO_TITLE}</Editable>
              <Editable id="hero.highlight" className="block text-brass-light">{DEFAULT_HERO_HIGHLIGHT}</Editable>
            </h1>
            <Editable
              id="hero.text"
              as="p"
              multiline
              className="animate-fade-up delay-2 mt-6 block max-w-xl text-lg leading-9 text-white/85 md:text-xl"
            >
              {DEFAULT_HERO_TEXT}
            </Editable>
            <div className="animate-fade-up delay-3 mt-9 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="group inline-flex items-center gap-3 rounded-full bg-brass px-8 py-4 text-lg font-bold text-white shadow-xl shadow-brass/30 transition hover:bg-brass-light"
              >
                <Editable id="home.hero.cta1">تسوّق الآن</Editable>
                <ArrowLeftIcon className="rtl-flip transition group-hover:-translate-x-1" />
              </Link>
              <Link
                href="/shop?category=packages"
                className="inline-flex items-center rounded-full border border-white/40 px-8 py-4 text-lg font-medium backdrop-blur transition hover:bg-white hover:text-ink"
              >
                <Editable id="home.hero.cta2">باقات التشطيب</Editable>
              </Link>
            </div>
          </div>
        </div>

        <div className="animate-fade-up delay-4 absolute inset-x-0 bottom-0">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-4 border-t border-white/20 px-6 py-6 md:grid-cols-4">
            {heroStats.map(([v, l], i) => (
              <div key={i} className="text-center md:text-start">
                <Editable id={`home.stat.${i}.value`} className="block font-display text-3xl font-bold text-brass-light">{v}</Editable>
                <Editable id={`home.stat.${i}.label`} className="block text-sm text-white/75">{l}</Editable>
              </div>
            ))}
            <div className="text-center md:text-start">
              <div className="font-display text-3xl font-bold text-brass-light">{`${formatNumber(stats.avg)} / ٥`}</div>
              <div className="text-sm text-white/75"><T>من</T> {formatNumber(stats.reviewCount)} <T>تقييم</T></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- MARQUEE ---------------- */}
      <EditableMarquee items={marquee} />

      {/* ---------------- COLLECTIONS ---------------- */}
      <section className="mx-auto max-w-7xl px-6 pt-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Editable id="home.collections.eyebrow" as="p" className="text-sm font-bold tracking-wider text-brass-dark">المجموعات</Editable>
              <Editable id="home.collections.title" as="h2" className="mt-2 text-4xl font-bold md:text-5xl">اختر ما يناسب مساحتك</Editable>
            </div>
            <Link href="/shop" className="group flex items-center gap-2 font-bold text-brass-dark">
              <Editable id="home.collections.link">عرض كل المنتجات</Editable>
              <ArrowLeftIcon width={18} height={18} className="rtl-flip transition group-hover:-translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-6 md:grid-rows-2">
          {categories.slice(0, 5).map((c, i) => {
            const span =
              i === 0
                ? "md:col-span-3 md:row-span-2 min-h-[420px]"
                : i === 1
                  ? "md:col-span-3 min-h-[220px]"
                  : i === 2
                    ? "md:col-span-3 min-h-[220px] md:hidden"
                    : "md:col-span-1 min-h-[220px] md:hidden";
            return (
              <Reveal key={c.id} delay={i * 90} className={span}>
                <CollectionCard c={c} />
              </Reveal>
            );
          })}
          <div className="hidden gap-5 md:col-span-3 md:grid md:grid-cols-3">
            {categories.slice(2, 5).map((c, i) => (
              <Reveal key={c.id} delay={i * 90} className="min-h-[220px]">
                <CollectionCard c={c} compact />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- PRODUCT SECTIONS ---------------- */}
      {sections.map((sec, si) =>
        sec.list.length === 0 ? null : (
          <section key={sec.id} className="mx-auto max-w-7xl px-6 pt-28">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <Editable id={`home.${sec.id}.eyebrow`} as="p" className="text-sm font-bold tracking-wider text-brass-dark">{sec.eyebrow}</Editable>
                  <Editable id={`home.${sec.id}.title`} as="h2" className="mt-2 text-4xl font-bold md:text-5xl">{sec.title}</Editable>
                </div>
                <Link href={sec.href} className="group flex items-center gap-2 font-bold text-brass-dark">
                  <Editable id={`home.${sec.id}.cta`}>{sec.cta}</Editable>
                  <ArrowLeftIcon width={18} height={18} className="rtl-flip transition group-hover:-translate-x-1" />
                </Link>
              </div>
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
              {sec.list.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 90 + si * 0}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </section>
        ),
      )}

      {/* ---------------- GALLERY PREVIEW ---------------- */}
      {gallery.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pt-28">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Editable id="home.gallery.eyebrow" as="p" className="text-sm font-bold tracking-wider text-brass-dark">معرض الأعمال</Editable>
                <Editable id="home.gallery.title" as="h2" className="mt-2 text-4xl font-bold md:text-5xl">من مشاريعنا الأخيرة</Editable>
              </div>
              <Link href="/gallery" className="group flex items-center gap-2 font-bold text-brass-dark">
                <Editable id="home.gallery.link">شاهد كل الأعمال</Editable>
                <ArrowLeftIcon width={18} height={18} className="rtl-flip transition group-hover:-translate-x-1" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
            {gallery.map((g, i) => (
              <Reveal key={g.id} delay={(i % 3) * 90} className={i === 0 ? "col-span-2 md:col-span-1 md:row-span-2" : ""}>
                <Link href="/gallery" className="group relative block h-full min-h-[200px] overflow-hidden rounded-3xl bg-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img(g.image, i === 0 ? 900 : 600)}
                    alt={g.title}
                    loading="lazy"
                    className={`w-full object-cover transition duration-700 group-hover:scale-105 ${i === 0 ? "h-full min-h-[320px]" : "aspect-[4/3]"}`}
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/75 to-transparent p-4 text-white">
                    <span className="font-display font-bold leading-snug">{g.title}</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- ABOUT / WHY ---------------- */}
      <section className="mx-auto mt-28 max-w-7xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
              <EditableImage id="home.about.image" src={ABOUT} alt="فني يركّب ألواح الجبس بورد" className="h-full w-full object-cover" width={1000} />
            </div>
            <div className="absolute -bottom-8 -left-4 hidden w-48 overflow-hidden rounded-2xl border-8 border-ivory shadow-2xl md:block lg:-left-10 lg:w-56">
              <EditableImage id="home.about.image2" src={ABOUT2} alt="سقف بإضاءة مخفية" className="aspect-square w-full object-cover" width={600} overlayClass="left-2 top-2" label="📷" />
            </div>
            <div className="pattern-dots absolute -right-6 -top-6 -z-10 h-40 w-40" />
          </Reveal>

          <Reveal delay={120}>
            <Editable id="home.why.eyebrow" as="p" className="text-sm font-bold tracking-wider text-brass-dark">لماذا رشيد؟</Editable>
            <Editable id="home.why.title" as="h2" multiline className="mt-2 text-4xl font-bold leading-tight md:text-5xl">
              {"حِرفة متقنة،\nووعد نلتزم به."}
            </Editable>
            <Editable id="home.why.text" as="p" multiline className="mt-5 leading-9 text-muted">
              منذ أكثر من ١٢ عامًا ونحن نحوّل الجدران والأسقف العادية إلى مساحات تُلفت الأنظار. نعمل بفرق متخصصة في الجبس بورد والدهانات والديكور، ونستخدم خامات أصلية فقط.
            </Editable>
            <ul className="mt-8 space-y-6">
              {why.map(({ Icon, title, text }, i) => (
                <li key={i} className="flex gap-5">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sand text-brass-dark">
                    <Icon width={26} height={26} />
                  </span>
                  <div>
                    <Editable id={`home.why.${i}.title`} as="h3" className="text-xl font-bold">{title}</Editable>
                    <Editable id={`home.why.${i}.text`} as="p" multiline className="mt-1 leading-7 text-muted">{text}</Editable>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ---------------- PROCESS ---------------- */}
      <section className="mt-28 bg-ink py-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <Editable id="home.process.eyebrow" as="p" className="text-sm font-bold tracking-wider text-brass-light">كيف نعمل</Editable>
              <Editable id="home.process.title" as="h2" className="mt-2 text-4xl font-bold md:text-5xl">من الفكرة إلى التسليم في ٤ خطوات</Editable>
            </div>
          </Reveal>
          <div className="mt-16 grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 110}>
                <div className="relative h-full rounded-3xl border border-white/10 bg-white/[0.04] p-7 transition hover:border-brass/60 hover:bg-white/[0.07]">
                  <span className="font-display text-6xl font-bold text-brass/70">{s.n}</span>
                  <Editable id={`home.step.${i}.title`} as="h3" className="mt-4 block text-xl font-bold">{s.title}</Editable>
                  <Editable id={`home.step.${i}.text`} as="p" multiline className="mt-2 leading-7 text-white/70">{s.text}</Editable>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="mx-auto max-w-7xl px-6 pt-28">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Editable id="home.reviews.eyebrow" as="p" className="text-sm font-bold tracking-wider text-brass-dark">آراء العملاء</Editable>
              <Editable id="home.reviews.title" as="h2" className="mt-2 text-4xl font-bold md:text-5xl">ثقتكم هي أجمل ما نملك</Editable>
            </div>
            <div className="flex items-center gap-3 rounded-full bg-sand px-5 py-3">
              <Stars rating={stats.avg} size={18} />
              <span className="font-bold">{formatNumber(stats.avg)}</span>
              <span className="text-sm text-muted">({formatNumber(stats.reviewCount)} <T>تقييم</T>)</span>
            </div>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {topReviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 100}>
              <figure className="flex h-full flex-col rounded-3xl border border-stone-warm bg-white p-8">
                <span className="font-display text-6xl leading-none text-brass/40">”</span>
                <Stars rating={r.rating} />
                <blockquote className="mt-4 flex-1 leading-8 text-charcoal">{r.body}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-stone-warm pt-5">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-brass font-bold text-white">{r.author.charAt(0)}</span>
                  <div>
                    <div className="font-bold">{r.author}</div>
                    <div className="text-xs text-muted">
                      {r.city} · {formatDate(r.createdAt)}
                    </div>
                  </div>
                </figcaption>
                {r.productSlug && (
                  <Link href={`/product/${r.productSlug}`} className="mt-4 line-clamp-1 text-xs text-brass-dark hover:underline">
                    {r.productName}
                  </Link>
                )}
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto mt-28 max-w-7xl px-6">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[2rem] px-8 py-20 text-center text-white md:px-16">
            <EditableImage id="home.cta.image" src={CTA} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" width={1600} overlayClass="left-4 top-4" />
            <div className="absolute inset-0 -z-10 bg-ink/70" />
            <Editable id="home.cta.title" as="h2" className="mx-auto block max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
              جاهز تبدأ مشروع الديكور الخاص بك؟
            </Editable>
            <Editable id="home.cta.text" as="p" multiline className="mx-auto mt-5 block max-w-xl text-lg text-white/80">
              احجز معاينة مجانية اليوم، وسنرسل لك عرض سعر مفصّل خلال ٢٤ ساعة.
            </Editable>
            <ul className="mx-auto mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/85">
              {["بدون التزام", "عرض سعر مفصّل", "ضمان مكتوب"].map((t, i) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckIcon width={16} height={16} className="text-brass-light" />
                  <Editable id={`home.cta.bullet.${i}`}>{t}</Editable>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/shop" className="rounded-full bg-brass px-9 py-4 font-bold transition hover:bg-brass-light">
                <Editable id="home.cta.btn1">تصفح المتجر</Editable>
              </Link>
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/50 px-9 py-4 font-bold transition hover:bg-white hover:text-ink"
              >
                <Editable id="home.cta.btn2">تواصل عبر واتساب</Editable>
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function CollectionCard({
  c,
  compact = false,
}: {
  c: { id: number; slug: string; name: string; description: string; image: string; productCount: number; raw: { name: string; description: string; nameEn: string; descriptionEn: string } };
  compact?: boolean;
}) {
  return (
    <Link
      href={`/shop?category=${c.slug}`}
      className="group relative isolate flex h-full min-h-[inherit] flex-col justify-end overflow-hidden rounded-3xl bg-ink p-6 text-white"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img(c.image, compact ? 600 : 1000)}
        alt={c.name}
        loading="lazy"
        className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-110"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent transition group-hover:from-ink/90" />
      <CategoryAdminButton category={c} />
      <p className="text-xs text-brass-light">{formatNumber(c.productCount)} <T>منتجات</T></p>
      <h3 className={`mt-1 font-display font-bold ${compact ? "text-xl" : "text-3xl"}`}>{c.name}</h3>
      {!compact && <p className="mt-2 max-w-sm text-white/80">{c.description}</p>}
      <span className="mt-3 flex items-center gap-2 text-sm font-bold opacity-80 transition group-hover:opacity-100">
        <T>استكشف</T>
        <ArrowLeftIcon width={16} height={16} className="rtl-flip transition group-hover:-translate-x-1" />
      </span>
    </Link>
  );
}
