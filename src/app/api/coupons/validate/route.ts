import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { bad, readBody, str } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readBody(req);
  const code = str(b.code, 30).toUpperCase();
  const subtotal = Number(b.subtotal) || 0;
  const [c] = await db.select().from(coupons).where(eq(coupons.code, code));
  const today = new Date().toISOString().slice(0, 10);
  if (!c || !c.active) return bad("كود الخصم غير صالح");
  if (c.expiresAt && c.expiresAt < today) return bad("كود الخصم منتهي");
  if (c.maxUses > 0 && c.used >= c.maxUses) return bad("تم استهلاك كود الخصم");
  if (subtotal < c.minOrder) return bad(`يتطلب الكود طلبًا لا يقل عن ${formatPrice(c.minOrder)}`);
  return Response.json({ ok: true, coupon: { code: c.code, type: c.type, value: c.value, minOrder: c.minOrder } });
}
