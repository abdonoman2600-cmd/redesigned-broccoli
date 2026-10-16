import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import ProductForm from "@/components/admin/ProductForm";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [p] = await db.select().from(products).where(eq(products.id, id));
  if (!p) notFound();
  const cats = await db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.sortOrder);
  return (
    <div>
      <PageTitle title="تعديل المنتج" hint="يُنشر الحفظ فورًا ويُسجَّل في سجل التغييرات (مع إمكانية الاستعادة)." />
      <ProductForm
        categories={cats}
        initial={{
          id: p.id, slug: p.slug, name: p.name, nameEn: p.nameEn, shortDescription: p.shortDescription,
          shortDescriptionEn: p.shortDescriptionEn, description: p.description, descriptionEn: p.descriptionEn,
          categoryId: p.categoryId, price: p.price, compareAtPrice: p.compareAtPrice, unit: p.unit, minQty: p.minQty,
          step: p.step, images: p.images, options: p.options, optionsLabel: p.optionsLabel, features: p.features,
          colors: p.colors, sizes: p.sizes, badge: p.badge, featured: p.featured, active: p.active,
          available: p.available, newArrival: p.newArrival, leadTime: p.leadTime, sku: p.sku, brand: p.brand, stock: p.stock,
        }}
      />
    </div>
  );
}
