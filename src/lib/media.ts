import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, drafts, galleryItems, media, pages, products, settings } from "@/db/schema";

/**
 * Images are never deleted automatically anymore (so "restore previous version" can always bring an old image back).
 * The owner cleans unused images from the media library instead.
 */
export async function deleteMediaIfUnused(_url: string) {
  void _url;
}

export async function mediaUsageCount(url: string) {
  const like = `%${url}%`;
  const one = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
  const counts = await Promise.all([
    one(db.select({ n: sql<number>`count(*)::int` }).from(products).where(sql`${products.images}::text like ${like}`)),
    one(db.select({ n: sql<number>`count(*)::int` }).from(categories).where(eq(categories.image, url))),
    one(db.select({ n: sql<number>`count(*)::int` }).from(settings).where(sql`${settings.value} like ${like} and ${settings.key} <> 'previewToken'`)),
    one(db.select({ n: sql<number>`count(*)::int` }).from(galleryItems).where(eq(galleryItems.image, url))),
    one(db.select({ n: sql<number>`count(*)::int` }).from(drafts).where(sql`${drafts.data}::text like ${like}`)),
    one(db.select({ n: sql<number>`count(*)::int` }).from(pages).where(sql`${pages.body} like ${like} or ${pages.bodyEn} like ${like}`)),
  ]);
  return counts.reduce((a, b) => a + b, 0);
}

export async function deleteMedia(id: number) {
  await db.delete(media).where(eq(media.id, id));
}
