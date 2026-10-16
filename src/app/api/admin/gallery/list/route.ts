import { guard } from "@/lib/admin-auth";
import { getGallery } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guard("content");
  if (denied) return denied;
  return Response.json({ items: await getGallery({ includeHidden: true }) });
}
