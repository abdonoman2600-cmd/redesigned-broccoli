"use client";

import { formatNumber } from "@/lib/format";
import { useSite } from "./SiteProvider";

export default function Money({ v }: { v: number }) {
  const { lang } = useSite();
  return <>{`${formatNumber(Math.round(v))} ${lang === "en" ? "EGP" : "ج.م"}`}</>;
}
