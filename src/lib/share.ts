import type { CartItem } from "@/components/CartProvider";

type Lang = "ar" | "en";

/** Build the plain-text message that the visitor sends to the owner on WhatsApp. */
export function buildSelectionMessage(opts: {
  items: CartItem[];
  origin: string;
  lang: Lang;
  name?: string;
  notes?: string;
  brand: string;
}) {
  const en = opts.lang === "en";
  const lines: string[] = [];
  lines.push(en ? `Hello ${opts.brand} 👋` : `مرحبًا ${opts.brand} 👋`);
  lines.push(en ? "I would like a quote for the following designs:" : "أرغب في الحصول على عرض سعر للتصاميم التالية:");
  lines.push("");
  opts.items.forEach((it, i) => {
    const extra = [it.optionLabel, it.variant].filter(Boolean).join(" | ");
    lines.push(`${i + 1}) ${it.name}`);
    if (extra) lines.push(`   ${extra}`);
    lines.push(`   ${en ? "Quantity / area" : "الكمية / المساحة"}: ${it.quantity} ${it.unit}`);
    lines.push(`   ${opts.origin}/product/${it.slug}`);
    lines.push("");
  });
  if (opts.name?.trim()) lines.push(`${en ? "Name" : "الاسم"}: ${opts.name.trim().slice(0, 80)}`);
  if (opts.notes?.trim()) lines.push(`${en ? "Notes" : "ملاحظات"}: ${opts.notes.trim().slice(0, 500)}`);
  return lines.join("\n").trim();
}

export function whatsappUrl(number: string, text: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
