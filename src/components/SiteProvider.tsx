"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteSettings } from "@/lib/types";
import { BRAND } from "@/lib/format";

const SiteContext = createContext<SiteSettings>({
  phone: BRAND.phone,
  whatsapp: BRAND.whatsapp,
  address: BRAND.address,
  email: BRAND.email,
  heroImage: "",
  heroTitle: "",
  heroHighlight: "",
  heroText: "",
  logo: "",
  nav: [],
  shipFee: 250,
  shipFreeOver: 15000,
  taxRate: 0,
  taxIncluded: true,
  showPrices: false,
  lang: "ar",
});

export function SiteProvider({ value, children }: { value: SiteSettings; children: ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
