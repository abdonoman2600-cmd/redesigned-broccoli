"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/admin-fetch";

type Toast = { text: string; ok: boolean } | null;
type Mode = "edit" | "preview" | "live";

type Ctx = {
  isAdmin: boolean;
  userName: string;
  editing: boolean;
  mode: Mode;
  viewerPreview: boolean;
  draftCount: number;
  content: Record<string, string>;
  save: (key: string, value: string) => Promise<boolean>;
  toast: Toast;
  notify: (text: string, ok?: boolean) => void;
};

const EditContext = createContext<Ctx>({
  isAdmin: false,
  userName: "",
  editing: false,
  mode: "live",
  viewerPreview: false,
  draftCount: 0,
  content: {},
  save: async () => false,
  toast: null,
  notify: () => {},
});

export function EditProvider({
  user,
  mode,
  viewerPreview,
  draftCount,
  content,
  children,
}: {
  user: { name: string } | null;
  mode: Mode;
  viewerPreview: boolean;
  draftCount: number;
  content: Record<string, string>;
  children: ReactNode;
}) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, string | null>>({});
  const [toast, setToast] = useState<Toast>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((text: string, ok = true) => {
    setToast({ text, ok });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const merged = useMemo(() => {
    const out: Record<string, string> = { ...content };
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) delete out[k];
      else out[k] = v;
    }
    return out;
  }, [content, overrides]);

  const save = useCallback(
    async (key: string, value: string) => {
      setOverrides((o) => ({ ...o, [key]: value === "" ? null : value }));
      try {
        await api("/api/admin/content", "PUT", { key, value });
        notify("تم الحفظ كمسودة ✓ — اضغط «نشر التغييرات» ليراها الزوار");
        router.refresh();
        return true;
      } catch (e) {
        setOverrides((o) => {
          const n = { ...o };
          delete n[key];
          return n;
        });
        notify(e instanceof Error ? e.message : "تعذّر الحفظ", false);
        return false;
      }
    },
    [notify, router],
  );

  const value = useMemo<Ctx>(
    () => ({
      isAdmin: !!user,
      userName: user?.name ?? "",
      editing: !!user && mode === "edit",
      mode,
      viewerPreview,
      draftCount,
      content: merged,
      save,
      toast,
      notify,
    }),
    [user, mode, viewerPreview, draftCount, merged, save, toast, notify],
  );

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
}

export const useEdit = () => useContext(EditContext);
