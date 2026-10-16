import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/data";
import { getPage } from "@/lib/pages";
import { toTel } from "@/lib/format";
import PageShell, { Prose } from "@/components/PageShell";
import ContactForm from "@/components/ContactForm";
import Editable from "@/components/Editable";
import { ClockIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "اتصل بنا" };

export default async function ContactPage() {
  const [page, site] = await Promise.all([getPage("contact"), getSettings()]);
  if (!page) notFound();
  return (
    <PageShell title={page.title}>
      <Prose text={page.body} />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        <li className="flex items-center gap-4 rounded-2xl bg-sand p-5">
          <PhoneIcon className="text-brass" />
          <a href={`tel:${toTel(site.phone)}`} dir="ltr" className="font-bold">{site.phone}</a>
        </li>
        <li className="flex items-center gap-4 rounded-2xl bg-sand p-5">
          <WhatsAppIcon className="text-brass" />
          <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" dir="ltr" className="font-bold">{site.whatsapp}</a>
        </li>
        <li className="flex items-center gap-4 rounded-2xl bg-sand p-5"><PinIcon className="text-brass" />{site.address}</li>
        <li className="flex items-center gap-4 rounded-2xl bg-sand p-5">
          <ClockIcon className="text-brass" />
          <Editable id="footer.hours">يوميًا من ٩ صباحًا حتى ٩ مساءً</Editable>
        </li>
      </ul>
      <div className="mt-10"><ContactForm /></div>
    </PageShell>
  );
}
