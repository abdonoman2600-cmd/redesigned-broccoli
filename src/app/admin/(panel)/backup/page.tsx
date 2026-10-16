import { notFound } from "next/navigation";
import { pageUser } from "@/lib/admin-auth";
import BackupPanel from "@/components/admin/BackupPanel";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function BackupPage() {
  if (!(await pageUser("owner"))) notFound();
  return (
    <div>
      <PageTitle title="النسخ الاحتياطي والاسترجاع" />
      <BackupPanel />
    </div>
  );
}
