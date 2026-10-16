import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { auth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const CSV_COLUMNS = [
  "sku", "slug", "name", "nameEn", "category", "brand", "price", "compareAtPrice", "unit", "stock",
  "active", "available", "featured", "newArrival", "badge", "shortDescription", "description", "images",
];

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  const a = await auth("products");
  if (a.deny) return a.deny;
  const rows = await db
    .select({ p: products, cat: categories.slug })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(products.sortOrder);
  const lines = [CSV_COLUMNS.join(",")];
  for (const { p, cat } of rows) {
    const rec: Record<string, unknown> = { ...p, category: cat, images: p.images.join("|") };
    lines.push(CSV_COLUMNS.map((c) => cell(rec[c])).join(","));
  }
  return new Response("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
