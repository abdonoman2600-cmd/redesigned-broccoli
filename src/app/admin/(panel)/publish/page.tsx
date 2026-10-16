import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { drafts, products } from "@/db/schema";
import { resolveOrigin } from "@/lib/origin";
import { getPreviewToken } from "@/lib/mode";
import { pageUser } from "@/lib/admin-auth";
import PublishPanel from "@/components/admin/PublishPanel";
import { PageTitle } from "@/components/admin/ui";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PublishPage() {
  if (!(await pageUser("content")) && !(await pageUser("products"))) notFound();
  const rows = await db.select().from(drafts).orderBy(desc(drafts.updatedAt));
  const names = new Map((await db.select({ id: products.id, name: products.name }).from(products)).map((p) => [String(p.id), p.name]));
  void eq;
  const token = await getPreviewToken();
  const h = await headers();
  const base = resolveOrigin(h.get("x-forwarded-host") ?? h.get("host"), h.get("x-forwarded-proto"));
  const items = rows.map((r) => ({
    id: r.id,
    scope: r.scope,
    title: r.scope === "product" ? `منتج: ${names.get(r.ref) ?? r.ref}` : `نص/صورة في الصفحة: ${r.ref}`,
    detail:
      r.scope === "product"
        ? Object.entries(r.data).map(([k, v]) => `${k}: ${typeof v === "object" ? "…" : String(v).slice(0, 60)}`).join(" · ")
        : String((r.data as { value?: string }).value || "(استعادة الافتراضي)").slice(0, 160),
    by: r.updatedBy,
    at: r.updatedAt.toISOString(),
  }));
  return (
    <div>
      <PageTitle title="نشر التغييرات والمعاينة" hint="التعديلات التي تجريها من داخل المتجر تُحفظ كمسودة ولا يراها الزوار إلا بعد النشر." />
      <PublishPanel items={items} previewUrl={token ? `${base}/preview/${token}` : null} />
    </div>
  );
}
