import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { pageUser } from "@/lib/admin-auth";
import MessagesList from "@/components/admin/MessagesList";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  if (!(await pageUser("orders"))) notFound();
  const rows = await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(200);
  return (
    <div>
      <PageTitle title="رسائل العملاء" hint="الرسائل القادمة من نموذج صفحة «اتصل بنا»." />
      <MessagesList rows={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />
    </div>
  );
}
