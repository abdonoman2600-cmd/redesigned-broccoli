import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/admin-auth";
import { bad, readBody, isUnique } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { coerce, RESOURCES } from "@/lib/resources";

export const dynamic = "force-dynamic";

const RESERVED_PAGES = ["admin", "api", "shop", "product", "checkout", "order", "gallery", "preview", "faq"];

export async function POST(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const res = RESOURCES[(await params).resource];
  if (!res) return bad("غير موجود", 404);
  const a = await auth(res.perm);
  if (a.deny) return a.deny;
  const body = await readBody(req);

  if (body.action === "reorder" && res.orderKey) {
    const ids = (Array.isArray(body.ids) ? body.ids : []).map(Number).filter(Number.isInteger) as number[];
    await db.transaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) await tx.update(res.table).set({ [res.orderKey!]: i }).where(eq(res.table.id, ids[i]));
    });
    return Response.json({ ok: true });
  }

  const { value, error } = coerce(res, body, false);
  if (!value) return bad(error ?? "بيانات غير صالحة");
  if (res.name === "pages" && RESERVED_PAGES.includes(String(value.slug))) return bad("هذا الرابط محجوز، اختر رابطًا آخر");
  try {
    if (res.orderKey) {
      const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${res.table[res.orderKey]}),0)::int` }).from(res.table);
      value[res.orderKey] = max + 1;
    }
    const [row] = await db.insert(res.table).values(value).returning({ id: res.table.id });
    await logAudit({ user: a.user, action: "create", entity: `r:${res.name}`, entityId: row.id, summary: `إضافة ${res.label}` });
    return Response.json({ ok: true, id: row.id }, { status: 201 });
  } catch (e) {
    if (isUnique(e)) return bad("القيمة مستخدمة بالفعل (الرابط أو الكود)، اختر قيمة أخرى");
    return bad("تعذّر الحفظ", 500);
  }
}
