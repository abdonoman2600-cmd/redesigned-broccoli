"use client";

import { useState } from "react";
import { EN } from "@/lib/i18n";
import { useEdit } from "./EditProvider";
import { useSite } from "./SiteProvider";

export default function EditableMarquee({ items }: { items: string[] }) {
  const { content, editing, save } = useEdit();
  const { lang } = useSite();
  const [version, setVersion] = useState(0);
  const key = lang === "en" ? "en.home.marquee" : "home.marquee";
  const defaultRaw = items.map((i) => (lang === "en" ? (EN[i] ?? i) : i)).join("،");
  const raw = content[key] ?? defaultRaw;
  const list = raw.split(/[،,]/).map((s) => s.trim()).filter(Boolean);

  if (editing) {
    return (
      <div className="border-y border-stone-warm bg-sand px-6 py-4 text-center">
        <p className="mb-1 text-xs text-brass-dark">الشريط المتحرك — افصل بين الكلمات بفاصلة (،)</p>
        <div
          key={version}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          className="edit-hover mx-auto max-w-3xl font-display text-xl text-charcoal"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          onBlur={async (e) => {
            const text = e.currentTarget.innerText.trim();
            if (text !== raw) await save(key, text === defaultRaw ? "" : text);
            setVersion((v) => v + 1);
          }}
        >
          {raw}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border-y border-stone-warm bg-sand py-4" aria-hidden>
      <div className="animate-marquee flex w-max gap-10 whitespace-nowrap font-display text-xl text-charcoal">
        {[...list, ...list, ...list, ...list].map((m, i) => (
          <span key={i} className="flex items-center gap-10">
            {m}
            <span className="text-brass">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
