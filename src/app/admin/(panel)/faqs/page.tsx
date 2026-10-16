import { db } from "@/db";
import { faqs } from "@/db/schema";
import { ensureSeeded } from "@/lib/data";
import { RESOURCES } from "@/lib/resources";
import ResourceManager from "@/components/admin/ResourceManager";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function FaqsAdmin() {
  await ensureSeeded();
  const rows = await db.select().from(faqs).orderBy(faqs.sortOrder);
  return (
    <div>
      <PageTitle title="الأسئلة الشائعة" hint="تظهر في صفحة /faq بالعربية والإنجليزية." />
      <ResourceManager resource="faqs" label="سؤال" fields={RESOURCES.faqs.fields} rows={rows as never} titleKey="question" subKey="answer" reorder defaults={{ active: true }} />
    </div>
  );
}
