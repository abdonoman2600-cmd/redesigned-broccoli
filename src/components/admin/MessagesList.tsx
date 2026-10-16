"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/admin-fetch";
import { formatDate, toTel } from "@/lib/format";
import { card } from "./ui";

type Row = { id: number; name: string; phone: string; email: string; body: string; read: boolean; createdAt: string };

export default function MessagesList({ rows }: { rows: Row[] }) {
  const router = useRouter();
  return (
    <ul className="space-y-4">
      {rows.map((m) => (
        <li key={m.id} className={`${card} !p-5 ${m.read ? "" : "ring-2 ring-brass/60"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b>{m.name} {!m.read && <span className="ms-2 rounded-full bg-brass px-2 py-0.5 text-xs text-white">جديدة</span>}</b>
            <span className="text-xs text-muted">{formatDate(m.createdAt)}</span>
          </div>
          <p className="mt-3 whitespace-pre-line leading-7">{m.body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            {m.phone && <a href={`tel:${toTel(m.phone)}`} dir="ltr" className="text-brass-dark">{m.phone}</a>}
            {m.email && <a href={`mailto:${m.email}`} dir="ltr" className="text-brass-dark">{m.email}</a>}
            <button onClick={async () => { await api(`/api/admin/messages/${m.id}`, "PATCH", { read: !m.read }); router.refresh(); }} className="text-muted hover:text-ink">{m.read ? "تعليم كغير مقروءة" : "تعليم كمقروءة"}</button>
            <button onClick={async () => { if (confirm("حذف الرسالة؟")) { await api(`/api/admin/messages/${m.id}`, "DELETE"); router.refresh(); } }} className="font-bold text-red-600">حذف</button>
          </div>
        </li>
      ))}
      {rows.length === 0 && <li className="rounded-3xl bg-sand p-12 text-center text-muted">لا توجد رسائل.</li>}
    </ul>
  );
}
