import type { Metadata } from "next";
import { headers } from "next/headers";
import { currentOrigin } from "@/lib/origin";
import { getSettings } from "@/lib/data";
import QrStudio, { type QrLink } from "@/components/QrStudio";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "رموز QR", robots: { index: false, follow: false } };

/** Public page: only public store links + a paste-any-link box that works fully in the browser. */
export default async function PublicQr() {
  const [h, site] = await Promise.all([headers(), getSettings()]);
  const origin = await currentOrigin();
  const links: QrLink[] = [
    { id: "store", title: "المتجر", target: "/" },
    { id: "shop", title: "كل التصاميم", target: "/shop" },
    { id: "gallery", title: "معرض الأعمال", target: "/gallery" },
    { id: "whatsapp", title: "محادثة واتساب", target: `https://wa.me/${site.whatsapp.replace(/\D/g, "")}` },
  ];
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-4xl font-bold">رموز QR</h1>
      <p className="mb-8 mt-2 text-muted">امسح الرمز بكاميرا هاتفك لفتح الرابط. يمكنك أيضًا تحويل أي رابط إلى رمز.</p>
      <QrStudio origin={origin} links={links} warnTemporary={false} />
    </div>
  );
}
