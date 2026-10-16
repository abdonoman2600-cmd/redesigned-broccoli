"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/admin-fetch";
import { inputCls } from "./ui";

export type InvRow = { id: number; name: string; image: string; sku: string; price: number; compareAtPrice: number | null; stock: number | null; available: boolean };

export default function InventoryTable({ rows }: { rows: InvRow[] }) {
  const router = useRouter();
  const [vals, setVals] = useState<Record<number, InvRow>>(Object.fromEntries(rows.map((r) => [r.id, r])));
  const [state, setState] = useState<Record<number, "saving" | "saved" | string>>({});

  const set = (id: number, k: keyof InvRow, v: unknown) => setVals((x) => ({ ...x, [id]: { ...x[id], [k]: v } }));

  const save = async (id: number) => {
    const v = vals[id];
    setState((s) => ({ ...s, [id]: "saving" }));
    try {
      await api(`/api/admin/products/${id}`, "PUT", { price: v.price, compareAtPrice: v.compareAtPrice, stock: v.stock, available: v.available });
      setState((s) => ({ ...s, [id]: "saved" }));
      router.refresh();
      setTimeout(() => setState((s) => ({ ...s, [id]: "" })), 1500);
    } catch (e) {
      setState((s) => ({ ...s, [id]: e instanceof Error ? e.message : "خطأ" }));
    }
  };

  return (
    <div className="overflow-x-auto rounded-3xl border border-stone-warm bg-white">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-sand text-start">
          <tr>
            {["المنتج", "السعر", "قبل الخصم", "المخزون", "متاح", ""].map((h) => (
              <th key={h} className="p-4 text-start font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-warm">
          {rows.map((r) => {
            const v = vals[r.id];
            const st = state[r.id];
            return (
              <tr key={r.id}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.image} alt="" className="h-11 w-11 rounded-lg object-cover" />
                    <div className="min-w-0"><p className="line-clamp-1 max-w-[220px] font-bold">{r.name}</p>{r.sku && <p className="text-xs text-muted" dir="ltr">{r.sku}</p>}</div>
                  </div>
                </td>
                <td className="p-3"><input type="number" min={1} className={`${inputCls} w-28 py-2`} value={v.price} onChange={(e) => set(r.id, "price", Number(e.target.value))} /></td>
                <td className="p-3"><input type="number" min={0} className={`${inputCls} w-28 py-2`} value={v.compareAtPrice ?? ""} onChange={(e) => set(r.id, "compareAtPrice", e.target.value ? Number(e.target.value) : null)} /></td>
                <td className="p-3"><input type="number" min={0} placeholder="∞" className={`${inputCls} w-24 py-2`} value={v.stock ?? ""} onChange={(e) => set(r.id, "stock", e.target.value === "" ? null : Number(e.target.value))} /></td>
                <td className="p-3"><input type="checkbox" className="h-5 w-5 accent-[#a97c3f]" checked={v.available} onChange={(e) => set(r.id, "available", e.target.checked)} /></td>
                <td className="p-3 text-end">
                  <button onClick={() => save(r.id)} disabled={st === "saving"} className="rounded-full bg-ink px-5 py-2 font-bold text-white hover:bg-brass-dark disabled:opacity-60">
                    {st === "saving" ? "..." : st === "saved" ? "✓ تم" : "حفظ"}
                  </button>
                  {st && st !== "saving" && st !== "saved" && <p className="mt-1 text-xs text-red-600">{st}</p>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="p-4 text-xs text-muted">اترك «المخزون» فارغًا إذا كانت الكمية غير محدودة (خدمات). يُخصم المخزون تلقائيًا عند كل طلب ويُعاد عند إلغائه.</p>
    </div>
  );
}
