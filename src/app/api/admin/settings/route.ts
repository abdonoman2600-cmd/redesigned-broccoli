import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { drafts } from "@/db/schema";
import { auth } from "@/lib/admin-auth";
import { bad, digits, readBody, str, validImg } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { getSetting, putSetting } from "@/lib/settings-store";
import { sanitizeTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

const href = (v: string) => v.startsWith("/") || /^https?:\/\//.test(v);

/** Store-wide settings (contact info, logo, theme, menus, payments, tax). Published immediately, logged & restorable. */
export async function PUT(req: Request) {
  const a = await auth("settings");
  if (a.deny) return a.deny;
  const b = await readBody(req);
  const changes: { key: string; value: string | null; label: string }[] = [];
  const add = (key: string, value: string | null, label: string) => changes.push({ key, value, label });

  if (typeof b.phone === "string") add("phone", str(b.phone, 40), "رقم الهاتف");
  if (typeof b.whatsapp === "string") add("whatsapp", digits(b.whatsapp).replace(/\D/g, "").slice(0, 20), "رقم الواتساب");
  if (typeof b.address === "string") add("address", str(b.address, 200), "العنوان");
  if (typeof b.email === "string") add("email", str(b.email, 120), "البريد الإلكتروني");
  if (typeof b.logo === "string") {
    if (b.logo && !validImg(b.logo)) return bad("رابط الشعار غير صالح");
    add("logo", b.logo, "الشعار");
  }
  if (b.theme && typeof b.theme === "object") add("theme", JSON.stringify(sanitizeTheme(b.theme as never)), "الألوان والخط");
  if (Array.isArray(b.nav)) {
    const nav = (b.nav as Record<string, unknown>[])
      .map((n) => ({ label: str(n.label, 40), labelEn: str(n.labelEn, 40), href: str(n.href, 200), visible: n.visible !== false }))
      .filter((n) => n.label && href(n.href))
      .slice(0, 12);
    if (nav.length === 0) return bad("أضف رابطًا واحدًا على الأقل في القائمة");
    add("nav", JSON.stringify(nav), "قائمة التنقل");
  }
  if (Array.isArray(b.payments)) {
    const allowed = ["cash", "transfer", "wallet"];
    const pay = (b.payments as Record<string, unknown>[])
      .filter((p) => allowed.includes(String(p.id)))
      .map((p) => ({ id: String(p.id), label: str(p.label, 80), description: str(p.description, 400), enabled: p.enabled !== false }));
    if (!pay.some((p) => p.enabled)) return bad("فعّل طريقة دفع واحدة على الأقل");
    add("payments", JSON.stringify(pay), "وسائل الدفع");
  }
  if (b.taxRate !== undefined) {
    const r = Number(b.taxRate);
    if (!(r >= 0 && r <= 100)) return bad("نسبة الضريبة يجب أن تكون بين ٠ و ١٠٠");
    add("taxRate", String(r), "نسبة الضريبة");
  }
  if (typeof b.showPrices === "boolean") add("showPrices", b.showPrices ? "1" : "0", "إظهار الأسعار في المتجر");
  if (typeof b.taxIncluded === "boolean") add("taxIncluded", b.taxIncluded ? "1" : "0", "الضريبة شاملة للسعر");
  if (typeof b.brandName === "string") add("c:brand.name", str(b.brandName, 60), "اسم المتجر");
  if (typeof b.brandTagline === "string") add("c:brand.tagline", str(b.brandTagline, 80), "وصف الشعار");

  for (const c of changes) {
    const before = await getSetting(c.key);
    if ((before ?? "") === (c.value ?? "")) continue;
    await putSetting(c.key, c.value);
    if (c.key.startsWith("c:")) await db.delete(drafts).where(and(eq(drafts.scope, "content"), eq(drafts.ref, c.key.slice(2))));
    await logAudit({
      user: a.user, action: "update", entity: "setting", entityId: c.key, summary: `تعديل الإعداد: ${c.label}`,
      before: { key: c.key, value: before }, after: { key: c.key, value: c.value }, restorable: true,
    });
  }
  return Response.json({ ok: true });
}
