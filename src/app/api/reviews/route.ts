import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const productId = Number(body.productId);
  const rating = Number(body.rating);
  const author = String(body.author ?? "").trim().slice(0, 60);
  const city = String(body.city ?? "").trim().slice(0, 60);
  const title = String(body.title ?? "").trim().slice(0, 100);
  const text = String(body.body ?? "").trim().slice(0, 1200);

  if (!Number.isInteger(productId) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: "التقييم غير صالح" }, { status: 400 });
  }
  if (author.length < 2) return Response.json({ error: "من فضلك أدخل اسمك" }, { status: 400 });
  if (text.length < 10) return Response.json({ error: "اكتب تعليقًا لا يقل عن ١٠ أحرف" }, { status: 400 });

  const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId));
  if (!product) return Response.json({ error: "المنتج غير موجود" }, { status: 404 });

  const [row] = await db
    .insert(reviews)
    .values({
      productId,
      rating,
      author,
      city: city || null,
      title: title || (rating >= 4 ? "تجربة رائعة" : "تجربتي مع المنتج"),
      body: text,
      verified: false,
    })
    .returning({ id: reviews.id });

  return Response.json({ ok: true, id: row.id }, { status: 201 });
}
