import { db } from "@/db";
import {
  categories, coupons, customers, drafts, faqs, galleryItems, media, messages, orderItems, orders, pages,
  products, reviews, settings, shippingZones,
} from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const SECRET_KEYS = ["sessionSecret", "adminPass", "previewToken"];

/** Full data export (owner only). ?media=1 includes uploaded images (base64). Users/passwords are never exported. */
export async function GET(req: Request) {
  const a = await auth("owner");
  if (a.deny) return a.deny;
  const withMedia = new URL(req.url).searchParams.get("media") === "1";
  const all = await db.select().from(settings);
  const data = {
    meta: { app: "rashid-store", version: 2, createdAt: new Date().toISOString(), withMedia },
    categories: await db.select().from(categories),
    products: await db.select().from(products),
    reviews: await db.select().from(reviews),
    galleryItems: await db.select().from(galleryItems),
    settings: all.filter((s) => !SECRET_KEYS.includes(s.key)),
    coupons: await db.select().from(coupons),
    shippingZones: await db.select().from(shippingZones),
    pages: await db.select().from(pages),
    faqs: await db.select().from(faqs),
    drafts: await db.select().from(drafts),
    customers: await db.select().from(customers),
    orders: await db.select().from(orders),
    orderItems: await db.select().from(orderItems),
    messages: await db.select().from(messages),
    media: withMedia
      ? (await db.select().from(media)).map((m) => ({ ...m, data: Buffer.from(m.data).toString("base64") }))
      : [],
  };
  await logAudit({ user: a.user, action: "backup", entity: "backup", summary: `تنزيل نسخة احتياطية${withMedia ? " (مع الصور)" : ""}` });
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="rashid-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
