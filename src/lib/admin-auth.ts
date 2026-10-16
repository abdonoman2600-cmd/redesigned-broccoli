import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { resetTokens, settings, users } from "@/db/schema";

const COOKIE = "rashid_session";
const MAX_AGE = 60 * 60 * 24 * 7;
export const DEFAULT_PASSWORD = "rashid@2026";
export const DEFAULT_OWNER_EMAIL = "owner@rashid.store";

/** Permission keys. The owner always has all of them (+ staff/backup/activity which are owner-only). */
export const PERMISSIONS: Record<string, string> = {
  products: "المنتجات والتصنيفات والمخزون",
  orders: "الطلبات",
  customers: "العملاء (بيانات شخصية)",
  content: "الصفحة الرئيسية والصفحات والمعرض والصور",
  discounts: "الخصومات والشحن والدفع والضرائب",
  settings: "الإعدادات والمظهر والقوائم",
  reports: "التقارير والإحصائيات",
};

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  mustChangePassword: boolean;
};

export function can(user: AuthUser | null, perm?: string) {
  if (!user) return false;
  if (user.role === "owner") return true;
  if (!perm) return true;
  if (perm === "owner") return false;
  return user.permissions.includes(perm);
}

/* ---------------- passwords ---------------- */

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

function verifyHash(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return safeEqual(scryptSync(pw, salt, 64).toString("hex"), hash);
}

export function passwordProblem(pw: string) {
  if (pw.length < 8) return "كلمة المرور يجب ألا تقل عن ٨ أحرف";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "كلمة المرور يجب أن تحتوي على حروف وأرقام";
  return null;
}

/* ---------------- secrets ---------------- */

let secretCache: string | null = null;
async function sessionSecret() {
  if (secretCache) return secretCache;
  const [row] = await db.select().from(settings).where(eq(settings.key, "sessionSecret"));
  if (row) return (secretCache = row.value);
  const value = randomBytes(32).toString("hex");
  await db.insert(settings).values({ key: "sessionSecret", value }).onConflictDoNothing();
  const [again] = await db.select().from(settings).where(eq(settings.key, "sessionSecret"));
  return (secretCache = again.value);
}

async function sign(payload: string) {
  return createHmac("sha256", await sessionSecret()).update(payload).digest("hex");
}

/* ---------------- bootstrap owner (migrates the old single-password login) ---------------- */

export async function ensureOwner() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  if (n > 0) return; // a single cheap count per call: never cached, so an emptied users table is always re-bootstrapped
  {
    const [legacy] = await db.select().from(settings).where(eq(settings.key, "adminPass"));
    const envPw = process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 6 ? process.env.ADMIN_PASSWORD : null;
    const email = (process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL).toLowerCase();
    await db
      .insert(users)
      .values({
        email,
        name: "رشيد",
        role: "owner",
        passwordHash: legacy ? legacy.value : hashPassword(envPw ?? DEFAULT_PASSWORD),
        // a password that was never changed by the owner must be changed on first login
        mustChangePassword: !legacy,
      })
      .onConflictDoNothing();
  }
}

/* ---------------- login throttling (per process) ---------------- */

const attempts = new Map<string, { n: number; until: number }>();
export function throttled(key: string) {
  const a = attempts.get(key);
  return !!a && a.until > Date.now();
}
export function recordFailure(key: string) {
  const a = attempts.get(key) ?? { n: 0, until: 0 };
  a.n += 1;
  if (a.n >= 5) {
    a.until = Date.now() + 15 * 60 * 1000;
    a.n = 0;
  }
  attempts.set(key, a);
}
export function clearFailures(key: string) {
  attempts.delete(key);
}
export async function clientKey(extra: string) {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  return `${ip}|${extra.toLowerCase()}`;
}

/* ---------------- sessions ---------------- */

export async function login(email: string, password: string) {
  await ensureOwner();
  const [u] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
  // always run a hash comparison so timing doesn't reveal whether the email exists
  const ok = u ? verifyHash(password, u.passwordHash) : (verifyHash(password, "00:00"), false);
  if (!u || !ok || !u.active) return null;
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, u.id));
  return u;
}

