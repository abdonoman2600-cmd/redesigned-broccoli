import "server-only";
import { categories, coupons, faqs, pages, products, shippingZones } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";

export type FieldType = "text" | "textarea" | "number" | "bool" | "image" | "select";
export type Field = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  max?: number;
  min?: number;
  options?: { value: string; label: string }[];
  mode?: "slug" | "upper";
  hint?: string;
  dir?: "ltr";
  wide?: boolean;
};

export type Resource = {
  name: string;
  perm: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any;
  orderKey?: string;
  fields: Field[];
  guardDelete?: (id: number) => Promise<string | null>;
};

export const RESOURCES: Record<string, Resource> = {
  categories: {
    name: "categories",
    perm: "products",
    label: "قسم",
    table: categories,
    orderKey: "sortOrder",
    fields: [
      { key: "image", label: "صورة القسم", type: "image" },
      { key: "name", label: "الاسم (عربي)", type: "text", required: true, max: 80 },
      { key: "nameEn", label: "الاسم (English)", type: "text", max: 80, dir: "ltr" },
      { key: "description", label: "الوصف (عربي)", type: "text", max: 200, wide: true },
      { key: "descriptionEn", label: "الوصف (English)", type: "text", max: 200, dir: "ltr", wide: true },
      { key: "slug", label: "رابط القسم (إنجليزي)", type: "text", required: true, max: 60, mode: "slug", dir: "ltr", hint: "يظهر في الرابط /shop?category=..." },
      { key: "active", label: "ظاهر في المتجر", type: "bool" },
    ],
    guardDelete: async (id) => {
      const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(products).where(eq(products.categoryId, id));
      return r.n > 0 ? "لا يمكن حذف قسم يحتوي على منتجات. انقل المنتجات أو أخفِ القسم بدلًا من ذلك." : null;
    },
  },
  coupons: {
    name: "coupons",
    perm: "discounts",
    label: "كوبون",
    table: coupons,
    fields: [
      { key: "code", label: "كود الخصم", type: "text", required: true, max: 30, mode: "upper", dir: "ltr" },
      { key: "type", label: "نوع الخصم", type: "select", options: [{ value: "percent", label: "نسبة مئوية ٪" }, { value: "fixed", label: "مبلغ ثابت" }] },
      { key: "value", label: "القيمة", type: "number", min: 1, required: true },
      { key: "minOrder", label: "أقل قيمة للطلب", type: "number", min: 0 },
      { key: "maxUses", label: "عدد مرات الاستخدام (0 = بلا حد)", type: "number", min: 0 },
      { key: "expiresAt", label: "ينتهي في (YYYY-MM-DD)", type: "text", max: 10, dir: "ltr", hint: "اتركه فارغًا لعدم الانتهاء" },
      { key: "active", label: "مفعّل", type: "bool" },
    ],
  },
  shipping_zones: {
    name: "shipping_zones",
    perm: "discounts",
    label: "منطقة شحن",
    table: shippingZones,
    orderKey: "sortOrder",
    fields: [
      { key: "name", label: "اسم المنطقة", type: "text", required: true, max: 80 },
      { key: "regions", label: "المدن / المحافظات (بفاصلة)", type: "textarea", max: 600, wide: true, hint: "اتركه فارغًا لتكون المنطقة الافتراضية لباقي البلاد" },
      { key: "fee", label: "تكلفة الشحن", type: "number", min: 0, required: true },
      { key: "freeOver", label: "شحن مجاني فوق (0 = لا يوجد)", type: "number", min: 0 },
      { key: "active", label: "مفعّلة", type: "bool" },
    ],
  },
  faqs: {
    name: "faqs",
    perm: "content",
    label: "سؤال",
    table: faqs,
    orderKey: "sortOrder",
    fields: [
      { key: "question", label: "السؤال (عربي)", type: "text", required: true, max: 200, wide: true },
      { key: "answer", label: "الإجابة (عربي)", type: "textarea", max: 1500, wide: true },
      { key: "questionEn", label: "Question (English)", type: "text", max: 200, dir: "ltr", wide: true },
      { key: "answerEn", label: "Answer (English)", type: "textarea", max: 1500, dir: "ltr", wide: true },
      { key: "active", label: "ظاهر", type: "bool" },
    ],
  },
  pages: {
    name: "pages",
    perm: "content",
    label: "صفحة",
    table: pages,
    orderKey: "sortOrder",
    fields: [
      { key: "title", label: "العنوان (عربي)", type: "text", required: true, max: 120 },
      { key: "titleEn", label: "Title (English)", type: "text", max: 120, dir: "ltr" },
      { key: "body", label: "المحتوى (عربي)", type: "textarea", max: 20000, wide: true, hint: "اترك سطرًا فارغًا بين الفقرات" },
      { key: "bodyEn", label: "Content (English)", type: "textarea", max: 20000, dir: "ltr", wide: true },
      { key: "slug", label: "رابط الصفحة (إنجليزي)", type: "text", required: true, max: 60, mode: "slug", dir: "ltr", hint: "about / contact محجوزتان للصفحتين الأساسيتين" },
      { key: "published", label: "منشورة", type: "bool" },
    ],
  },
};

/** Coerce + validate a body against a resource definition. Only known keys are accepted. */
export function coerce(res: Resource, body: Record<string, unknown>, partial: boolean) {
  const out: Record<string, unknown> = {};
  for (const f of res.fields) {
    if (!(f.key in body)) {
      if (!partial && f.required) return { error: `الحقل مطلوب: ${f.label}` };
      if (!partial && f.type !== "image") out[f.key] = f.type === "bool" ? false : f.type === "number" ? (f.min ?? 0) : f.type === "select" ? (f.options?.[0]?.value ?? "") : "";
      continue;
    }
    const raw = body[f.key];
    if (f.type === "bool") out[f.key] = Boolean(raw);
    else if (f.type === "number") {
      const n = Math.round(Number(raw));
      if (!Number.isFinite(n) || n < (f.min ?? 0)) return { error: `قيمة غير صحيحة: ${f.label}` };
      out[f.key] = n;
    } else if (f.type === "select") {
      const v = String(raw);
      if (!f.options?.some((o) => o.value === v)) return { error: `اختيار غير صحيح: ${f.label}` };
      out[f.key] = v;
    } else if (f.type === "image") {
      const v = String(raw);
      if (!(v.startsWith("/api/media/") || /^https?:\/\//.test(v))) return { error: "رابط الصورة غير صالح" };
      out[f.key] = v;
    } else {
      let v = String(raw ?? "").trim().slice(0, f.max ?? 500);
      if (f.mode === "slug") v = v.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
      if (f.mode === "upper") v = v.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
      if (f.required && !v) return { error: `الحقل مطلوب: ${f.label}` };
      out[f.key] = v;
    }
  }
  return { value: out };
}
