"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/format";
import { buildSelectionMessage, whatsappUrl } from "@/lib/share";
import { useCart } from "./CartProvider";
import { useEdit } from "./EditProvider";
import { useSite } from "./SiteProvider";
import { WhatsAppIcon } from "./Icons";
import T, { useT } from "./T";

/** Footer of the "my list" drawer (prices hidden): send the list to the owner's WhatsApp, copy it, or share it. */
export default function SelectionFooter({ onClose }: { onClose: () => void }) {
  const { items, clear } = useCart();
  const site = useSite();
  const { content } = useEdit();
  const t = useT();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const message = () =>
    buildSelectionMessage({
      items,
      origin: window.location.origin,
      lang: site.lang,
      name,
      notes,
      brand: content["brand.name"] ?? BRAND.name,
    });

  const field =
    "w-full rounded-xl border border-stone-warm bg-white px-4 py-3 text-sm outline-none transition focus:border-brass focus:ring-4 focus:ring-brass/15";

  return (
    <div className="border-t border-stone-warm bg-white px-6 py-5">
      <div className="space-y-3">
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("اسمك (اختياري)")} maxLength={80} autoComplete="name" />
        <textarea className={`${field} min-h-16`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("ملاحظات أو مساحة المكان (اختياري)")} maxLength={500} />
      </div>

      <a
        href={whatsappUrl(site.whatsapp, message())}
        onClick={(e) => {
          // rebuild at click time so the latest name/notes are always included
          e.currentTarget.href = whatsappUrl(site.whatsapp, message());
        }}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-4 text-center font-bold text-white shadow-lg shadow-[#25D366]/25 transition hover:brightness-95"
      >
        <WhatsAppIcon width={22} height={22} />
        <T>إرسال القائمة عبر واتساب</T>
      </a>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold">
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(message());
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {
              /* clipboard blocked */
            }
          }}
          className="rounded-full border border-ink/15 py-3 transition hover:bg-sand"
        >
          <T>{copied ? "تم النسخ ✓" : "نسخ القائمة"}</T>
        </button>
        {canShare ? (
          <button onClick={() => navigator.share({ text: message() }).catch(() => null)} className="rounded-full border border-ink/15 py-3 transition hover:bg-sand">
            <T>مشاركة</T>
          </button>
        ) : (
          <button onClick={onClose} className="rounded-full border border-ink/15 py-3 transition hover:bg-sand">
            <T>متابعة التسوق</T>
          </button>
        )}
      </div>
      <button
        onClick={() => {
          if (confirm(t("تفريغ القائمة") + "؟")) clear();
        }}
        className="mt-3 w-full text-center text-xs text-muted transition hover:text-red-600"
      >
        <T>تفريغ القائمة</T>
      </button>
    </div>
  );
}
