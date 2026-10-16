"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/admin-fetch";
import { formatPrice, toTel } from "@/lib/format";
import { card, inputCls } from "./ui";

type Row = { id: number; name: string; phone: string; email: string | null; city: string; notes: string; orders: number; spent: number };

export default function CustomersTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [notes, setNotes] = useState<Record<number, string>>(Object.fromEntries(rows.map((r) => [r.id, r.notes])));
  const list = rows.filter((r) => !q.trim() || (r.name + r.phone + (r.email ?? "")).toLowerCase().includes(q.trim().toLowerCase()));

  const erase = async (r: Row) => {
    if (!confirm(`مسح البيانات الشخصية للعميل "${r.name}" نهائيًا؟ (الطلبات تبقى بدون هوية)`)) return;
    await api(`/api/admin/customers/${r.id}`, "DELETE");
    router.refresh();
  };

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." className={`${inputCls} mb-5 max-w-xs`} />
      <ul className="space-y-3">
        {list.map((r) => (
          <li key={r.id} className={`${card} !p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <b className="text-lg">{r.name}</b>
                <a href={`tel:${toTel(r.phone)}`} dir="ltr" className="block text-sm text-brass-dark" style={{ textAlign: "start" }}>{r.phone}</a>
                <p className="text-xs text-muted">{r.city}{r.email && ` · ${r.email}`}</p>
              </div>
              <div className="text-end text-sm"><b>{r.orders}</b> طلب<br /><b>{formatPrice(r.spent)}</b></div>
            </div>
            <textarea
              className={`${inputCls} mt-3 min-h-14 text-sm`}
              placeholder="ملاحظات عن العميل..."
              value={notes[r.id]}
              onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
              onBlur={() => notes[r.id] !== r.notes && api(`/api/admin/customers/${r.id}`, "PATCH", { notes: notes[r.id] }).then(() => router.refresh())}
            />
            <button onClick={() => erase(r)} className="mt-3 text-xs font-bold text-red-600 hover:underline">مسح بياناته الشخصية</button>
          </li>
        ))}
        {list.length === 0 && <li className="rounded-3xl bg-sand p-12 text-center text-muted">لا يوجد عملاء بعد.</li>}
      </ul>
    </div>
  );
}
