import { db } from "@/db";
import { media } from "@/db/schema";
import { guard } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const MAX = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "لم يتم اختيار ملف" }, { status: 400 });
  if (!file.type.startsWith("image/")) return Response.json({ error: "الملف ليس صورة" }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "حجم الصورة أكبر من ٨ ميجا" }, { status: 400 });

  const data = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(media)
    .values({ filename: file.name.slice(0, 120), contentType: file.type, data })
    .returning({ id: media.id });

  return Response.json({ url: `/api/media/${row.id}` }, { status: 201 });
}
