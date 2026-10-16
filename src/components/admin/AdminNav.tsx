"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/admin-fetch";

export type NavLink = { href: string; label: string };
export type NavGroup = { title: string; links: NavLink[] };

export default function AdminNav({ groups, userName, unread }: { groups: NavGroup[]; userName: string; unread: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  };
  const active = (h: string) => (h === "/admin" ? pathname === "/admin" : pathname.startsWith(h));
  const all = groups.flatMap((g) => g.links);

  return (
    <>
      {/* top bar */}
      <div className="sticky top-0 z-40 border-b print:hidden border-stone-warm bg-ivory/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <span className="font-display text-xl font-bold">لوحة رشيد</span>
          <span className="hidden text-sm text-muted sm:inline">· {userName}</span>
          <div className="flex-1" />
          <Link href="/admin/notifications" className="relative rounded-full px-3 py-2 text-sm font-bold hover:bg-sand">
            🔔
            {unread > 0 && <span className="absolute -end-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] text-white">{unread}</span>}
          </Link>
          <Link href="/" className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-brass-dark">عرض / تعديل المتجر ↗</Link>
          <button onClick={logout} className="text-sm text-muted hover:text-red-600">خروج</button>
        </div>
        {/* mobile tabs */}
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:hidden">
          {all.map((l) => (
            <Link key={l.href} href={l.href} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${active(l.href) ? "bg-ink text-white" : "bg-sand"}`}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      {/* desktop sidebar */}
      <aside className="fixed bottom-0 top-[57px] hidden print:!hidden w-64 overflow-y-auto border-e border-stone-warm bg-white p-4 lg:block">
        {groups.map((g) => (
          <div key={g.title} className="mb-5">
            <p className="mb-1.5 px-3 text-xs font-bold text-muted">{g.title}</p>
            {g.links.map((l) => (
              <Link key={l.href} href={l.href} className={`block rounded-xl px-3 py-2 text-sm font-bold transition ${active(l.href) ? "bg-ink text-white" : "hover:bg-sand"}`}>
                {l.label}
              </Link>
            ))}
          </div>
        ))}
        <button
          onClick={async () => {
            await api("/api/admin/notifications", "POST", {});
            router.refresh();
          }}
          className="hidden"
          aria-hidden
        />
      </aside>
    </>
  );
}
