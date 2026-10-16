import { cookies } from "next/headers";
import { PREVIEW_COOKIE } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function GET() {
  (await cookies()).delete(PREVIEW_COOKIE);
  return new Response(null, { status: 302, headers: { Location: "/" } });
}
