"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ReviewDTO } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";
import Stars from "./Stars";
import { CheckIcon, StarIcon } from "./Icons";
import { useEdit } from "./EditProvider";
import { api } from "@/lib/admin-fetch";

import T from "@/components/T";
export default function Reviews({
  productId,
  reviews,
  rating,
}: {
  productId: number;
  reviews: ReviewDTO[];
  rating: number;
}) {
  const router = useRouter();
  const { editing, notify } = useEdit();
  const [showForm, setShowForm] = useState(false);
  const [visible, setVisible] = useState(4);
  const [stars, setStars] = useState(5);
  const [hover, setHover] = useState(0);
  const [author, setAuthor] = useState("");
  const [city, setCity] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const dist = useMemo(() => {
    const d = [0, 0, 0, 0, 0];
    reviews.forEach((r) => (d[r.rating - 1] += 1));
    return d;
  }, [reviews]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating: stars, author, city, title, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذّر إرسال التقييم");
      setDone(true);
      setShowForm(false);
      setAuthor("");
      setCity("");
      setTitle("");
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-xl border border-stone-warm bg-white px-4 py-3 outline-none transition focus:border-brass focus:ring-4 focus:ring-brass/15";

  return (
    <div id="reviews" className="scroll-mt-28">
      <div className="grid gap-10 md:grid-cols-[280px_1fr]">
        <div>
          <div className="rounded-3xl bg-sand p-7 text-center">
            <div className="font-display text-6xl font-bold">{formatNumber(rating)}</div>
            <Stars rating={rating} size={22} className="mt-2" />
            <p className="mt-2 text-sm text-muted"><T>بناءً على</T> {formatNumber(reviews.length)} <T>تقييم</T></p>
          </div>
          <ul className="mt-6 space-y-2.5">
            {[5, 4, 3, 2, 1].map((s) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span className="flex w-6 items-center gap-1">
                  {formatNumber(s)}
                  <StarIcon width={12} height={12} className="text-brass" />
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-warm">
                  <span
                    className="block h-full rounded-full bg-brass transition-all duration-700"
                    style={{ width: `${reviews.length ? (dist[s - 1] / reviews.length) * 100 : 0}%` }}
                  />
                </span>
                <span className="w-6 text-muted">{formatNumber(dist[s - 1])}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setDone(false);
            }}
            className="mt-7 w-full rounded-full border border-ink py-3.5 font-bold transition hover:bg-ink hover:text-white"
          >
            <T>{showForm ? "إلغاء" : "اكتب تقييمك"}</T>
          </button>
        </div>

        <div>
          {done && (
            <div className="animate-fade-up mb-6 flex items-center gap-3 rounded-2xl bg-green-50 px-5 py-4 text-green-800">
              <CheckIcon /> <T>شكرًا لك! تم نشر تقييمك.</T>
            </div>
          )}

          {showForm && (
            <form onSubmit={submit} className="animate-fade-up mb-8 space-y-4 rounded-3xl border border-stone-warm bg-white p-6">
              <h3 className="font-display text-xl font-bold"><T>شاركنا تجربتك</T></h3>
              <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onMouseEnter={() => setHover(s)}
                    onClick={() => setStars(s)}
                    aria-label={`${s} نجوم`}
                    className={`transition hover:scale-110 ${s <= (hover || stars) ? "text-brass" : "text-stone-warm"}`}
                  >
                    <StarIcon width={30} height={30} />
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className={input} placeholder="الاسم *" value={author} onChange={(e) => setAuthor(e.target.value)} required maxLength={60} />
                <input className={input} placeholder="المدينة" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} />
              </div>
              <input className={input} placeholder="عنوان التقييم" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
              <textarea
                className={`${input} min-h-28`}
                placeholder="اكتب تعليقك هنا... *"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                minLength={10}
                maxLength={1200}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                disabled={busy}
                className="rounded-full bg-ink px-8 py-3.5 font-bold text-white transition hover:bg-brass-dark disabled:opacity-60"
              >
                <T>{busy ? "جارٍ الإرسال..." : "نشر التقييم"}</T>
              </button>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="rounded-2xl bg-sand p-8 text-center text-muted"><T>لا توجد تقييمات بعد. كن أول من يقيّم هذا المنتج!</T></p>
          ) : (
            <ul className="divide-y divide-stone-warm">
              {reviews.slice(0, visible).map((r) => (
                <li key={r.id} className="py-7 first:pt-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-brass/90 font-bold text-white">
                        {r.author.charAt(0)}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold">{r.author}</span>
                          {r.verified && (
                            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                              <CheckIcon width={12} height={12} /> <T>عميل موثّق</T>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted">
                          {r.city && `${r.city} · `}
                          {formatDate(r.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Stars rating={r.rating} size={16} />
                      {editing && (
                        <button
                          onClick={async () => {
                            if (!confirm("حذف هذا التقييم نهائيًا؟")) return;
                            try {
                              await api(`/api/admin/reviews/${r.id}`, "DELETE");
                              notify("تم حذف التقييم");
                              router.refresh();
                            } catch {
                              notify("تعذّر الحذف", false);
                            }
                          }}
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                          <T>حذف التقييم</T>
                        </button>
                      )}
                    </div>
                  </div>
                  <h4 className="mt-4 font-bold">{r.title}</h4>
                  <p className="mt-1.5 leading-8 text-charcoal/90">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
          {visible < reviews.length && (
            <button
              onClick={() => setVisible((v) => v + 4)}
              className="mt-4 w-full rounded-full border border-stone-warm py-3.5 font-bold transition hover:bg-sand"
            >
              <T>عرض المزيد من التقييمات</T>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
