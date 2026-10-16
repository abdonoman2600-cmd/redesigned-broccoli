export type Zone = { id: number; name: string; regions: string; fee: number; freeOver: number; active: boolean };
export type CouponInfo = { code: string; type: string; value: number; minOrder: number } | null;

const norm = (s: string) => s.trim().toLowerCase();

export function pickZone(zones: Zone[], city: string) {
  const active = zones.filter((z) => z.active);
  const c = norm(city);
  const match = active.find((z) =>
    z.regions
      .split(/[,،]/)
      .map(norm)
      .filter(Boolean)
      .includes(c),
  );
  return match ?? active.find((z) => !z.regions.trim()) ?? null;
}

export function couponDiscount(subtotal: number, coupon: CouponInfo) {
  if (!coupon || subtotal < coupon.minOrder) return 0;
  const d = coupon.type === "percent" ? Math.floor((subtotal * coupon.value) / 100) : coupon.value;
  return Math.max(0, Math.min(d, subtotal));
}

/** Shared by the checkout page (preview) and the orders API (authoritative). */
export function computeTotals(opts: {
  subtotal: number;
  city: string;
  zones: Zone[];
  taxRate: number;
  taxIncluded: boolean;
  coupon: CouponInfo;
}) {
  const { subtotal } = opts;
  const zone = pickZone(opts.zones, opts.city);
  const shipping = subtotal > 0 && zone ? (zone.freeOver > 0 && subtotal >= zone.freeOver ? 0 : zone.fee) : 0;
  const discount = couponDiscount(subtotal, opts.coupon);
  const taxable = subtotal - discount;
  const r = Math.max(0, opts.taxRate) / 100;
  const tax = r > 0 ? Math.round(opts.taxIncluded ? taxable - taxable / (1 + r) : taxable * r) : 0;
  const total = subtotal - discount + shipping + (opts.taxIncluded ? 0 : tax);
  return { zone, shipping, discount, tax, taxIncluded: opts.taxIncluded, total };
}
