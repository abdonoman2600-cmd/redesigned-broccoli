import type { CartItem } from "@/components/CartProvider";
import { cartKey } from "@/components/CartProvider";
import type { ProductDTO } from "./types";

export function buildCartItem(p: ProductDTO, optionIndex = 0, quantity?: number, color?: string | null, size?: string | null): CartItem {
  const opt = p.options[optionIndex] ?? null;
  const variant = [color && `اللون: ${color}`, size && `المقاس: ${size}`].filter(Boolean).join(" · ") || null;
  return {
    key: cartKey(p.id, opt?.label ?? null, `${color ?? ""}|${size ?? ""}`),
    productId: p.id,
    slug: p.slug,
    name: p.name,
    image: p.images[0],
    unit: p.unit,
    unitPrice: p.price + (opt?.priceDelta ?? 0),
    optionLabel: opt?.label ?? null,
    variant,
    color: color ?? null,
    size: size ?? null,
    quantity: quantity ?? p.minQty,
    minQty: p.minQty,
    step: p.step,
  };
}
