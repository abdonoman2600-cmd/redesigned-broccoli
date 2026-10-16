import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { pageUser } from "@/lib/admin-auth";
import ActivityList from "@/components/admin/ActivityList";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  if (!(await pageUser("owner"))) notFound();
  const rows = await db.select().from(auditLog).orderBy(desc(auditLog.id)).limit(200);
  return (
    <div>
      <PageTitle title="سجل التغييرات" hint="كل ما تغيّر في المتجر: من فعله ومتى. التعديلات المميّزة بزر «استعادة» يمكن إرجاعها لقيمتها السابقة." />
      <ActivityList rows={rows.map((r) => ({ id: r.id, userName: r.userName, action: r.action, summary: r.summary, restorable: r.restorable, restoredAt: r.restoredAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString() }))} />
    </div>
  );
}
