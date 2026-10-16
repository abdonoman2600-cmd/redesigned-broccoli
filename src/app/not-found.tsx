import Link from "next/link";

import T from "@/components/T";
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
      <div className="font-display text-8xl font-bold text-brass"><T>٤٠٤</T></div>
      <h1 className="mt-4 text-3xl font-bold"><T>الصفحة غير موجودة</T></h1>
      <p className="mt-3 text-muted"><T>يبدو أن الرابط الذي تبحث عنه غير متاح أو تم نقله.</T></p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="rounded-full bg-ink px-8 py-3.5 font-bold text-white hover:bg-brass-dark">
          <T>الرئيسية</T>
        </Link>
        <Link href="/shop" className="rounded-full border border-ink/20 px-8 py-3.5 font-bold hover:bg-sand">
          <T>المتجر</T>
        </Link>
      </div>
    </div>
  );
}
