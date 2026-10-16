"use client";

import { useRouter } from "next/navigation";
import { useState, type ElementType, type ReactNode } from "react";
import { api } from "@/lib/admin-fetch";
import { useEdit } from "./EditProvider";
import { useSite } from "./SiteProvider";

const AR = "٠١٢٣٤٥٦٧٨٩";

/** Inline-edit a product field (name, price, descriptions) right on the product page. */
export default function EditableProductField({
  productId,
  field,
  value,
  as = "div",
  className = "",
  multiline = false,
  numeric = false,
  children,
}: {
  productId: number;
  field: "name" | "shortDescription" | "description" | "price";
  value: string | number;
  as?: ElementType;
  className?: string;
  multiline?: boolean;
  numeric?: boolean;
  children?: ReactNode;
}) {
  const { editing, notify } = useEdit();
  const { lang } = useSite();
  const router = useRouter();
  const [version, setVersion] = useState(0);
  const Tag = as;

  if (!editing) return children ? <>{children}</> : <Tag className={className}>{value}</Tag>;

  return (
    <Tag
      key={version}
      className={`${className} edit-hover ${multiline ? "whitespace-pre-line" : ""}`}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" && !multiline) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onPaste={(e: React.ClipboardEvent) => {
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
      }}
      onBlur={async (e: React.FocusEvent<HTMLElement>) => {
        let text = e.currentTarget.innerText.replace(/\u00a0/g, " ").trim();
        if (numeric) text = text.replace(/[٠-٩]/g, (d) => String(AR.indexOf(d))).replace(/[^\d]/g, "");
        if (text !== String(value) && text) {
          try {
            await api(`/api/admin/products/${productId}`, "PATCH", {
              patch: { [lang === "en" && field !== "price" ? `${field}En` : field]: numeric ? Number(text) : text },
            });
            notify("تم الحفظ كمسودة ✓ — اضغط «نشر التغييرات» ليراها الزوار");
            router.refresh();
          } catch (err) {
            notify(err instanceof Error ? err.message : "تعذّر الحفظ", false);
          }
        }
        setVersion((v) => v + 1);
      }}
    >
      {String(value)}
    </Tag>
  );
}
