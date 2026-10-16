"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/admin-fetch";
import { btnGhost } from "./ui";

export default function MarkRead() {
  const router = useRouter();
  return (
    <button onClick={async () => { await api("/api/admin/notifications", "POST", {}); router.refresh(); }} className={btnGhost}>تعليم الكل كمقروء</button>
  );
}
