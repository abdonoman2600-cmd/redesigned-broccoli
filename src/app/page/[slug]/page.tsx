import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages";
import PageShell, { Prose } from "@/components/PageShell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = await getPage((await params).slug);
  return { title: page?.title ?? "الصفحة غير موجودة" };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = await getPage((await params).slug);
  if (!page) notFound();
  return (
    <PageShell title={page.title}>
      <Prose text={page.body} />
    </PageShell>
  );
}
