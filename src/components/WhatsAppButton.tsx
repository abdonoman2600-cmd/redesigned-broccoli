"use client";

import { useSite } from "./SiteProvider";
import { WhatsAppIcon } from "./Icons";

export default function WhatsAppButton() {
  const site = useSite();
  const text = encodeURIComponent("مرحبًا رشيد، أرغب في الاستفسار عن أعمال الديكور والجبس بورد.");
  return (
    <a
      href={`https://wa.me/${site.whatsapp}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا عبر واتساب"
      className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(37,211,102,0.45)] transition hover:scale-110"
    >
      <WhatsAppIcon width={28} height={28} />
    </a>
  );
}
