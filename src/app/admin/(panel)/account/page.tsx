import { getUser } from "@/lib/admin-auth";
import { PasswordChangeForm } from "@/components/admin/AuthForms";
import { card, PageTitle } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = (await getUser())!;
  return (
    <div>
      <PageTitle title="حسابي" />
      <section className={`${card} mb-6`}>
        <p><b>{user.name}</b> <span className="text-muted" dir="ltr">· {user.email}</span></p>
        <p className="mt-1 text-sm text-muted">{user.role === "owner" ? "مالك المتجر" : "موظف"}</p>
      </section>
      <section className={`${card} max-w-lg`}>
        <h2 className="mb-5 font-display text-2xl font-bold">تغيير كلمة المرور</h2>
        <PasswordChangeForm />
        <p className="mt-4 text-xs text-muted">عند التغيير يتم تسجيل خروجك من كل الأجهزة الأخرى.</p>
      </section>
    </div>
  );
}
