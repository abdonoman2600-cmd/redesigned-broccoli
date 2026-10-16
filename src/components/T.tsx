"use client";

import { EN } from "@/lib/i18n";
import { useSite } from "./SiteProvider";

/** Translatable text: <T>نص عربي</T> shows the English dictionary entry when the visitor chose English. */
export default function T({ children }: { children: string }) {
  const { lang } = useSite();
  return <>{lang === "en" ? (EN[children.trim()] ?? children) : children}</>;
}

export function useT() {
  const { lang } = useSite();
  return (s: string) => (lang === "en" ? (EN[s.trim()] ?? s) : s);
}