export async function createSession(userId: number, version: number, secure: boolean) {
  const payload = `${userId}.${version}.${Date.now() + MAX_AGE * 1000}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${await sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete("rashid_mode");
}

/** The signed-in user (verified against the DB on every request), or null. */
export const getUser = cache(async (): Promise<AuthUser | null> => {
  const jar = await cookies();
  const v = jar.get(COOKIE)?.value;
  if (!v) return null;
  const parts = v.split(".");
  if (parts.length !== 4) return null;
  const [id, version, exp, sig] = parts;
  if (!safeEqual(sig, await sign(`${id}.${version}.${exp}`))) return null;
  if (Number(exp) < Date.now()) return null;
  const [u] = await db.select().from(users).where(eq(users.id, Number(id)));
  if (!u || !u.active || u.sessionVersion !== Number(version)) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    permissions: u.permissions,
    mustChangePassword: u.mustChangePassword,
  };
});

export async function isAdmin() {
  return !!(await getUser());
}

/** Page guard: returns the user or null (pages decide what to render). */
export async function pageUser(perm?: string) {
  const u = await getUser();
  return u && can(u, perm) ? u : null;
}

/**
 * API guard. Verifies the session, the permission, and (for browsers) that the request comes from our own origin.
 * Usage:  const a = await auth("products"); if (a.deny) return a.deny;  a.user ...
 */
export async function auth(perm?: string, opts: { allowMustChange?: boolean } = {}) {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return { user: null as never, deny: Response.json({ error: "طلب مرفوض (origin)" }, { status: 403 }) };
      }
    } catch {
      return { user: null as never, deny: Response.json({ error: "طلب مرفوض" }, { status: 403 }) };
    }
  }
  const user = await getUser();
  if (!user) return { user: null as never, deny: Response.json({ error: "غير مصرّح، سجّل الدخول" }, { status: 401 }) };
  if (user.mustChangePassword && !opts.allowMustChange) {
    return { user: null as never, deny: Response.json({ error: "يجب تغيير كلمة المرور أولًا", mustChange: true }, { status: 403 }) };
  }
  if (!can(user, perm)) {
    return { user: null as never, deny: Response.json({ error: "ليست لديك صلاحية لهذا الإجراء" }, { status: 403 }) };
  }
  return { user, deny: null as Response | null };
}

/** Backwards-compatible simple guard. */
export async function guard(perm?: string) {
  const a = await auth(perm);
  return a.deny;
}

/* ---------------- password change / reset ---------------- */

export async function changePassword(userId: number, next: string) {
  await db
    .update(users)
    .set({ passwordHash: hashPassword(next), mustChangePassword: false, sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(eq(users.id, userId));
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  return u;
}

export async function checkUserPassword(userId: number, pw: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  return !!u && verifyHash(pw, u.passwordHash);
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createResetToken(userId: number, hours = 24) {
  const raw = randomBytes(32).toString("hex");
  await db.insert(resetTokens).values({
    userId,
    tokenHash: sha(raw),
    expiresAt: new Date(Date.now() + hours * 3600 * 1000),
  });
  return raw;
}

export async function resolveResetToken(raw: string) {
  const [t] = await db.select().from(resetTokens).where(eq(resetTokens.tokenHash, sha(raw)));
  if (!t || t.usedAt || t.expiresAt < new Date()) return null;
  return t;
}

export async function consumeResetToken(raw: string, password: string) {
  const t = await resolveResetToken(raw);
  if (!t) return null;
  await db.update(resetTokens).set({ usedAt: new Date() }).where(eq(resetTokens.id, t.id));
  return changePassword(t.userId, password);
}

export function recoveryKeyValid(key: string) {
  const k = process.env.ADMIN_RECOVERY_KEY;
  return !!k && k.length >= 12 && safeEqual(key, k);
}
export const recoveryEnabled = () => !!process.env.ADMIN_RECOVERY_KEY && process.env.ADMIN_RECOVERY_KEY.length >= 12;
