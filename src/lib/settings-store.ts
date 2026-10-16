import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export async function getSetting(key: string) {
  const [r] = await db.select().from(settings).where(eq(settings.key, key));
  return r?.value ?? null;
}

export async function putSetting(key: string, value: string | null) {
  if (value === null || value === "") await db.delete(settings).where(eq(settings.key, key));
  else await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}
