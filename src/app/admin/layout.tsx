import type { Metadata } from "next";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "لوحة التحكم", robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-ivory">{children}</div>;
}
