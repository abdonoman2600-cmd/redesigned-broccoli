import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { formatDate } from "@/lib/format";
import MarkRead from "@/components/admin/MarkRead";
import { card, PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const rows = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(100);
  return (
    <div>
      <PageTitle title="الإشعارات" hint="تصلك هنا إشعارات الطلبات والرسائل الجديدة. لتصلك على واتساب/تيليجرام أضف NOTIFY_WEBHOOK_URL في الاستضافة.">
        <MarkRead />
      </PageTitle>
      <ul className="space-y-3">
        {rows.map((n) => (
          <li key={n.id} className={`${card} !p-4 ${n.read ? "opacity-70" : "ring-2 ring-brass/50"}`}>
            <Link href={n.link || "/admin"} className="block">
              <b>{n.title}</b>
              <p className="text-sm text-muted">{n.body}</p>
              <p className="mt-1 text-xs text-muted">{formatDate(n.createdAt)}</p>
            </Link>
          </li>
        ))}
        {rows.length === 0 && <li className="rounded-3xl bg-sand p-12 text-center text-muted">لا توجد إشعارات.</li>}
      </ul>
    </div>
  );
}
