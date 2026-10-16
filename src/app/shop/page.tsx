import type { Metadata } from "next";
import { getCategories, getProducts } from "@/lib/data";
import Editable from "@/components/Editable";
import ShopClient from "@/components/ShopClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "المتجر",
  description: "تسوّق أسقف الجبس بورد وديكورات الجدران والدهانات وباقات التشطيب الكاملة من رشيد.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string; offers?: string }>;
}) {
  const sp = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <>
      <section className="relative overflow-hidden bg-sand">
        <div className="pattern-dots absolute inset-0 opacity-70" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center md:py-20">
          <Editable id="shop.eyebrow" as="p" className="animate-fade-up text-sm font-bold tracking-wider text-brass-dark">المتجر</Editable>
          <Editable id="shop.title" as="h1" className="animate-fade-up delay-1 mt-3 block text-4xl font-bold md:text-6xl">كل ما تحتاجه لمساحة أجمل</Editable>
          <Editable id="shop.text" as="p" multiline className="animate-fade-up delay-2 mx-auto mt-4 block max-w-xl leading-8 text-muted">أسقف وجدران ودهانات وباقات تشطيب. اختر ما يعجبك وأرسل قائمتك إلينا.</Editable>
        </div>
      </section>
      <ShopClient
        products={products}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        initialCategory={sp.category ?? null}
        initialQuery={sp.q ?? ""}
        initialSort={sp.sort ?? null}
        initialOnSale={sp.offers === "1"}
      />
    </>
  );
}
