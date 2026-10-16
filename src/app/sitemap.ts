import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pages, products } from "@/db/schema";
import { currentOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = ["", "/shop", "/gallery", "/about", "/contact", "/faq"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await currentOrigin();
  const [productRows, pageRows] = await Promise.all([
    db.select({ slug: products.slug }).from(products).where(eq(products.active, true)),
    db.select({ slug: pages.slug }).from(pages).where(eq(pages.published, true)),
  ]);

  return [
    ...STATIC_ROUTES.map((path) => ({
      url: `${origin}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...productRows.map((p) => ({
      url: `${origin}/product/${encodeURIComponent(p.slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...pageRows.map((p) => ({
      url: `${origin}/page/${encodeURIComponent(p.slug)}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
