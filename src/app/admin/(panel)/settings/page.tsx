import { notFound } from "next/navigation";
import { pageUser } from "@/lib/admin-auth";
import { getSettings } from "@/lib/data";
import ContactSettingsForm from "@/components/admin/ContactSettingsForm";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  if (!(await pageUser("settings"))) notFound();
  const s = await getSettings();
  return (
    <div>
      <PageTitle title="الإعدادات وبيانات التواصل" hint="تظهر هذه البيانات في رأس المتجر وتذييله وصفحة اتصل بنا وزر واتساب." />
      <ContactSettingsForm initial={{ phone: s.phone, whatsapp: s.whatsapp, address: s.address, email: s.email, showPrices: s.showPrices }} />
    </div>
  );
}
