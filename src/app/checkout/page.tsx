import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shippingZones } from "@/db/schema";
import { redirect } from "next/navigation";
import CheckoutClient from "@/components/CheckoutClient";
import { getPayments, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إتمام الطلب" };

export default async function CheckoutPage() {
  const [payments, site, zones] = await Promise.all([
    getPayments(),
    getSettings(),
    db.select().from(shippingZones).where(eq(shippingZones.active, true)).orderBy(shippingZones.sortOrder),
  ]);
  if (!site.showPrices) redirect("/shop"); // catalog mode: visitors send their list on WhatsApp instead
  return (
    <CheckoutClient
      payments={payments.filter((p) => p.enabled)}
      zones={zones}
      taxRate={site.taxRate}
      taxIncluded={site.taxIncluded}
    />
  );
}
