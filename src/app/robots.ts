import type { MetadataRoute } from "next";
import { currentOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await currentOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/checkout", "/order", "/preview"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
