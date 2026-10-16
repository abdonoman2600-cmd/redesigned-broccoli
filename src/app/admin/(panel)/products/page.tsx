import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, drafts, products } from "@/db/schema";
import { ensureSeeded } from "@/lib/data";
import ProductsTable from "@/components/admin/ProductsTable";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  await ensureSeeded();
  const [rows, dr] = await Promise.all([
    db
      .select({ p: products, category: categories.name })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(products.sortOrder),
    db.select({ ref: drafts.ref }).from(drafts).where(eq(drafts.scope, "product")),
  ]);
  const withDraft = new Set(dr.map((d) => d.ref));
  return (
    <div>
      <PageTitle title="المنتجات">
        <Link href="/admin/products/new" className="rounded-full bg-brass px-7 py-3.5 font-bold text-white transition hover:bg-brass-dark">+ إضافة منتج</Link>
      </PageTitle>
      <ProductsTable
        rows={rows.map(({ p, category }) => ({
          id: p.id, name: p.name, image: p.images[0], category, price: p.price, unit: p.unit,
          active: p.active, featured: p.featured, available: p.available, stock: p.stock, sku: p.sku,
          draft: withDraft.has(String(p.id)),
        }))}
      />
    </div>
  );
}
