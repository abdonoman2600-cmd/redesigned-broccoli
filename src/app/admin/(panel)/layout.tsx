import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { can, ensureOwner, getUser } from "@/lib/admin-auth";
import AdminNav, { type NavGroup } from "@/components/admin/AdminNav";
import { PasswordChangeForm } from "@/components/admin/AuthForms";
import { card } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const GROUPS: { title: string; links: { href: string; label: string; perm?: string }[] }[] = [
  { title: "عام", links: [{ href: "/admin", label: "الرئيسية" }, { href: "/admin/publish", label: "نشر التغييرات والمعاينة", perm: "content" }, { href: "/admin/reports", label: "التقارير", perm: "reports" }] },
  {
    title: "المنتجات",
    links: [
      { href: "/admin/products", label: "المنتجات", perm: "products" },
      { href: "/admin/categories", label: "التصنيفات", perm: "products" },
      { href: "/admin/inventory", label: "المخزون والأسعار", perm: "products" },
      { href: "/admin/coupons", label: "الخصومات والكوبونات", perm: "discounts" },
    ],
  },
  {
    title: "المبيعات",
    links: [
      { href: "/admin/orders", label: "الطلبات", perm: "orders" },
      { href: "/admin/customers", label: "العملاء", perm: "customers" },
      { href: "/admin/messages", label: "الرسائل", perm: "orders" },
      { href: "/admin/commerce", label: "الشحن والدفع والضرائب", perm: "discounts" },
    ],
  },
  {
    title: "المحتوى",
    links: [
      { href: "/admin/pages", label: "الصفحات (من نحن/اتصل بنا)", perm: "content" },
      { href: "/admin/faqs", label: "الأسئلة الشائعة", perm: "content" },
      { href: "/admin/gallery", label: "معرض الأعمال", perm: "content" },
      { href: "/admin/media", label: "الصور والملفات", perm: "content" },
      { href: "/admin/qr", label: "رموز QR", perm: "content" },
    ],
  },
  {
    title: "المتجر",
    links: [
      { href: "/admin/branding", label: "الشعار والألوان والقوائم", perm: "settings" },
      { href: "/admin/settings", label: "الإعدادات وبيانات التواصل", perm: "settings" },
    ],
  },
  {
    title: "الإدارة",
    links: [
      { href: "/admin/staff", label: "الموظفون والصلاحيات", perm: "owner" },
      { href: "/admin/activity", label: "سجل التغييرات", perm: "owner" },
      { href: "/admin/backup", label: "النسخ الاحتياطي", perm: "owner" },
      { href: "/admin/account", label: "حسابي وكلمة المرور" },
    ],
  },
];

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await ensureOwner();
  const user = await getUser();
  if (!user) redirect("/admin/login");

  if (user.mustChangePassword) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <div className={card}>
          <h1 className="mb-5 text-2xl font-bold">تغيير كلمة المرور</h1>
          <PasswordChangeForm forced />
        </div>
      </div>
    );
  }

  const groups: NavGroup[] = GROUPS.map((g) => ({
    title: g.title,
    links: g.links.filter((l) => !l.perm || can(user, l.perm)),
  })).filter((g) => g.links.length);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(notifications).where(eq(notifications.read, false));

  return (
    <>
      <AdminNav groups={groups} userName={user.name} unread={n} />
      <div className="lg:ms-64 print:ms-0">
        <div className="mx-auto max-w-5xl px-5 py-10 lg:px-8">{children}</div>
      </div>
    </>
  );
}
