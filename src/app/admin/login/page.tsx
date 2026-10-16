import { redirect } from "next/navigation";
import { ensureOwner, getUser } from "@/lib/admin-auth";
import { LoginForm } from "@/components/admin/AuthForms";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await ensureOwner();
  if (await getUser()) redirect("/admin");
  return <LoginForm />;
}
