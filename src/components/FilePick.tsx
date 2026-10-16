"use client";

import type { ReactNode } from "react";

/**
 * A button-looking <label> that opens the system file picker.
 * Using a label + visually-hidden input is the most reliable way across phones/browsers, and the
 * click never gets cancelled by parent handlers (stopPropagation keeps ancestors out of it).
 */
export default function FilePick({
  onFiles,
  multiple = false,
  disabled = false,
  className = "",
  children,
  accept = "image/*",
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  accept?: string;
}) {
  return (
    <label
      className={`${className} ${disabled ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = ""; // allow picking the same file again
          if (files.length) onFiles(files);
        }}
      />
    </label>
  );
}
