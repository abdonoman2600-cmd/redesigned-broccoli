import { db } from "@/db";
import { messages } from "@/db/schema";
import { bad, digits, readBody, str } from "@/lib/api";
import { notifyOwner } from "@/lib/audit";

export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 3600_000);
  list.push(now);
  hits.set(ip, list);
  if (list.length > 6) return bad("رسائل كثيرة، حاول لاحقًا", 429);

  const b = await readBody(req);
  if (str(b.website, 50)) return Response.json({ ok: true }); // honeypot: bots fill hidden field
  const name = str(b.name, 80);
  const phone = digits(str(b.phone, 20));
  const email = str(b.email, 120);
  const body = str(b.body, 2000);
  if (name.length < 2) return bad("من فضلك أدخل اسمك");
  if (!phone && !email) return bad("أدخل رقم هاتف أو بريدًا إلكترونيًا للتواصل");
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return bad("البريد الإلكتروني غير صحيح");
  if (body.length < 5) return bad("اكتب رسالتك");
  await db.insert(messages).values({ name, phone, email, body });
  await notifyOwner({ type: "message", title: `رسالة جديدة من ${name}`, body: body.slice(0, 120), link: "/admin/messages" });
  return Response.json({ ok: true }, { status: 201 });
}
