import { eq, inArray, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { coupons, customers, orderItems, orders, products, shippingZones } from "@/db/schema";
import { bad, digits, readBody, str } from "@/lib/api";
import { notifyOwner } from "@/lib/audit";
import { getPayments, getSettings } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { computeTotals } from "@/lib/totals";

export const dynamic = "force-dynamic";

type IncomingItem = { productId: number; optionLabel: string | null; quantity: number; color?: string | null; size?: string | null };

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 3600_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 12;
}

class OrderError extends Error {}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (limited(ip)) return bad("طلبات كثيرة، حاول لاحقًا", 429);
  const b = await readBody(req);

  const customerName = str(b.customerName, 80);
  const phone = digits(str(b.phone, 20)).replace(/[\s-]/g, "");
  const email = str(b.email, 120);
  const city = str(b.city, 60);
  const address = str(b.address, 300);
  const preferredDate = str(b.preferredDate, 40);
  const notes = str(b.notes, 600);
  const paymentMethod = str(b.paymentMethod, 20);
  const couponCode = str(b.couponCode, 30).toUpperCase();
  const rawItems = Array.isArray(b.items) ? (b.items as IncomingItem[]) : [];

  const payments = (await getPayments()).filter((p) => p.enabled);
  const errors: Record<string, string> = {};
  if (customerName.length < 3) errors.customerName = "من فضلك أدخل الاسم بالكامل";
  if (!/^\+?[0-9]{8,15}$/.test(phone)) errors.phone = "رقم الهاتف غير صحيح";
  if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.email = "البريد الإلكتروني غير صحيح";
  if (city.length < 2) errors.city = "أدخل المدينة";
  if (address.length < 6) errors.address = "أدخل العنوان بالتفصيل";
  if (!payments.some((p) => p.id === paymentMethod)) errors.paymentMethod = "اختر طريقة الدفع";
  if (rawItems.length === 0) errors.items = "السلة فارغة";
  if (Object.keys(errors).length) return Response.json({ error: "تحقق من البيانات المدخلة", errors }, { status: 400 });

  const ids = [...new Set(rawItems.map((i) => Number(i.productId)).filter(Number.isInteger))];
  const rows = ids.length ? await db.select().from(products).where(inArray(products.id, ids)) : [];
  const byId = new Map(rows.map((p) => [p.id, p]));

  const lines: { productId: number; name: string; optionLabel: string | null; variant: string | null; unit: string; unitPrice: number; quantity: number; image: string }[] = [];
  for (const it of rawItems) {
    const p = byId.get(Number(it.productId));
    if (!p || !p.active) return bad("أحد المنتجات لم يعد متاحًا");
    if (!p.available || (p.stock !== null && p.stock <= 0)) return bad(`المنتج غير متاح حاليًا: ${p.name}`);
    const qty = Math.floor(Number(it.quantity));
    if (!Number.isFinite(qty) || qty < 1 || qty > 100000) return bad("كمية غير صالحة");
    const opt = it.optionLabel ? p.options.find((o) => o.label === it.optionLabel) : undefined;
    if (it.optionLabel && !opt) return bad("خيار المنتج غير متاح");
    const color = it.color ? p.colors.find((c) => c.name === it.color) : undefined;
    if (it.color && !color) return bad("اللون غير متاح");
    if (!color && p.colors.length) return bad(`اختر اللون: ${p.name}`);
    const size = it.size ? p.sizes.find((s) => s === it.size) : undefined;
    if (it.size && !size) return bad("المقاس غير متاح");
    if (!size && p.sizes.length) return bad(`اختر المقاس: ${p.name}`);
    const quantity = Math.max(qty, p.minQty);
    if (p.stock !== null && quantity > p.stock) return bad(`الكمية المتوفرة من "${p.name}" هي ${p.stock} فقط`);
    lines.push({
      productId: p.id,
      name: p.name,
      optionLabel: opt?.label ?? null,
      variant: [color && `اللون: ${color.name}`, size && `المقاس: ${size}`].filter(Boolean).join(" · ") || null,
      unit: p.unit,
      unitPrice: p.price + (opt?.priceDelta ?? 0),
      quantity,
      image: p.images[0],
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const [site, zones] = await Promise.all([getSettings(), db.select().from(shippingZones).where(eq(shippingZones.active, true))]);

  let coupon: typeof coupons.$inferSelect | null = null;
  if (couponCode) {
    const [c] = await db.select().from(coupons).where(eq(coupons.code, couponCode));
    const today = new Date().toISOString().slice(0, 10);
    if (!c || !c.active) return bad("كود الخصم غير صالح");
    if (c.expiresAt && c.expiresAt < today) return bad("كود الخصم منتهي");
    if (c.maxUses > 0 && c.used >= c.maxUses) return bad("تم استهلاك كود الخصم");
    if (subtotal < c.minOrder) return bad(`كود الخصم يتطلب طلبًا لا يقل عن ${formatPrice(c.minOrder)}`);
    coupon = c;
  }

  const t = computeTotals({
    subtotal,
    city,
    zones,
    taxRate: site.taxRate,
    taxIncluded: site.taxIncluded,
    coupon: coupon && { code: coupon.code, type: coupon.type, value: coupon.value, minOrder: coupon.minOrder },
  });
  const orderNumber = `RD-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  const accessToken = randomBytes(16).toString("hex");

  try {
    const order = await db.transaction(async (tx) => {
      if (coupon) {
        const ok = await tx
          .update(coupons)
          .set({ used: sql`${coupons.used} + 1` })
          .where(sql`${coupons.id} = ${coupon.id} and (${coupons.maxUses} = 0 or ${coupons.used} < ${coupons.maxUses})`)
          .returning({ id: coupons.id });
        if (!ok.length) throw new OrderError("تم استهلاك كود الخصم");
      }
      for (const l of lines) {
        // atomic stock decrement: only products with tracked stock are touched
        const [p] = await tx.select({ stock: products.stock }).from(products).where(eq(products.id, l.productId));
        if (p && p.stock !== null) {
          const ok = await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${l.quantity}` })
            .where(sql`${products.id} = ${l.productId} and ${products.stock} >= ${l.quantity}`)
            .returning({ id: products.id });
          if (!ok.length) throw new OrderError(`الكمية المتوفرة من "${l.name}" لم تعد كافية`);
        }
      }
      const [cust] = await tx
        .insert(customers)
        .values({ name: customerName, phone, email: email || null, city, address, ordersCount: 1, totalSpent: t.total })
        .onConflictDoUpdate({
          target: customers.phone,
          set: {
            name: customerName,
            city,
            address,
            email: email ? email : sql`${customers.email}`,
            ordersCount: sql`${customers.ordersCount} + 1`,
            totalSpent: sql`${customers.totalSpent} + ${t.total}`,
          },
        })
        .returning({ id: customers.id });
      const [o] = await tx
        .insert(orders)
        .values({
          orderNumber,
          accessToken,
          customerName,
          phone,
          email: email || null,
          city,
          address,
          preferredDate: preferredDate || null,
          notes: notes || null,
          paymentMethod,
          subtotal,
          shipping: t.shipping,
          discount: t.discount,
          tax: t.tax,
          total: t.total,
          couponCode: coupon?.code ?? null,
          customerId: cust.id,
        })
        .returning({ id: orders.id });
      await tx.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: o.id })));
      return o;
    });
    void order;
  } catch (e) {
    if (e instanceof OrderError) return bad(e.message);
    return bad("تعذّر إتمام الطلب، حاول مرة أخرى", 500);
  }

  await notifyOwner({
    type: "order",
    title: `طلب جديد ${orderNumber}`,
    body: `${customerName} · ${phone} · ${formatPrice(t.total)}`,
    link: "/admin/orders",
  });
  return Response.json({ ok: true, orderNumber, token: accessToken }, { status: 201 });
}
