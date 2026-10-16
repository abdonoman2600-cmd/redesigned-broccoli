"use client";

import { useState } from "react";

import T from "@/components/T";
const cls = "w-full rounded-xl border border-stone-warm bg-white px-4 py-3.5 outline-none transition focus:border-brass focus:ring-4 focus:ring-brass/15";

export default function ContactForm() {
  const [f, setF] = useState({ name: "", phone: "", email: "", body: "", website: "" });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    setError("");
    const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) setState("done");
    else {
      setError(d.error || "تعذّر الإرسال");
      setState("idle");
    }
  };

  if (state === "done") {
    return <p className="rounded-3xl bg-green-50 p-10 text-center text-lg font-bold text-green-800"><T>شكرًا لك! وصلتنا رسالتك وسنتواصل معك قريبًا.</T></p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-stone-warm bg-white p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <input className={cls} placeholder="الاسم *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required maxLength={80} />
        <input className={cls} placeholder="رقم الموبايل" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} dir="ltr" inputMode="tel" maxLength={20} />
      </div>
      <input className={cls} placeholder="البريد الإلكتروني" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} dir="ltr" inputMode="email" maxLength={120} />
      <textarea className={`${cls} min-h-32`} placeholder="رسالتك *" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} required maxLength={2000} />
      {/* honeypot: hidden from people, bots fill it */}
      <input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <button disabled={state === "busy"} className="w-full rounded-full bg-ink py-4 font-bold text-white transition hover:bg-brass-dark disabled:opacity-60">
        {state === "busy" ? "جارٍ الإرسال..." : "إرسال الرسالة"}
      </button>
    </form>
  );
}
