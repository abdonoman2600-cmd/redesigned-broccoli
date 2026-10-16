import { db } from "@/db";
import { pages } from "@/db/schema";
import { ensureSeeded } from "@/lib/data";
import { RESOURCES } from "@/lib/resources";
import ResourceManager from "@/components/admin/ResourceManager";
import { Notice, PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function PagesAdmin() {
  await ensureSeeded();
  const rows = await db.select().from(pages).orderBy(pages.sortOrder);
  return (
    <div>
      <PageTitle title="الصفحات" hint="من نحن (/about) واتصل بنا (/contact) وأي صفحة إضافية (تظهر في /page/اسم-الصفحة وفي تذييل المتجر)." />
      <div className="mb-6"><Notice kind="info">الأسئلة الشائعة تُدار من صفحة «الأسئلة الشائعة». أرقام التواصل تُدار من «الإعدادات وبيانات التواصل».</Notice></div>
      <ResourceManager resource="pages" label="صفحة" fields={RESOURCES.pages.fields} rows={rows as never} titleKey="title" subKey="slug" reorder defaults={{ published: true }} protect={{ key: "slug", values: ["about", "contact"] }} />
    </div>
  );
}
