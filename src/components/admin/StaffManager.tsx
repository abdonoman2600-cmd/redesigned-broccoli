"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/admin-fetch";
import { formatDate } from "@/lib/format";
import { btn, card, inputCls, Label, Notice } from "./ui";

type Row = { id: number; email: string; name: string; role: string; permissions: string[]; active: boolean; lastLoginAt: string | null };

function Perms({ perms, value, onChange }: { perms: Record<string, string>; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(perms).map(([k, label]) => (
        <label key={k} className="flex cursor-pointer items-center gap-2 rounded-xl bg-sand p-3 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[#a97c3f]" checked={value.includes(k)} onChange={(e) => onChange(e.target.checked ? [...value, k] : value.filter((x) => x !== k))} />
          {label}
        </label>
      ))}
    </div>
  );
}

export default function StaffManager({ rows, perms, meId }: { rows: Row[]; perms: Record<string, string>; meId: number }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", permissions: ["orders"] as string[] });
  const [link, setLink] = useState<{ text: string; url: string } | null>(null);
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState<Record<number, string[]>>({});

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      const r = await api<{ link: string }>("/api/admin/users", "POST", f);
      setLink({ text: `أرسل هذا الرابط إلى ${f.name} ليعيّن كلمة مروره (صالح ٧ أيام، يُستخدم مرة واحدة):`, url: r.link });
      setF({ name: "", email: "", permissions: ["orders"] });
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "تعذّر الإضافة");
    }
  };

  const patch = async (id: number, body: Record<string, unknown>) => {
    await api(`/api/admin/users/${id}`, "PATCH", body).catch((e) => setErr(e.message));
    router.refresh();
  };

  const resetLink = async (u: Row) => {
    const r = await api<{ link: string }>(`/api/admin/users/${u.id}/reset-link`, "POST", {});
    setLink({ text: `رابط إعادة تعيين كلمة مرور ${u.name} (صالح ٢٤ ساعة):`, url: r.link });
  };

  const del = async (u: Row) => {
    if (!confirm(`حذف حساب ${u.name} نهائيًا؟`)) return;
    await api(`/api/admin/users/${u.id}`, "DELETE").catch((e) => setErr(e.message));
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {link && (
        <Notice kind="ok">
          <p className="font-bold">{link.text}</p>
          <input readOnly value={link.url} dir="ltr" onFocus={(e) => e.target.select()} className="mt-2 w-full rounded-xl border border-stone-warm bg-white px-3 py-2 text-xs" />
          <button onClick={() => navigator.clipboard?.writeText(link.url)} className="mt-2 text-xs font-bold underline">نسخ</button>
        </Notice>
      )}
      {err && <Notice kind="err">{err}</Notice>}

      <ul className="space-y-3">
        {rows.map((u) => (
          <li key={u.id} className={`${card} !p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <b>{u.name}</b> <span className="text-xs text-muted" dir="ltr">{u.email}</span>
                <p className="text-xs text-muted">{u.role === "owner" ? "المالك (كل الصلاحيات)" : u.active ? "موظف نشط" : "موقوف"}{u.lastLoginAt && ` · آخر دخول ${formatDate(u.lastLoginAt)}`}</p>
              </div>
              {u.role !== "owner" && u.id !== meId && (
                <div className="flex flex-wrap gap-3 text-sm font-bold">
                  <button onClick={() => patch(u.id, { active: !u.active })} className="hover:underline">{u.active ? "إيقاف" : "تفعيل"}</button>
                  <button onClick={() => resetLink(u)} className="text-brass-dark hover:underline">رابط كلمة مرور جديدة</button>
                  <button onClick={() => del(u)} className="text-red-600 hover:underline">حذف</button>
                </div>
              )}
            </div>
            {u.role !== "owner" && (
              <div className="mt-4">
                <Perms perms={perms} value={edit[u.id] ?? u.permissions} onChange={(v) => setEdit({ ...edit, [u.id]: v })} />
                {edit[u.id] && <button onClick={() => patch(u.id, { permissions: edit[u.id] }).then(() => setEdit((x) => { const n = { ...x }; delete n[u.id]; return n; }))} className={`${btn} mt-3 !py-2`}>حفظ الصلاحيات</button>}
              </div>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={add} className={card}>
        <h2 className="font-display text-2xl font-bold">إضافة موظف</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Label label="الاسم"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Label>
          <Label label="البريد الإلكتروني"><input type="email" dir="ltr" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Label>
        </div>
        <p className="mb-2 mt-5 text-sm font-bold">الصلاحيات</p>
        <Perms perms={perms} value={f.permissions} onChange={(v) => setF({ ...f, permissions: v })} />
        <p className="mt-3 text-xs text-muted">لا يمكن للموظف أبدًا: إدارة الموظفين، سجل التغييرات واستعادته، النسخ الاحتياطي. هذه للمالك فقط.</p>
        <button className={`${btn} mt-5`}>إضافة وإنشاء رابط الدخول</button>
      </form>
    </div>
  );
}
