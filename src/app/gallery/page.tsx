import type { Metadata } from "next";
import Link from "next/link";
import { getGallery, getSettings } from "@/lib/data";
import { isAdmin } from "@/lib/admin-auth";
import Editable from "@/components/Editable";
import GalleryClient from "@/components/GalleryClient";

import T from "@/components/T";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "معرض الأعمال",
  description: "شاهد صور أعمال رشيد في الجبس بورد والديكور والدهانات — أسقف، جدران، فواصل وتشطيبات كاملة.",
};

export default async function GalleryPage() {
  const admin = await isAdmin();
  const [items, site] = await Promise.all([getGallery({ includeHidden: admin }), getSettings()]);
  return (
    <>
      <section className="relative overflow-hidden bg-sand">
        <div className="pattern-dots absolute inset-0 opacity-70" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center md:py-20">
          <Editable id="gallery.eyebrow" as="p" className="animate-fade-up text-sm font-bold tracking-wider text-brass-dark">معرض الأعمال</Editable>
          <Editable id="gallery.title" as="h1" className="animate-fade-up delay-1 mt-3 block text-4xl font-bold md:text-6xl">أعمال نفخر بها</Editable>
          <Editable id="gallery.text" as="p" multiline className="animate-fade-up delay-2 mx-auto mt-4 block max-w-xl leading-8 text-muted">لمحة من مشاريعنا المنفّذة. تصفّح الصور واختر ما يلهمك لمساحتك.</Editable>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <GalleryClient items={items} />

        <div className="mt-16 rounded-3xl bg-ink p-10 text-center text-white md:p-14">
          <Editable id="gallery.cta.title" as="h2" className="block text-3xl font-bold md:text-4xl">أعجبك عمل؟ نصمّم لك مثله وأفضل</Editable>
          <p className="mx-auto mt-3 max-w-lg text-white/70"><T>احجز معاينة مجانية وسنرسل لك عرض سعر خلال ٢٤ ساعة.</T></p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="rounded-full bg-brass px-8 py-3.5 font-bold transition hover:bg-brass-light">
              <T>تصفح المتجر</T>
            </Link>
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/40 px-8 py-3.5 font-bold transition hover:bg-white hover:text-ink"
            >
              <T>تواصل عبر واتساب</T>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
