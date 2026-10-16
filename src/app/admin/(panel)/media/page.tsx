import { desc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { media } from "@/db/schema";
import { pageUser } from "@/lib/admin-auth";
import { mediaUsageCount } from "@/lib/media";
import MediaLibrary from "@/components/admin/MediaLibrary";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  if (!(await pageUser("content"))) notFound();
  const rows = await db
    .select({ id: media.id, filename: media.filename, createdAt: media.createdAt, size: sql<number>`length(${media.data})` })
    .from(media)
    .orderBy(desc(media.id))
    .limit(300);
  const withUse = await Promise.all(rows.map(async (r) => ({ ...r, createdAt: r.createdAt.toISOString(), used: await mediaUsageCount(`/api/media/${r.id}`) })));
  return (
    <div>
      <PageTitle title="الصور والملفات" hint="كل الصور التي رفعتها. يمكنك رفع صور جديدة، ونسخ رابطها، وحذف غير المستخدم منها لتوفير المساحة." />
      <MediaLibrary rows={withUse} />
    </div>
  );
}
