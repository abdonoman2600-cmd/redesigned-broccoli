import { db } from "@/db";
import { shippingZones } from "@/db/schema";
import { ensureSeeded, getPayments, getSettings } from "@/lib/data";
import { RESOURCES } from "@/lib/resources";
import ResourceManager from "@/components/admin/ResourceManager";
import PaymentsTaxForm from "@/components/admin/PaymentsTaxForm";
import { Notice, PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function CommercePage() {
  await ensureSeeded();
  const [zones, payments, site] = await Promise.all([db.select().from(shippingZones).orderBy(shippingZones.sortOrder), getPayments(), getSettings()]);
  return (
    <div className="space-y-10">
      <PageTitle title="الشحن والدفع والضرائب" />
      <section>
        <h2 className="mb-2 font-display text-2xl font-bold">مناطق الشحن</h2>
        <p className="mb-5 text-sm text-muted">أضف منطقة لكل مجموعة مدن/محافظات بتكلفة خاصة. المنطقة التي بلا مدن تُطبَّق على باقي البلاد. يُحسب الشحن تلقائيًا في صفحة الدفع حسب المدينة التي يكتبها العميل.</p>
        <ResourceManager resource="shipping_zones" label="منطقة شحن" fields={RESOURCES.shipping_zones.fields} rows={zones as never} titleKey="name" subKey="regions" reorder defaults={{ fee: 0, freeOver: 0, active: true, regions: "" }} />
      </section>
      <PaymentsTaxForm payments={payments} taxRate={site.taxRate} taxIncluded={site.taxIncluded} />
      <Notice kind="warn">
        <b>بوابة الدفع الإلكتروني (بطاقات):</b> غير مربوطة، لأنها تحتاج حسابًا لدى مزوّد (مثل Paymob أو Fawry أو Stripe) ومفاتيح سرية تُضاف في إعدادات الاستضافة، ثم تحقق من نجاح الدفع على الخادم قبل تأكيد الطلب. لن نعرض «الدفع بالبطاقة» للعملاء قبل ذلك. الطرق المتاحة الآن: الدفع عند التسليم، التحويل البنكي، المحافظ/إنستاباي (تأكيد يدوي منك).
      </Notice>
    </div>
  );
}
