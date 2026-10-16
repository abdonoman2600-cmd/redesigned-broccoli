"use client";

import { useEffect, useState } from "react";
import { MinusIcon, PlusIcon } from "./Icons";
import { formatNumber } from "@/lib/format";

export default function QtyStepper({
  value,
  min,
  step,
  onChange,
  size = "md",
  editable = false,
}: {
  value: number;
  min: number;
  step: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
  editable?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  useEffect(() => setDraft(null), [value]);

  const dim = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const commit = () => {
    if (draft === null) return;
    const n = parseInt(draft.replace(/[^0-9]/g, ""), 10);
    if (!Number.isNaN(n)) onChange(Math.max(min, n));
    setDraft(null);
  };

  return (
    <div className="inline-flex items-center rounded-full border border-stone-warm bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className={`${dim} grid place-items-center rounded-full transition hover:bg-sand disabled:opacity-30`}
        aria-label="تقليل الكمية"
      >
        <MinusIcon width={size === "sm" ? 14 : 18} height={size === "sm" ? 14 : 18} />
      </button>
      {editable ? (
        <input
          inputMode="numeric"
          value={draft ?? String(value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="w-14 bg-transparent text-center font-bold outline-none"
          aria-label="الكمية"
          dir="ltr"
        />
      ) : (
        <span className={`min-w-10 text-center font-bold ${size === "sm" ? "text-sm" : ""}`}>
          {formatNumber(value)}
        </span>
      )}
      <button
        type="button"
        onClick={() => onChange(value + step)}
        className={`${dim} grid place-items-center rounded-full transition hover:bg-sand`}
        aria-label="زيادة الكمية"
      >
        <PlusIcon width={size === "sm" ? 14 : 18} height={size === "sm" ? 14 : 18} />
      </button>
    </div>
  );
}
