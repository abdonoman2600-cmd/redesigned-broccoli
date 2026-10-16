import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeeded } from "@/lib/data";
import InventoryTable from "@/components/admin/InventoryTable";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  await ensureSeeded();
  const rows = await db.select().from(products).orderBy(products.sortOrder);
  return (
    <div>
      <PageTitle title="المخزون والأسعار" hint="عدّل السعر وسعر الخصم والكمية والتوفر لعدة منتجات من مكان واحد." />
      <InventoryTable rows={rows.map((p) => ({ id: p.id, name: p.name, image: p.images[0], sku: p.sku, price: p.price, compareAtPrice: p.compareAtPrice, stock: p.stock, available: p.available }))} />
    </div>
  );
}
