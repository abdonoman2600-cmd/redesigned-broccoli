import type { Metadata } from "next";
import { getFaqs } from "@/lib/pages";
import PageShell from "@/components/PageShell";
import Editable from "@/components/Editable";

import T from "@/components/T";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "الأسئلة الشائعة" };

export default async function FaqPage() {
  const items = await getFaqs();
  return (
    <PageShell title="الأسئلة الشائعة" editHref="/admin/faqs">
      <div className="space-y-3">
        {items.map((f) => (
          <details key={f.id} className="group rounded-2xl border border-stone-warm bg-white p-6 open:shadow-md">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-bold">
              {f.q}
              <span className="text-2xl text-brass transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-4 whitespace-pre-line leading-8 text-muted">{f.a}</p>
          </details>
        ))}
        {items.length === 0 && <p className="text-center text-muted"><T>لا توجد أسئلة بعد.</T></p>}
      </div>
      <p className="mt-10 text-center text-muted">
        <Editable id="faq.more">لم تجد إجابتك؟ تواصل معنا وسنسعد بمساعدتك.</Editable>
      </p>
    </PageShell>
  );
}
