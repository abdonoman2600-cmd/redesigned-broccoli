import type { Metadata, Viewport } from "next";
import { Cairo, El_Messiri, Tajawal } from "next/font/google";
import type { ReactNode } from "react";
import { eq, sql } from "drizzle-orm";
import "./globals.css";
import { db } from "@/db";
import { drafts, pages } from "@/db/schema";
import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { SiteProvider } from "@/components/SiteProvider";
import HideOnAdmin from "@/components/HideOnAdmin";
import { EditProvider } from "@/components/EditProvider";
import AdminBar from "@/components/AdminBar";
import { ensureSeeded, getContent, getSettings, getSettingsMap, getThemeFromMap } from "@/lib/data";
import { can } from "@/lib/admin-auth";
import { getView } from "@/lib/mode";
import { themeCss } from "@/lib/theme";

export const dynamic = "force-dynamic";

const display = El_Messiri({ subsets: ["arabic", "latin"], variable: "--font-display", weight: ["400", "500", "600", "700"], display: "swap" });
const body = Tajawal({ subsets: ["arabic", "latin"], variable: "--font-body", weight: ["300", "400", "500", "700", "800"], display: "swap" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", weight: ["400", "500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "رشيد | ديكور وجبس بورد ورنج - متجر التشطيبات الراقية",
    template: "%s | رشيد للديكور والجبس بورد",
  },
  description:
    "متجر رشيد لأعمال الديكور والجبس بورد والدهانات (الرنج): أسقف معلقة، وحدات تلفزيون، فواصل، وباقات تشطيب كاملة بضمان وتنفيذ احترافي.",
  openGraph: {
    title: "رشيد | ديكور وجبس بورد ورنج",
    description: "أسقف جبس بورد، ديكورات جدران، دهانات وباقات تشطيب كاملة.",
    locale: "ar_EG",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#faf6ef", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  await ensureSeeded();
  const [site, content, view, settingsMap, pageList] = await Promise.all([
    getSettings(),
    getContent(),
    getView(),
    getSettingsMap(),
    db.select({ slug: pages.slug, title: pages.title, titleEn: pages.titleEn }).from(pages).where(eq(pages.published, true)).orderBy(pages.sortOrder),
  ]);
  const theme = await getThemeFromMap(settingsMap);
  const css = themeCss(theme);
  const lang = site.lang;

  const isEditor = !!view.user && (can(view.user, "content") || can(view.user, "products"));
  let draftCount = 0;
  if (isEditor) {
    const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(drafts);
    draftCount = r.n;
  }

  return (
    <html
      lang={lang}
      dir={lang === "en" ? "ltr" : "rtl"}
      className={`${display.variable} ${body.variable} ${theme.font === "cairo" ? cairo.variable : ""}`}
    >
      <head>{css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}</head>
      <body className="min-h-screen bg-ivory text-ink antialiased">
        <SiteProvider value={site}>
          <EditProvider
            user={isEditor && view.user ? { name: view.user.name } : null}
            mode={view.mode}
            viewerPreview={view.viewerPreview}
            draftCount={draftCount}
            content={content}
          >
            <CartProvider>
              <HideOnAdmin>
                <Header />
              </HideOnAdmin>
              <main>{children}</main>
              <HideOnAdmin>
                <Footer site={site} pages={pageList.filter((p) => !["about", "contact"].includes(p.slug))} />
                <CartDrawer />
                <WhatsAppButton />
                <AdminBar />
              </HideOnAdmin>
            </CartProvider>
          </EditProvider>
        </SiteProvider>
      </body>
    </html>
  );
}
