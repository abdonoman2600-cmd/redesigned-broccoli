import { recoveryEnabled } from "@/lib/admin-auth";
import { RecoverForm } from "@/components/admin/AuthForms";

export const dynamic = "force-dynamic";

export default function RecoverPage() {
  return <RecoverForm enabled={recoveryEnabled()} />;
}
