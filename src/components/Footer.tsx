import Link from "next/link";
import { BRAND, toTel } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";
import { ClockIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "./Icons";
import Editable from "./Editable";

import T from "@/components/T";
export default function Footer({ site, pages = [] }: { site: SiteSettings; pages?: { slug: string; title: string; titleEn: string }[] }) {
  const en = site.lang === "en";
  return (
    <footer className="mt-24 bg-ink text-stone-warm">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            {site.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.logo} alt={BRAND.name} className="h-12 w-auto max-w-[130px] rounded-md object-contain" />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brass font-display text-2xl font-bold text-white"><T>ر</T></span>
            )}
            <div>
              <Editable id="brand.name" className="block font-display text-3xl font-bold text-white">{BRAND.name}</Editable>
              <Editable id="brand.tagline" className="block text-sm text-stone-warm/70">{BRAND.tagline}</Editable>
            </div>
          </div>
          <Editable id="footer.about" as="p" multiline className="mt-6 block max-w-md leading-8 text-stone-warm/80">
            نصمّم وننفّذ أعمال الجبس بورد والديكور والدهانات (الرنج) لكل من يرغب في مساحة تعكس ذوقه — بخامات أصلية، وأسعار واضحة، وضمان حقيقي.
          </Editable>
        </div>

        <div className="md:col-span-3">
          <Editable id="footer.shopTitle" as="h3" className="font-display text-xl text-white">تسوّق</Editable>
          <ul className="mt-5 space-y-3 text-stone-warm/80">
            <li><Link className="transition hover:text-brass-light" href="/shop"><T>كل المنتجات</T></Link></li>
            <li><Link className="transition hover:text-brass-light" href="/shop?category=ceilings"><T>أسقف الجبس بورد</T></Link></li>
            <li><Link className="transition hover:text-brass-light" href="/shop?category=walls"><T>ديكور الجدران والتلفزيون</T></Link></li>
            <li><Link className="transition hover:text-brass-light" href="/shop?category=paint"><T>الدهانات والرنج</T></Link></li>
            <li><Link className="transition hover:text-brass-light" href="/shop?category=packages"><T>باقات التشطيب</T></Link></li>
            <li><Link className="transition hover:text-brass-light" href="/gallery"><T>معرض الأعمال</T></Link></li>
            <li><Link className="transition hover:text-brass-light" href="/about"><T>من نحن</T></Link></li>
            <li><Link className="transition hover:text-brass-light" href="/faq"><T>الأسئلة الشائعة</T></Link></li>
            <li><Link className="transition hover:text-brass-light" href="/contact"><T>اتصل بنا</T></Link></li>
            {pages.map((p) => (
              <li key={p.slug}><Link className="transition hover:text-brass-light" href={`/page/${p.slug}`}>{en && p.titleEn ? p.titleEn : p.title}</Link></li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-4">
          <Editable id="footer.contactTitle" as="h3" className="font-display text-xl text-white">تواصل معنا</Editable>
          <ul className="mt-5 space-y-4 text-stone-warm/80">
            <li className="flex items-center gap-3">
              <PhoneIcon width={18} height={18} className="text-brass-light" />
              <a href={`tel:${toTel(site.phone)}`} dir="ltr" className="hover:text-brass-light">
                <Editable id="contact.phone">{site.phone}</Editable>
              </a>
            </li>
            <li className="flex items-center gap-3">
              <WhatsAppIcon width={18} height={18} className="text-brass-light" />
              <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" dir="ltr" className="hover:text-brass-light">
                <Editable id="contact.whatsapp">{site.whatsapp}</Editable>
              </a>
            </li>
            <li className="flex items-center gap-3">
              <PinIcon width={18} height={18} className="text-brass-light" />
              <Editable id="contact.address">{site.address}</Editable>
            </li>
            <li className="flex items-center gap-3">
              <ClockIcon width={18} height={18} className="text-brass-light" />
              <Editable id="footer.hours">يوميًا من ٩ صباحًا حتى ٩ مساءً</Editable>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-stone-warm/60 md:flex-row">
          <span>
            © {new Date().getFullYear().toLocaleString("ar-EG", { useGrouping: false })}{" "}
            <Editable id="footer.copy">رشيد للديكور والجبس بورد. جميع الحقوق محفوظة.</Editable>
          </span>
          <span className="flex items-center gap-4">
            <Editable id="footer.payments">الدفع عند المعاينة · تحويل بنكي · فودافون كاش</Editable>
            <Link href="/admin" className="text-stone-warm/30 transition hover:text-brass-light" rel="nofollow">
              <T>دخول المالك</T>
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
