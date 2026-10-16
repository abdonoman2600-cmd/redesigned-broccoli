import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { bad, readBody, isUnique } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { sanitizePatch } from "@/lib/product-patch";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const a = await auth("products");
  if (a.deny) return a.deny;
  const { set, error } = sanitizePatch(await readBody(req));
  if (error) return bad(error);
  if (!set.name) return bad("اسم المنتج مطلوب");
  if (!set.price) return bad("السعر مطلوب");
  if (!set.categoryId) return bad("اختر القسم");
  if (!set.images?.length) return bad("أضف صورة واحدة على الأقل");
  try {
    const [{ max }] = await db.select({ max: sql<number>`coalesce(max(sort_order),0)::int` }).from(products);
    const [row] = await db
      .insert(products)
      .values({
        shortDescription: set.name,
        description: set.name,
        unit: "م²",
        options: [],
        features: [],
        ...set,
        name: set.name,
        price: set.price,
        categoryId: set.categoryId,
        images: set.images,
        slug: set.slug || `p-${Date.now().toString(36)}`,
        sortOrder: max + 1,
        sales: 0,
        newArrival: set.newArrival ?? true,
      })
      .returning({ id: products.id });
    await logAudit({ user: a.user, action: "create", entity: "product", entityId: row.id, summary: `إضافة منتج: ${set.name}` });
    return Response.json({ ok: true, id: row.id }, { status: 201 });
  } catch (e) {
    if (isUnique(e)) return bad("رابط المنتج (slug) مستخدم بالفعل، غيّره");
    return bad("تعذّر الحفظ", 500);
  }
}

/** Reorder: { ids: number[] } in the desired display order. */
export async function PATCH(req: Request) {
  const a = await auth("products");
  if (a.deny) return a.deny;
  const b = await readBody(req);
  const ids = (Array.isArray(b.ids) ? b.ids : []).map(Number).filter(Number.isInteger) as number[];
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) await tx.update(products).set({ sortOrder: i + 1 }).where(eq(products.id, ids[i]));
  });
  await logAudit({ user: a.user, action: "reorder", entity: "product", summary: "إعادة ترتيب المنتجات" });
  return Response.json({ ok: true });
}
