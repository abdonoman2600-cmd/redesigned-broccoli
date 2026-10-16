import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { bad, readBody } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { sanitizePatch } from "@/lib/product-patch";

export const dynamic = "force-dynamic";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  const t = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"' && t[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const bool = (v: string) => ["1", "true", "yes", "نعم"].includes(v.trim().toLowerCase());

/** CSV import: rows are matched by sku, then slug; matched rows are updated, others are created. */
export async function POST(req: Request) {
  const a = await auth("products");
  if (a.deny) return a.deny;
  const csv = String((await readBody(req)).csv ?? "");
  const rows = parseCsv(csv);
  if (rows.length < 2) return bad("الملف فارغ أو بلا صفوف");
  const head = rows[0].map((h) => h.trim());
  const cats = await db.select().from(categories);
  const catBySlug = new Map(cats.map((c) => [c.slug, c.id]));

  let created = 0, updated = 0;
  const errors: string[] = [];
  for (let i = 1; i < rows.length; i++) {
    const rec: Record<string, string> = {};
    head.forEach((h, k) => (rec[h] = (rows[i][k] ?? "").trim()));
    const line = i + 1;
    const raw: Record<string, unknown> = {};
    for (const k of ["sku", "slug", "name", "nameEn", "brand", "unit", "badge", "shortDescription", "description"]) if (k in rec && (rec[k] || k === "nameEn")) raw[k] = rec[k];
    if (rec.price) raw.price = rec.price;
    if ("compareAtPrice" in rec) raw.compareAtPrice = rec.compareAtPrice || null;
    if ("stock" in rec) raw.stock = rec.stock === "" ? null : rec.stock;
    for (const k of ["active", "available", "featured", "newArrival"]) if (rec[k] !== undefined && rec[k] !== "") raw[k] = bool(rec[k]);
    if (rec.images) raw.images = rec.images.split("|").map((s) => s.trim()).filter(Boolean);
    if (rec.category) {
      const id = catBySlug.get(rec.category);
      if (!id) { errors.push(`سطر ${line}: القسم غير موجود (${rec.category})`); continue; }
      raw.categoryId = id;
    }

    let existing = rec.sku ? (await db.select().from(products).where(eq(products.sku, rec.sku)))[0] : undefined;
    if (!existing && rec.slug) existing = (await db.select().from(products).where(eq(products.slug, rec.slug)))[0];

    const { set, error } = sanitizePatch(raw, existing);
    if (error) { errors.push(`سطر ${line}: ${error}`); continue; }
    try {
      if (existing) {
        await db.update(products).set(set).where(eq(products.id, existing.id));
        updated++;
      } else {
        if (!set.name || !set.price || !set.categoryId || !set.images?.length) {
          errors.push(`سطر ${line}: منتج جديد يحتاج: name, price, category, images`);
          continue;
        }
        const [{ max }] = await db.select({ max: sql<number>`coalesce(max(sort_order),0)::int` }).from(products);
        await db.insert(products).values({
          shortDescription: set.name, description: set.name, unit: "م²", options: [], features: [],
          ...set, name: set.name, price: set.price, categoryId: set.categoryId, images: set.images,
          slug: set.slug || `p-${Date.now().toString(36)}-${i}`, sortOrder: max + 1, sales: 0,
        });
        created++;
      }
    } catch {
      errors.push(`سطر ${line}: تعذّر الحفظ (ربما الرابط أو الكود مكرر)`);
    }
  }
  await logAudit({ user: a.user, action: "import", entity: "product", summary: `استيراد منتجات: ${created} جديد، ${updated} محدّث، ${errors.length} خطأ` });
  return Response.json({ ok: true, created, updated, errors: errors.slice(0, 30) });
}
