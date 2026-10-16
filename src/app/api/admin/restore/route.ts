import { notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categories, coupons, customers, drafts, faqs, galleryItems, media, messages, orderItems, orders, pages,
  products, reviews, settings, shippingZones,
} from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { bad, readBody } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { SECRET_KEYS } from "../backup/route";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rows = Record<string, any>[];

const TIMESTAMP_KEYS = ["createdAt", "updatedAt"] as const;

function revive(rows: unknown): Rows {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    const o: Record<string, unknown> = { ...r };
    // Only real timestamp columns are revived. (coupons.expiresAt is plain TEXT: converting it corrupts the value.)
    for (const k of TIMESTAMP_KEYS) {
      if (typeof o[k] === "string") {
        const d = new Date(o[k] as string);
        o[k] = Number.isNaN(d.getTime()) ? new Date() : d;
      }
    }
    return o;
  });
}

async function insertChunks(tx: typeof db, table: never, rows: Rows) {
  for (let i = 0; i < rows.length; i += 200) await tx.insert(table).values(rows.slice(i, i + 200) as never);
}

async function resetSeq(tx: typeof db, table: string) {
  await tx.execute(sql.raw(`select setval(pg_get_serial_sequence('${table}','id'), greatest((select coalesce(max(id),1) from ${table}),1))`));
}

/** Replace the catalogue/content from a backup file. Orders/customers only if includeOrders = true. Owner only. */
export async function POST(req: Request) {
  const a = await auth("owner");
  if (a.deny) return a.deny;
  const b = await readBody(req);
  if (b.confirm !== "RESTORE") return bad("لم يتم التأكيد");
  const d = b.data as Record<string, unknown> | undefined;
  if (!d || (d.meta as { app?: string } | undefined)?.app !== "rashid-store") return bad("ملف النسخة الاحتياطية غير صالح");
  const includeOrders = b.includeOrders === true;
  const hasMedia = Array.isArray(d.media) && (d.media as unknown[]).length > 0;

  try {
    await db.transaction(async (tx) => {
      const t = tx as unknown as typeof db;
      await tx.delete(drafts);
      await tx.delete(reviews);
      await tx.delete(products);
      await tx.delete(categories);
      await tx.delete(galleryItems);
      await tx.delete(coupons);
      await tx.delete(shippingZones);
      await tx.delete(pages);
      await tx.delete(faqs);
      await tx.delete(settings).where(notInArray(settings.key, SECRET_KEYS));
      if (hasMedia) await tx.delete(media);
      if (includeOrders) {
        await tx.delete(orderItems);
        await tx.delete(orders);
        await tx.delete(customers);
        await tx.delete(messages);
      }

      if (hasMedia) {
        const m = revive(d.media).map((r) => ({ ...r, data: Buffer.from(String(r.data), "base64") }));
        await insertChunks(t, media as never, m);
      }
      await insertChunks(t, categories as never, revive(d.categories));
      await insertChunks(t, products as never, revive(d.products));
      await insertChunks(t, reviews as never, revive(d.reviews));
      await insertChunks(t, galleryItems as never, revive(d.galleryItems));
      await insertChunks(t, coupons as never, revive(d.coupons));
      await insertChunks(t, shippingZones as never, revive(d.shippingZones));
      await insertChunks(t, pages as never, revive(d.pages));
      await insertChunks(t, faqs as never, revive(d.faqs));
      await insertChunks(t, settings as never, revive(d.settings).filter((s) => !SECRET_KEYS.includes(String(s.key))));
      await insertChunks(t, drafts as never, revive(d.drafts));
      if (includeOrders) {
        await insertChunks(t, customers as never, revive(d.customers));
        await insertChunks(t, orders as never, revive(d.orders));
        await insertChunks(t, orderItems as never, revive(d.orderItems));
        await insertChunks(t, messages as never, revive(d.messages));
      }
      for (const tb of ["categories", "products", "reviews", "gallery_items", "coupons", "shipping_zones", "pages", "faqs", "drafts"]) await resetSeq(t, tb);
      if (hasMedia) await resetSeq(t, "media");
      if (includeOrders) for (const tb of ["customers", "orders", "order_items", "messages"]) await resetSeq(t, tb);
    });
  } catch (e) {
    return bad(`فشل الاسترجاع، لم يتغير شيء: ${(e as Error).message.slice(0, 160)}`, 500);
  }
  await logAudit({ user: a.user, action: "restore-backup", entity: "backup", summary: `استرجاع نسخة احتياطية${includeOrders ? " (مع الطلبات)" : ""}` });
  return Response.json({ ok: true });
}
