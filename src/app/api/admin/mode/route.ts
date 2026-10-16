import { cookies } from "next/headers";
import { auth, can } from "@/lib/admin-auth";
import { bad, isSecure, readBody } from "@/lib/api";
import { MODE_COOKIE } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const a = await auth();
  if (a.deny) return a.deny;
  if (!can(a.user, "content") && !can(a.user, "products")) return bad("لا تملك صلاحية التعديل", 403);
  const { mode } = await readBody(req);
  if (mode !== "edit" && mode !== "preview" && mode !== "live") return bad("وضع غير صالح");
  (await cookies()).set(MODE_COOKIE, mode, { httpOnly: true, sameSite: "lax", secure: isSecure(req), path: "/", maxAge: 60 * 60 * 24 * 30 });
  return Response.json({ ok: true });
}
