import type { ReactNode } from "react";
import Link from "next/link";
import { getView } from "@/lib/mode";
import { can } from "@/lib/admin-auth";

export default async function PageShell({ title, children, editHref = "/admin/pages" }: { title: string; children: ReactNode; editHref?: string }) {
  const view = await getView();
  const canEdit = view.canEdit && can(view.user, "content");
  return (
    <>
      <section className="relative overflow-hidden bg-sand">
        <div className="pattern-dots absolute inset-0 opacity-70" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center md:py-20">
          <h1 className="animate-fade-up text-4xl font-bold md:text-6xl">{title}</h1>
          {canEdit && (
            <Link href={editHref} className="mt-5 inline-block rounded-full bg-brass px-5 py-2 text-sm font-bold text-white hover:bg-brass-dark">
              ✎ تعديل هذه الصفحة
            </Link>
          )}
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-14">{children}</section>
    </>
  );
}

export function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-5 text-lg leading-9 text-charcoal/90">
      {text.split(/\n\s*\n/).map((para, i) => (
        <p key={i} className="whitespace-pre-line">{para}</p>
      ))}
    </div>
  );
}
