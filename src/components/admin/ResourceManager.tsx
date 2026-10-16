"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Field } from "@/lib/resources";
import { api } from "@/lib/admin-fetch";
import ImageUploader from "./ImageUploader";
import { btn, btnGhost, inputCls, Label, Notice } from "./ui";

type Row = Record<string, unknown> & { id: number };

function Inputs({ fields, v, set }: { fields: Field[]; v: Record<string, unknown>; set: (k: string, val: unknown) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const wide = f.wide || f.type === "textarea" || f.type === "image";
        const val = v[f.key];
        let input;
        if (f.type === "bool") {
          input = (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-sand p-3.5">
              <input type="checkbox" className="h-5 w-5 accent-[#a97c3f]" checked={Boolean(val)} onChange={(e) => set(f.key, e.target.checked)} />
              <b>{f.label}</b>
            </label>
          );
          return <div key={f.key} className={wide ? "sm:col-span-2" : ""}>{input}</div>;
        }
        if (f.type === "image") input = <div className="max-w-[180px]"><ImageUploader value={val ? [String(val)] : []} onChange={(x) => set(f.key, x[0] ?? "")} /></div>;
        else if (f.type === "textarea") input = <textarea className={`${inputCls} min-h-28`} dir={f.dir} value={String(val ?? "")} onChange={(e) => set(f.key, e.target.value)} />;
        else if (f.type === "select")
          input = (
            <select className={inputCls} value={String(val ?? "")} onChange={(e) => set(f.key, e.target.value)}>
              {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          );
        else if (f.type === "number") input = <input type="number" min={f.min ?? 0} className={inputCls} value={val === undefined || val === "" ? "" : Number(val)} onChange={(e) => set(f.key, e.target.value === "" ? "" : Number(e.target.value))} />;
        else input = <input className={inputCls} dir={f.dir} maxLength={f.max} value={String(val ?? "")} onChange={(e) => set(f.key, e.target.value)} />;
        return (
          <Label key={f.key} label={f.label + (f.required ? " *" : "")} hint={f.hint} className={wide ? "sm:col-span-2" : ""}>
            {input}
          </Label>
        );
      })}
    </div>
  );
}

/** Generic list + add/edit/delete/reorder UI for simple admin resources (categories, coupons, shipping zones, FAQ, pages). */
export default function ResourceManager({
  resource,
  label,
  fields,
  rows,
  titleKey,
  subKey,
  reorder = false,
  defaults = {},
  protect,
}: {
  resource: string;
  label: string;
  fields: Field[];
  rows: Row[];
  titleKey: string;
  subKey?: string;
  reorder?: boolean;
  defaults?: Record<string, unknown>;
  protect?: { key: string; values: string[] };
}) {
  const router = useRouter();
  const [open, setOpen] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const edit = (r: Row) => {
    setOpen(open === r.id ? null : r.id);
    setDraft({ ...r });
    setError("");
  };
  const startNew = () => {
    setOpen("new");
    setDraft({ ...defaults });
    setError("");
  };
  const set = (k: string, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const body: Record<string, unknown> = {};
      for (const f of fields) body[f.key] = draft[f.key] ?? (f.type === "bool" ? false : f.type === "number" ? 0 : "");
      if (open === "new") await api(`/api/admin/r/${resource}`, "POST", body);
      else await api(`/api/admin/r/${resource}/${open}`, "PUT", body);
      setOpen(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
    setBusy(false);
  };

  const remove = async (r: Row) => {
    if (!confirm(`حذف ${label} نهائيًا؟`)) return;
    try {
      await api(`/api/admin/r/${resource}/${r.id}`, "DELETE");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "تعذّر الحذف");
    }
  };

  const move = async (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const ids = rows.map((r) => r.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await api(`/api/admin/r/${resource}`, "POST", { action: "reorder", ids });
    router.refresh();
  };

  const form = (
    <div className="mt-5 border-t border-stone-warm pt-5">
      <Inputs fields={fields} v={draft} set={set} />
      {error && <div className="mt-4"><Notice kind="err">{error}</Notice></div>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={save} disabled={busy} className={btn}>{busy ? "جارٍ الحفظ..." : "حفظ"}</button>
        <button onClick={() => setOpen(null)} className={btnGhost}>إلغاء</button>
      </div>
    </div>
  );

  return (
    <div>
      <button onClick={startNew} className="mb-5 rounded-full bg-brass px-7 py-3.5 font-bold text-white transition hover:bg-brass-dark">+ إضافة {label}</button>
      {open === "new" && <div className="mb-5 rounded-3xl border-2 border-brass/50 bg-white p-6">{form}</div>}
      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li key={r.id} className="rounded-3xl border border-stone-warm bg-white p-5">
            <div className="flex flex-wrap items-center gap-3">
              {reorder && (
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="px-2 text-xs disabled:opacity-20" aria-label="أعلى">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="px-2 text-xs disabled:opacity-20" aria-label="أسفل">▼</button>
                </div>
              )}
              {"image" in r && r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={String(r.image)} alt="" className="h-14 w-14 rounded-xl object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-bold">{String(r[titleKey] ?? "")}</p>
                {subKey && <p className="line-clamp-1 text-xs text-muted">{String(r[subKey] ?? "")}</p>}
              </div>
              {("active" in r || "published" in r) && (
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${r.active ?? r.published ? "bg-green-50 text-green-700" : "bg-stone-warm text-muted"}`}>
                  {r.active ?? r.published ? "ظاهر" : "مخفي"}
                </span>
              )}
              <button onClick={() => edit(r)} className="rounded-full bg-ink px-5 py-2 text-sm font-bold text-white hover:bg-brass-dark">{open === r.id ? "إغلاق" : "تعديل"}</button>
              {!(protect && protect.values.includes(String(r[protect.key]))) && <button onClick={() => remove(r)} className="text-sm font-bold text-red-600 hover:underline">حذف</button>}
            </div>
            {open === r.id && form}
          </li>
        ))}
        {rows.length === 0 && <li className="rounded-3xl bg-sand p-10 text-center text-muted">لا توجد عناصر بعد.</li>}
      </ul>
    </div>
  );
}
