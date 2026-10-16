"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/lib/admin-fetch";
import { formatPrice } from "@/lib/format";
import { btnGhost, inputCls, Notice } from "./ui";

export type AdminProductRow = {
  id: number;
  name: string;
  image: string;
  category: string;
  price: number;
  unit: string;
  active: boolean;
  featured: boolean;
  available: boolean;
  stock: number | null;
  sku: string;
  draft: boolean;
};

export default function ProductsTable({ rows }: { rows: AdminProductRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const toggle = async (id: number, patch: Record<string, boolean>) => {
    setBusyId(id);
    await api(`/api/admin/products/${id}`, "PUT", patch).catch(() => null);
    setBusyId(null);
    router.refresh();
  };

  const move = async (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= rows.length || q) return;
    const ids = rows.map((r) => r.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await api("/api/admin/products", "PATCH", { ids });
    router.refresh();
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    setMsg(null);
    try {
      const csv = await f.text();
      const r = await api<{ created: number; updated: number; errors: string[] }>("/api/admin/products/import", "POST", { csv });
      setMsg({ ok: r.errors.length === 0, text: `تم: ${r.created} منتج جديد، ${r.updated} محدّث${r.errors.length ? ` — ${r.errors.length} خطأ:\n${r.errors.join("\n")}` : ""}` });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "فشل الاستيراد" });
    }
    if (file.current) file.current.value = "";
  };

  const list = rows.filter((r) => !q.trim() || (r.name + r.sku).toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الرقم..." className={`${inputCls} max-w-xs`} />
        <a href="/api/admin/products/export" className={btnGhost}>⬇ تصدير CSV</a>
        <button onClick={() => file.current?.click()} className={btnGhost}>⬆ استيراد CSV</button>
        <input ref={file} type="file" accept=".csv,text/csv" hidden onChange={(e) => onImport(e.target.files?.[0])} />
      </div>
      {msg && <div className="mb-5 whitespace-pre-line"><Notice kind={msg.ok ? "ok" : "warn"}>{msg.text}</Notice></div>}
      <ul className="divide-y divide-stone-warm overflow-hidden rounded-3xl border border-stone-warm bg-white">
        {list.map((r, i) => (
          <li key={r.id} className={`flex flex-wrap items-center gap-4 p-4 ${busyId === r.id ? "opacity-60" : ""}`}>
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} disabled={!!q || i === 0} className="px-1 text-xs disabled:opacity-20" aria-label="أعلى">▲</button>
              <button onClick={() => move(i, 1)} disabled={!!q || i === rows.length - 1} className="px-1 text-xs disabled:opacity-20" aria-label="أسفل">▼</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.image} alt="" className={`h-16 w-16 shrink-0 rounded-xl object-cover ${r.active ? "" : "grayscale"}`} />
            <div className="min-w-0 flex-1 basis-56">
              <Link href={`/admin/products/${r.id}`} className="line-clamp-1 font-bold hover:text-brass-dark">{r.name}</Link>
              <p className="text-xs text-muted">
                {r.category} · {formatPrice(r.price)} / {r.unit}
                {r.sku && <> · <span dir="ltr">{r.sku}</span></>}
                {r.stock !== null && <> · المخزون: {r.stock}</>}
                {r.draft && <b className="ms-2 rounded-full bg-amber-400 px-2 py-0.5 text-ink">تعديلات غير منشورة</b>}
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#a97c3f]" checked={r.active} onChange={(e) => toggle(r.id, { active: e.target.checked })} />{r.active ? "ظاهر" : "مخفي"}</label>
            <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#a97c3f]" checked={r.available} onChange={(e) => toggle(r.id, { available: e.target.checked })} />متاح</label>
            <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#a97c3f]" checked={r.featured} onChange={(e) => toggle(r.id, { featured: e.target.checked })} />مميز</label>
            <Link href={`/admin/products/${r.id}`} className="rounded-full bg-ink px-5 py-2 text-sm font-bold text-white hover:bg-brass-dark">تعديل</Link>
          </li>
        ))}
        {list.length === 0 && <li className="p-10 text-center text-muted">لا توجد منتجات</li>}
      </ul>
      <p className="mt-3 text-xs text-muted">ملاحظة: الأسهم تغيّر ترتيب ظهور المنتجات في المتجر. هذه الصفحة تنشر التعديلات فورًا وتسجّلها في «سجل التغييرات».</p>
    </div>
  );
}
