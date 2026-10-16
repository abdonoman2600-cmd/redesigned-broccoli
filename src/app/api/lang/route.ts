import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const l = url.searchParams.get("l") === "en" ? "en" : "ar";
  let next = url.searchParams.get("next") || "/";
  if (!next.startsWith("/") || next.startsWith("//")) next = "/";
  (await cookies()).set("lang", l, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return new Response(null, { status: 302, headers: { Location: next } });
}
