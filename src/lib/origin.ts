import "server-only";
import { headers } from "next/headers";

const LOCAL = /^(localhost|127\.|0\.0\.0\.0|\[::1\]|[^:]*\.local)(:\d+)?$/i;

export const isLocalHost = (host: string) => LOCAL.test(host);

/**
 * The public address of the store. Behind a proxy the app often only sees "http", so for any real (non-local)
 * host we use https. SITE_URL (e.g. https://rashid-decor.com) overrides everything once a permanent domain exists.
 */
export function resolveOrigin(host: string | null, proto: string | null) {
  const site = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (site && /^https?:\/\/[^\s/]+$/i.test(site)) return site;
  const h = host ?? "localhost:3000";
  const p = (proto ?? "").split(",")[0].trim();
  return `${isLocalHost(h) ? (p === "https" ? "https" : "http") : "https"}://${h}`;
}

export async function currentOrigin() {
  const h = await headers();
  return resolveOrigin(h.get("x-forwarded-host") ?? h.get("host"), h.get("x-forwarded-proto"));
}
