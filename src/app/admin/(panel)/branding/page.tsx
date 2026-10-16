import { notFound } from "next/navigation";
import { pageUser } from "@/lib/admin-auth";
import { DEFAULT_NAV, getSettings, getSettingsMap, getThemeFromMap } from "@/lib/data";
import BrandingForm from "@/components/admin/BrandingForm";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  if (!(await pageUser("settings"))) notFound();
  const [site, map] = await Promise.all([getSettings(), getSettingsMap()]);
  const theme = await getThemeFromMap(map);
  return (
    <div>
      <PageTitle title="الشعار والألوان والقوائم" hint="غيّر هوية المتجر. تُنشر التعديلات فورًا وتُسجَّل في سجل التغييرات." />
      <BrandingForm
        logo={site.logo}
        theme={theme}
        nav={site.nav.length ? site.nav : DEFAULT_NAV}
        brandName={map.get("c:brand.name") ?? "رشيد"}
        brandTagline={map.get("c:brand.tagline") ?? "للديكور والجبس بورد"}
      />
    </div>
  );
}
