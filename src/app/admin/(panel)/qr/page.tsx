import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { products } from "@/db/schema";
import { currentOrigin } from "@/lib/origin";
import { pageUser } from "@/lib/admin-auth";
import { ensureSeeded, getSettings } from "@/lib/data";
import { getPreviewToken } from "@/lib/mode";
import QrStudio, { type QrLink } from "@/components/QrStudio";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminQr() {
  if (!(await pageUser("content"))) notFound();
  await ensureSeeded();
  const [h, site, token, prods] = await Promise.all([
    headers(),
    getSettings(),
    getPreviewToken(),
    db.select({ slug: products.slug, name: products.name }).from(products).where(eq(products.active, true)).orderBy(products.sortOrder),
  ]);
  const origin = await currentOrigin();

  const links: QrLink[] = [
    { id: "store", title: "المتجر (الرئيسية)", target: "/", note: "للكروت والمعارض والواجهة. آمن للنشر." },
    { id: "shop", title: "كل التصاميم", target: "/shop" },
    { id: "gallery", title: "معرض الأعمال", target: "/gallery" },
    { id: "contact", title: "اتصل بنا", target: "/contact" },
    { id: "whatsapp", title: "محادثة واتساب معك", target: `https://wa.me/${site.whatsapp.replace(/\D/g, "")}`, note: "يفتح محادثة مباشرة برقمك المسجّل في الإعدادات." },
    { id: "owner-login", title: "دخول المالك", target: "/admin/login", note: "لتفتح اللوحة من هاتفك بسرعة. الصفحة نفسها محمية بكلمة مرور، لكن لا تنشره للجمهور." , secret: true },
    ...(token
      ? [{ id: "preview", title: "معاينة قبل النشر (للعرض فقط)", target: `/preview/${token}`, note: "يرى به من تعطيه الرابط مسودة المتجر دون أي تعديل.", secret: true } as QrLink]
      : []),
    ...prods.map((p) => ({ id: `p-${p.slug}`, title: p.name, target: `/product/${p.slug}`, note: "صفحة هذا التصميم (مناسب لطباعته بجانب العمل)." })),
  ];

  return (
    <div>
      <PageTitle title="رموز QR" hint="رموز QR لروابط متجرك، جاهزة للتنزيل والطباعة، وتتحدث تلقائيًا عند تغيير العنوان." />
      <QrStudio origin={origin} links={links} warnTemporary={/e2b\.app|localhost|127\.0\.0\.1/.test(origin)} />
    </div>
  );
}
