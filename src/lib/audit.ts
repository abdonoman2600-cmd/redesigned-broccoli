import "server-only";
import { db } from "@/db";
import { auditLog, notifications } from "@/db/schema";
import type { AuthUser } from "./admin-auth";

export async function logAudit(opts: {
  user: AuthUser | null;
  action: string;
  entity: string;
  entityId?: string | number;
  summary: string;
  before?: unknown;
  after?: unknown;
  restorable?: boolean;
}) {
  await db.insert(auditLog).values({
    userId: opts.user?.id ?? null,
    userName: opts.user?.name ?? "النظام",
    action: opts.action,
    entity: opts.entity,
    entityId: String(opts.entityId ?? ""),
    summary: opts.summary.slice(0, 300),
    before: (opts.before ?? null) as never,
    after: (opts.after ?? null) as never,
    restorable: !!opts.restorable,
  });
}

/** In-panel notification + optional webhook (NOTIFY_WEBHOOK_URL: Slack/Discord/Telegram-bridge/Make/Zapier...). */
export async function notifyOwner(n: { type: string; title: string; body?: string; link?: string }) {
  await db.insert(notifications).values({ type: n.type, title: n.title, body: n.body ?? "", link: n.link ?? "" });
  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (url) {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${n.title}${n.body ? `\n${n.body}` : ""}`, ...n }),
        signal: AbortSignal.timeout(4000),
      });
    } catch {
      /* webhook failures must never break an order */
    }
  }
}
