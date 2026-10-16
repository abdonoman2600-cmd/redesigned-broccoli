"use client";

import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

export type QrLink = {
  id: string;
  title: string;
  /** Path (starts with "/") joined to the base address, or a full https:// link used as-is. */
  target: string;
  note?: string;
  /** Private links: shown with a warning, never to be printed or shared. */
  secret?: boolean;
};

const field =
  "w-full rounded-xl border border-stone-warm bg-white px-4 py-3 text-sm outline-none transition focus:border-brass focus:ring-4 focus:ring-brass/15";

function fileName(id: string, ext: string) {
  return `qr-${id.replace(/[^a-z0-9-]+/gi, "-").slice(0, 40) || "link"}.${ext}`;
}

function download(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function QrCard({ id, title, url, note, secret }: { id: string; title: string; url: string; note?: string; secret?: boolean }) {
  const [png, setPng] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let off = false;
    QRCode.toDataURL(url, { width: 720, margin: 2, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } })
      .then((d) => {
        if (!off) {
          setPng(d);
          setErr("");
        }
      })
      .catch(() => {
        if (!off) {
          setPng("");
          setErr("الرابط طويل جدًا لرمز QR");
        }
      });
    return () => {
      off = true;
    };
  }, [url]);

  const svg = async () => {
    const s = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M" });
    const href = URL.createObjectURL(new Blob([s], { type: "image/svg+xml" }));
    download(href, fileName(id, "svg"));
    setTimeout(() => URL.revokeObjectURL(href), 2000);
  };

  return (
    <article className={`qr-card flex flex-col rounded-3xl border bg-white p-5 print:break-inside-avoid ${secret ? "border-amber-400" : "border-stone-warm"}`}>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {note && <p className="mt-1 text-xs leading-6 text-muted">{note}</p>}
      {secret && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold leading-6 text-amber-900 print:hidden">
          ⚠️ رابط خاص: لا تطبعه ولا تنشره. من يمسحه يصل لما يصل إليه الرابط.
        </p>
      )}
      <div className="mx-auto mt-4 grid aspect-square w-full max-w-[240px] place-items-center rounded-2xl bg-white p-2 ring-1 ring-stone-warm">
        {png ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={png} alt={`رمز QR: ${title}`} className="h-full w-full" />
        ) : (
          <span className="text-center text-xs text-muted">{err || "جارٍ الإنشاء..."}</span>
        )}
      </div>
      <p dir="ltr" className="mt-3 break-all text-center text-[11px] leading-5 text-muted">{url}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold print:hidden">
        <button disabled={!png} onClick={() => download(png, fileName(id, "png"))} className="rounded-full bg-ink py-2.5 text-white transition hover:bg-brass-dark disabled:opacity-40">
          تنزيل PNG
        </button>
        <button disabled={!png} onClick={svg} className="rounded-full border border-ink/20 py-2.5 transition hover:bg-sand disabled:opacity-40">
          تنزيل SVG
        </button>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard blocked */
            }
          }}
          className="col-span-2 rounded-full border border-ink/20 py-2.5 transition hover:bg-sand"
        >
          {copied ? "تم النسخ ✓" : "نسخ الرابط"}
        </button>
      </div>
    </article>
  );
}

export default function QrStudio({ origin, links, warnTemporary }: { origin: string; links: QrLink[]; warnTemporary: boolean }) {
  const [base, setBase] = useState(origin);
  const [custom, setCustom] = useState("");

  const cleanBase = useMemo(() => {
    const b = base.trim().replace(/\/+$/, "");
    return /^https?:\/\/[^\s/]+$/i.test(b) ? b : origin;
  }, [base, origin]);
  const baseValid = base.trim() === "" || cleanBase === base.trim().replace(/\/+$/, "");

  const customUrl = custom.trim();
  const customOk = /^https?:\/\/\S+$/i.test(customUrl);

  return (
    <div className="space-y-8">
      {warnTemporary && (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-7 text-amber-900 print:hidden">
          ⚠️ عنوان المتجر الحالي <b dir="ltr">{origin}</b> مؤقت وقد يتغير. <b>لا تطبع الرموز</b> قبل ربط نطاقك الدائم، وإلا ستتوقف عن العمل. بعد ربط النطاق اكتبه في خانة «عنوان الموقع» أدناه وأعد التنزيل.
        </div>
      )}

      <section className="rounded-3xl border border-stone-warm bg-white p-6 print:hidden">
        <label className="block">
          <span className="mb-2 block text-sm font-bold">عنوان الموقع (للرموز أدناه)</span>
          <input dir="ltr" className={field} value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://rashid-decor.com" />
          <span className={`mt-1 block text-xs ${baseValid ? "text-muted" : "text-red-600"}`}>
            {baseValid ? "تتحدث كل الرموز تلقائيًا عند تغيير العنوان." : "العنوان غير صالح، نستخدم العنوان الحالي. اكتب مثل https://example.com"}
          </span>
        </label>
      </section>

      <section className="rounded-3xl border-2 border-dashed border-brass/50 bg-brass/5 p-6">
        <h2 className="font-display text-xl font-bold print:hidden">حوّل أي رابط إلى QR</h2>
        <p className="mb-4 mt-1 text-sm text-muted print:hidden">الصق أي رابط يبدأ بـ https://. يتم الإنشاء داخل متصفحك ولا يُرسل الرابط لأي خادم ولا يُحفظ.</p>
        <input dir="ltr" className={`${field} print:hidden`} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="https://..." />
        {customUrl && !customOk && <p className="mt-2 text-xs text-red-600">الرابط يجب أن يبدأ بـ http:// أو https:// وبلا مسافات.</p>}
        {customOk && (
          <div className="mt-5 max-w-xs">
            <QrCard id="custom" title="رابطك" url={customUrl} />
          </div>
        )}
      </section>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <QrCard key={l.id} id={l.id} title={l.title} note={l.note} secret={l.secret} url={l.target.startsWith("/") ? cleanBase + l.target : l.target} />
        ))}
      </div>

      <div className="print:hidden">
        <button onClick={() => window.print()} className="rounded-full border border-ink/20 px-7 py-3 font-bold transition hover:bg-sand">🖨 طباعة الصفحة</button>
      </div>
    </div>
  );
}
