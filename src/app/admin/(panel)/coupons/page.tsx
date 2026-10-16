import { desc } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { RESOURCES } from "@/lib/resources";
import ResourceManager from "@/components/admin/ResourceManager";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const rows = await db.select().from(coupons).orderBy(desc(coupons.id));
  return (
    <div>
      <PageTitle title="الخصومات والكوبونات" hint="أكواد خصم يدخلها العميل في صفحة الدفع (نسبة أو مبلغ ثابت). خصم المنتج نفسه يُضبط بحقل «السعر قبل الخصم» في المنتج." />
      <ResourceManager
        resource="coupons"
        label="كوبون"
        fields={RESOURCES.coupons.fields}
        rows={rows.map((r) => ({ ...r, summary: `${r.type === "percent" ? `${r.value}٪` : `${r.value} ج.م`} · استُخدم ${r.used} مرة` })) as never}
        titleKey="code"
        subKey="summary"
        defaults={{ type: "percent", value: 10, minOrder: 0, maxUses: 0, active: true, expiresAt: "" }}
      />
    </div>
  );
}
