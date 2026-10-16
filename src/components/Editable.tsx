"use client";

import { useState, type ElementType } from "react";
import { EN } from "@/lib/i18n";
import { useEdit } from "./EditProvider";
import { useSite } from "./SiteProvider";

/**
 * Any piece of text on the site. Visitors see the text; the owner (in edit mode) clicks and types.
 * Children = the default (Arabic) text. In English mode the English text is stored separately.
 * Clearing the text restores the default. Edits are saved as drafts until published.
 */
export default function Editable({
  id,
  children,
  as = "span",
  className = "",
  multiline = false,
}: {
  id: string;
  children: string;
  as?: ElementType;
  className?: string;
  multiline?: boolean;
}) {
  const { content, editing, save } = useEdit();
  const { lang } = useSite();
  const [version, setVersion] = useState(0);
  const Tag = as;
  const en = lang === "en" && !id.startsWith("contact.");
  const key = en ? `en.${id}` : id;
  const def = en ? (EN[children.trim()] ?? children) : children;
  const value = content[key] ?? def;

  if (!editing) return <Tag className={className}>{value}</Tag>;

  return (
    <Tag
      key={version}
      className={`${className} edit-hover ${multiline ? "whitespace-pre-line" : ""}`}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-editable={key}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" && !multiline) {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          e.currentTarget.textContent = value;
          e.currentTarget.blur();
        }
      }}
      onPaste={(e: React.ClipboardEvent) => {
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
      }}
      onBlur={async (e: React.FocusEvent<HTMLElement>) => {
        let text = e.currentTarget.innerText.replace(/\u00a0/g, " ").trim();
        if (!multiline) text = text.replace(/\s*\n\s*/g, " ");
        if (text !== value) await save(key, text === def ? "" : text);
        setVersion((v) => v + 1);
      }}
    >
      {value}
    </Tag>
  );
}
