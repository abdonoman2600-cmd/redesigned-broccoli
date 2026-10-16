import { db } from "@/db";
import { categories } from "@/db/schema";
import { ensureSeeded } from "@/lib/data";
import ProductForm from "@/components/admin/ProductForm";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  await ensureSeeded();
  const cats = await db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.sortOrder);
  return (
    <div>
      <PageTitle title="منتج جديد" />
      <ProductForm
        categories={cats}
        initial={{
          slug: "", name: "", nameEn: "", shortDescription: "", shortDescriptionEn: "", description: "", descriptionEn: "",
          categoryId: cats[0]?.id ?? 0, price: 0, compareAtPrice: null, unit: "م²", minQty: 1, step: 1, images: [],
          options: [], optionsLabel: "مستوى التشطيب", features: [], colors: [], sizes: [], badge: null,
          featured: false, active: true, available: true, newArrival: true, leadTime: "خلال ٣ - ٧ أيام عمل",
          sku: "", brand: "", stock: null,
        }}
      />
    </div>
  );
}
