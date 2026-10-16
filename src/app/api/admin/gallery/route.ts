import { sql } from "drizzle-orm";
import { db } from "@/db";
import { galleryItems } from "@/db/schema";
import { guard } from "@/lib/admin-auth";
import { ensureGallerySeeded } from "@/lib/data";

export const dynamic = "force-dynamic";

const validImg = (v: string) => v.startsWith("/api/media/") || /^https?:\/\//.test(v);

/** Create one or many gallery items: { items: [{ image, title?, category? }] } */
export async function POST(req: Request) {
  const denied = await guard("content");
  if (denied) return denied;
  await ensureGallerySeeded();
  const body = await req.json().catch(() => ({}));
  const incoming = (Array.isArray(body.items) ? body.items : []) as Record<string, unknown>[];
  const rows = incoming
    .map((i) => ({
      image: String(i.image ?? ""),
      title: String(i.title ?? "").trim().slice(0, 120) || "عمل جديد",
      description: String(i.description ?? "").trim().slice(0, 400),
      category: String(i.category ?? "").trim().slice(0, 40),
    }))
    .filter((r) => validImg(r.image))
    .slice(0, 20);
  if (rows.length === 0) return Response.json({ error: "لا توجد صور صالحة" }, { status: 400 });

  // new items go first
  await db.update(galleryItems).set({ sortOrder: sql`${galleryItems.sortOrder} + ${rows.length}` });
  const created = await db
    .insert(galleryItems)
    .values(rows.map((r, i) => ({ ...r, sortOrder: i })))
    .returning({ id: galleryItems.id });
  return Response.json({ ok: true, ids: created.map((c) => c.id) }, { status: 201 });
}

/** Reorder: { ids: number[] } in the desired order */
export async function PATCH(req: Request) {
  const denied = await guard("content");
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const ids = (Array.isArray(body.ids) ? body.ids : []).map(Number).filter(Number.isInteger) as number[];
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx.update(galleryItems).set({ sortOrder: i }).where(sql`${galleryItems.id} = ${ids[i]}`);
    }
  });
  return Response.json({ ok: true });
}
