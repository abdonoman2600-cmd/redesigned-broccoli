import { cookies } from "next/headers";
import { getPreviewToken, PREVIEW_COOKIE } from "@/lib/mode";
import { isSecure } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const current = await getPreviewToken();
  if (!current || token !== current) return new Response("رابط المعاينة غير صالح أو تم إلغاؤه", { status: 404 });
  (await cookies()).set(PREVIEW_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: isSecure(req), path: "/", maxAge: 60 * 60 * 12 });
  return new Response(null, { status: 302, headers: { Location: "/" } });
}
