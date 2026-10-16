import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { faqs, pages } from "@/db/schema";
import { ensureSeeded } from "./data";
import { getLang } from "./lang";

export async function getPage(slug: string) {
  await ensureSeeded();
  const [p] = await db.select().from(pages).where(eq(pages.slug, slug));
  if (!p || !p.published) return null;
  const en = (await getLang()) === "en";
  return {
    title: en && p.titleEn ? p.titleEn : p.title,
    body: en && p.bodyEn ? p.bodyEn : p.body,
  };
}

export async function getFaqs() {
  await ensureSeeded();
  const en = (await getLang()) === "en";
  const rows = await db.select().from(faqs).where(eq(faqs.active, true)).orderBy(faqs.sortOrder);
  return rows.map((f) => ({
    id: f.id,
    q: en && f.questionEn ? f.questionEn : f.question,
    a: en && f.answerEn ? f.answerEn : f.answer,
  }));
}
