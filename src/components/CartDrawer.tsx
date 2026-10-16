"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import QtyStepper from "./QtyStepper";
import { BagIcon, CloseIcon, TrashIcon, TruckIcon } from "./Icons";
import { formatNumber, formatPrice, img } from "@/lib/format";
import { useSite } from "./SiteProvider";

import Money from "@/components/Money";
import T from "@/components/T";
import SelectionFooter from "./SelectionFooter";
export default function CartDrawer() {
  const { isOpen, closeCart, items, subtotal, shipping, total, setQuantity, removeItem } = useCart();
  const site = useSite();

  if (!isOpen) return null;

  const sp = site.showPrices;
  const free = sp ? site.shipFreeOver : 0;
  const remaining = Math.max(0, free - subtotal);
  const progress = free > 0 ? Math.min(100, (subtotal / free) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={sp ? "Cart" : "My list"}>
      <div
        className="animate-fade-in absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={closeCart}
      />
      <aside className="animate-drawer-start absolute bottom-0 end-0 top-0 flex w-full max-w-[440px] flex-col bg-ivory shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-warm px-6 py-5">
          <div className="flex items-center gap-3">
            <BagIcon width={22} height={22} className="text-brass" />
            <h2 className="font-display text-2xl font-bold"><T>{sp ? "سلة التسوق" : "قائمة اختياراتي"}</T></h2>
            {items.length > 0 && (
              <span className="rounded-full bg-sand px-2.5 py-0.5 text-sm text-muted">
                {formatNumber(items.length)}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-sand"
            aria-label="إغلاق السلة"
          >
            <CloseIcon />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-sand text-brass">
              <BagIcon width={42} height={42} />
            </div>
            <h3 className="mt-6 font-display text-2xl"><T>{sp ? "سلتك فارغة" : "قائمتك فارغة"}</T></h3>
            <p className="mt-2 text-muted"><T>{sp ? "اكتشف أسقف الجبس والديكورات والدهانات وابدأ مشروعك اليوم." : "اختر التصاميم التي تعجبك وأضفها هنا، ثم أرسل القائمة لنا على واتساب لنعدّ لك عرض سعر."}</T></p>
            <Link
              href="/shop"
              onClick={closeCart}
              className="mt-8 rounded-full bg-ink px-8 py-3.5 font-medium text-white transition hover:bg-brass-dark"
            >
              <T>{sp ? "تصفح المنتجات" : "تصفح التصاميم"}</T>
            </Link>
          </div>
        ) : (
          <>
            {free > 0 && (<div className="border-b border-stone-warm/70 bg-sand/60 px-6 py-4">
              <div className="flex items-center gap-2 text-sm">
                <TruckIcon width={18} height={18} className="text-brass" />
                {remaining > 0 ? (
                  <span>
                    <T>أضف</T> <b className="text-brass-dark"><Money v={remaining} /></b> <T>للحصول على شحن مجاني</T>
                  </span>
                ) : (
                  <span className="font-bold text-brass-dark"><T>مبروك! طلبك مؤهل للشحن المجاني</T></span>
                )}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-warm">
                <div
                  className="h-full rounded-full bg-brass transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>)}

            <ul className="flex-1 divide-y divide-stone-warm/70 overflow-y-auto px-6">
              {items.map((it) => (
                <li key={it.key} className="flex gap-4 py-5">
                  <Link href={`/product/${it.slug}`} onClick={closeCart} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img(it.image, 300)}
                      alt={it.name}
                      className="h-24 w-24 rounded-xl object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${it.slug}`}
                        onClick={closeCart}
                        className="line-clamp-2 text-[15px] font-bold leading-6 hover:text-brass-dark"
                      >
                        {it.name}
                      </Link>
                      <button
                        onClick={() => removeItem(it.key)}
                        className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-sand hover:text-red-600"
                        aria-label="حذف من السلة"
                      >
                        <TrashIcon width={18} height={18} />
                      </button>
                    </div>
                    {(it.optionLabel || it.variant) && <p className="mt-0.5 text-xs text-muted">{[it.optionLabel, it.variant].filter(Boolean).join(" · ")}</p>}
                    {sp && (
                      <p className="mt-0.5 text-xs text-muted">
                        <Money v={it.unitPrice} /> / {it.unit}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center gap-2">
                        <QtyStepper
                          size="sm"
                          value={it.quantity}
                          min={it.minQty}
                          step={it.step}
                          onChange={(v) => setQuantity(it.key, v)}
                        />
                        <span className="text-xs text-muted">{it.unit}</span>
                      </div>
                      {sp && <span className="font-bold"><Money v={it.unitPrice * it.quantity} /></span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {!sp ? (
              <SelectionFooter onClose={closeCart} />
            ) : (
            <div className="border-t border-stone-warm bg-white px-6 py-5">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted"><T>المجموع الفرعي</T></dt>
                  <dd><Money v={subtotal} /></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted"><T>الشحن والتجهيز</T></dt>
                  <dd>{shipping === 0 ? <span className="text-green-700"><T>مجاني</T></span> : formatPrice(shipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-stone-warm pt-3 text-lg font-bold">
                  <dt><T>الإجمالي</T></dt>
                  <dd><Money v={total} /></dd>
                </div>
              </dl>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="mt-5 block rounded-full bg-ink py-4 text-center font-bold text-white transition hover:bg-brass-dark"
              >
                <T>إتمام الطلب</T>
              </Link>
              <button
                onClick={closeCart}
                className="mt-2 w-full py-2 text-center text-sm text-muted transition hover:text-ink"
              >
                <T>متابعة التسوق</T>
              </button>
            </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
