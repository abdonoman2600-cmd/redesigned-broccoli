import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-xl border border-stone-warm bg-white px-4 py-3 outline-none transition focus:border-brass focus:ring-4 focus:ring-brass/15";
export const card = "rounded-3xl border border-stone-warm bg-white p-6 md:p-8";
export const btn = "rounded-full bg-ink px-7 py-3.5 font-bold text-white transition hover:bg-brass-dark disabled:opacity-60";
export const btnGhost = "rounded-full border border-ink/20 px-6 py-3 font-bold transition hover:bg-sand disabled:opacity-60";

export function PageTitle({ title, hint, children }: { title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {hint && <p className="mt-2 max-w-2xl text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function Label({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "warn" | "ok" | "err"; children: ReactNode }) {
  const c = { info: "bg-sand text-ink", warn: "bg-amber-50 text-amber-900", ok: "bg-green-50 text-green-800", err: "bg-red-50 text-red-700" }[kind];
  return <div className={`rounded-2xl p-4 text-sm leading-7 ${c}`}>{children}</div>;
}
