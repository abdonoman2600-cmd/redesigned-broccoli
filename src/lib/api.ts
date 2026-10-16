import "server-only";
import { isLocalHost, resolveOrigin } from "./origin";

export const bad = (error: string, status = 400) => Response.json({ error }, { status });

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
export const isSecure = (req: Request) => {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  const proto = (req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "")).split(",")[0].trim();
  // real (non-local) hosts are served over https even when the proxy hop reports http
  return proto === "https" || !isLocalHost(host);
};
export const validImg = (v: string) => v.startsWith("/api/media/") || /^https?:\/\//.test(v);
const AR = "٠١٢٣٤٥٦٧٨٩";
export const digits = (v: string) => v.replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
export const origin = (req: Request) =>
  resolveOrigin(req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host, req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", ""));

/** Postgres unique-violation (drizzle wraps the driver error in `cause`). */
export const isUnique = (e: unknown) => {
  const x = e as { code?: string; cause?: { code?: string } } | null;
  return x?.code === "23505" || x?.cause?.code === "23505";
};
