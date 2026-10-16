import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages";
import PageShell, { Prose } from "@/components/PageShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "من نحن" };

export default async function AboutPage() {
  const page = await getPage("about");
  if (!page) notFound();
  return (
    <PageShell title={page.title}>
      <Prose text={page.body} />
    </PageShell>
  );
}
