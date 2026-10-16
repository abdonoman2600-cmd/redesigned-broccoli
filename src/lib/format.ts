export const CURRENCY = "ج.م";
export const FREE_SHIPPING_THRESHOLD = 15000;
export const SHIPPING_FEE = 250;

export const BRAND = {
  name: "رشيد",
  tagline: "للديكور والجبس بورد",
  phone: "٠١٠٠٠٠٠٠٠٠٠",
  phoneIntl: "+201000000000",
  whatsapp: "201000000000",
  email: "hello@rashid-decor.com",
  address: "القاهرة - مصر",
};

const nf = new Intl.NumberFormat("en-US");

export function formatNumber(n: number) {
  return nf.format(n);
}

export function formatPrice(n: number) {
  return `${nf.format(Math.round(n))} ${CURRENCY}`;
}

export function formatDate(d: string | number | Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(d));
}

/** Resize a pexels url by swapping width param. */
export function img(url: string, w = 800) {
  if (url.includes("pexels.com")) {
    return url.replace(/([?&])w=\d+/, `$1w=${w}`);
  }
  return url;
}

export function calcShipping(subtotal: number, fee = SHIPPING_FEE, freeOver = FREE_SHIPPING_THRESHOLD) {
  if (subtotal <= 0) return 0;
  return freeOver > 0 && subtotal >= freeOver ? 0 : fee;
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
/** Convert any phone string (Arabic digits allowed) to a tel: friendly string. */
export function toTel(phone: string) {
  return phone
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[^\d+]/g, "");
}
