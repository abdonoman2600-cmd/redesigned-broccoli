"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { BagIcon, CloseIcon, MenuIcon, PhoneIcon } from "./Icons";
import { BRAND, formatNumber, toTel } from "@/lib/format";
import { useSite } from "./SiteProvider";
import Editable from "./Editable";
import T from "./T";

export default function Header() {
  const pathname = usePathname();
  const site = useSite();
  const { count, openCart, hydrated } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [bump, setBump] = useState(false);

  const en = site.lang === "en";
  const links = site.nav.filter((n) => n.visible).map((n) => ({ href: n.href, label: en && n.labelEn ? n.labelEn : n.label }));
  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !menu;
  const otherLang = en ? "ar" : "en";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (!hydrated || count === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [count, hydrated]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  const langHref = `/api/lang?l=${otherLang}&next=${encodeURIComponent(pathname)}`;

  return (
    <>
      <div className="hidden bg-ink text-xs text-stone-warm md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
          <Editable id="header.topbar">{site.showPrices ? "معاينة وتصميم مجاني · ضمان حتى ٥ سنوات · شحن مجاني للطلبات فوق ١٥٬٠٠٠ ج.م" : "معاينة وتصميم مجاني · ضمان حتى ٥ سنوات · عرض سعر خلال ٢٤ ساعة"}</Editable>
          <div className="flex items-center gap-5">
            <a href={langHref} className="font-bold transition hover:text-brass-light" hrefLang={otherLang}>
              {en ? "عربي" : "English"}
            </a>
            <a href={`tel:${toTel(site.phone)}`} className="flex items-center gap-2 transition hover:text-brass-light">
              <PhoneIcon width={14} height={14} />
              <span dir="ltr">{site.phone}</span>
            </a>
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 transition-all duration-500 ${
          transparent ? "bg-transparent text-white" : "bg-ivory/90 text-ink shadow-[0_1px_0_rgba(27,26,23,0.08)] backdrop-blur-xl"
        } ${isHome ? "-mb-[72px] md:-mb-[76px]" : ""}`}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 md:h-[76px] md:px-6">
          <Link href="/" className="group flex items-center gap-3" aria-label={BRAND.name}>
            {site.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.logo} alt={BRAND.name} className="h-11 w-auto max-w-[120px] rounded-md object-contain" />
            ) : (
              <span
                className={`grid h-11 w-11 place-items-center rounded-full border font-display text-2xl font-bold transition-colors ${
                  transparent ? "border-white/60 text-white" : "border-brass bg-brass text-white group-hover:bg-brass-dark"
                }`}
              >
                {en ? "R" : "ر"}
              </span>
            )}
            <span className="leading-tight">
              <Editable id="brand.name" className="block font-display text-2xl font-bold tracking-wide">{BRAND.name}</Editable>
              <Editable id="brand.tagline" className={`block text-[11px] ${transparent ? "text-white/75" : "text-muted"}`}>{BRAND.tagline}</Editable>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="main">
            {links.map((l) => {
              const active = !l.href.includes("?") && l.href === pathname;
              return (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  className={`relative whitespace-nowrap py-1 text-[15px] font-medium transition after:absolute after:-bottom-0.5 after:start-0 after:h-px after:bg-current after:transition-all after:duration-300 ${
                    active ? "after:w-full" : "after:w-0 hover:after:w-full"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <a
              href={langHref}
              hrefLang={otherLang}
              className={`rounded-full px-3 py-2 text-sm font-bold transition md:hidden ${transparent ? "hover:bg-white/15" : "hover:bg-sand"}`}
            >
              {en ? "ع" : "EN"}
            </a>
            <button
              onClick={openCart}
              className={`relative flex h-11 items-center justify-center gap-2 rounded-full transition ${site.showPrices ? "w-11" : "w-11 md:w-auto md:px-4"} ${transparent ? "hover:bg-white/15" : "hover:bg-sand"}`}
              aria-label={`cart${hydrated ? ` - ${count}` : ""}`}
            >
              <BagIcon width={24} height={24} />
              {!site.showPrices && <span className="hidden text-sm font-bold md:inline"><T>قائمتي</T></span>}
              {hydrated && count > 0 && (
                <span className={`absolute -end-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brass px-1 text-[11px] font-bold text-white ${bump ? "animate-pop" : ""}`}>
                  {formatNumber(count)}
                </span>
              )}
            </button>
            <button
              className={`grid h-11 w-11 place-items-center rounded-full transition lg:hidden ${transparent ? "hover:bg-white/15" : "hover:bg-sand"}`}
              onClick={() => setMenu((m) => !m)}
              aria-label="menu"
              aria-expanded={menu}
            >
              {menu ? <CloseIcon width={24} height={24} /> : <MenuIcon width={24} height={24} />}
            </button>
          </div>
        </div>
      </header>

      {menu && (
        <div className="animate-fade-in fixed inset-0 z-30 overflow-y-auto bg-ivory pt-[100px] text-ink md:pt-[130px] lg:hidden">
          <nav className="mx-auto flex max-w-xl flex-col px-6 py-6">
            {links.map((l, i) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className="animate-fade-up border-b border-stone-warm/70 py-4 font-display text-2xl"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {l.label}
              </Link>
            ))}
            <a href={`tel:${toTel(site.phone)}`} className="mt-8 flex items-center justify-center gap-2 rounded-full bg-ink py-4 text-white">
              <PhoneIcon width={18} height={18} />
              <span dir="ltr">{site.phone}</span>
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
