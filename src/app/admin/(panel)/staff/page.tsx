import { notFound } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { PERMISSIONS, pageUser } from "@/lib/admin-auth";
import StaffManager from "@/components/admin/StaffManager";
import { PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const me = await pageUser("owner");
  if (!me) notFound();
  const rows = await db.select().from(users).orderBy(users.id);
  return (
    <div>
      <PageTitle title="الموظفون والصلاحيات" hint="أضف موظفين بصلاحيات محددة. تُتحقق الصلاحيات على الخادم في كل طلب." />
      <StaffManager
        meId={me.id}
        perms={PERMISSIONS}
        rows={rows.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, permissions: u.permissions, active: u.active, lastLoginAt: u.lastLoginAt?.toISOString() ?? null }))}
      />
    </div>
  );
}
