import { db } from "@/db";
import { categories } from "@/db/schema";
import { ensureSeeded } from "@/lib/data";
import { RESOURCES } from "@/lib/resources";
import ResourceManager from "@/components/admin/ResourceManager";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await ensureSeeded();
  const rows = await db.select().from(categories).orderBy(categories.sortOrder);
  const res = RESOURCES.categories;
  return (
    <div>
      <PageTitle title="التصنيفات" hint="أضف تصنيفات المنتجات ورتّبها وغيّر صورها وأسماءها (عربي/English). لا يمكن حذف تصنيف يحتوي على منتجات." />
      <ResourceManager resource="categories" label="تصنيف" fields={res.fields} rows={rows as never} titleKey="name" subKey="description" reorder defaults={{ active: true }} />
    </div>
  );
}
