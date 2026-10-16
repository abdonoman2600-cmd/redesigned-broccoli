"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/admin-fetch";
import { formatDate } from "@/lib/format";
import { Notice } from "./ui";

type Row = { id: number; userName: string; action: string; summary: string; restorable: boolean; restoredAt: string | null; createdAt: string };

export default function ActivityList({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const restore = async (r: Row) => {
    if (!confirm("استعادة القيمة السابقة؟ سيظهر ذلك فورًا في المتجر.")) return;
    setErr("");
    try {
      await api(`/api/admin/audit/${r.id}/restore`, "POST", {});
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذّرت الاستعادة");
    }
  };
  return (
    <div>
      {err && <div className="mb-4"><Notice kind="err">{err}</Notice></div>}
      <ul className="divide-y divide-stone-warm overflow-hidden rounded-3xl border border-stone-warm bg-white">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-bold">{r.summary}</p>
              <p className="text-xs text-muted">{r.userName} · {formatDate(r.createdAt)} · {r.action}</p>
            </div>
            {r.restoredAt ? <span className="text-xs text-muted">تمت الاستعادة</span> : r.restorable ? <button onClick={() => restore(r)} className="rounded-full border border-ink/20 px-4 py-1.5 text-xs font-bold hover:bg-sand">↶ استعادة</button> : null}
          </li>
        ))}
        {rows.length === 0 && <li className="p-10 text-center text-muted">لا توجد سجلات بعد.</li>}
      </ul>
    </div>
  );
}
