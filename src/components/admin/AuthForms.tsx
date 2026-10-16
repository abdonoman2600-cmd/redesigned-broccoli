"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/admin-fetch";
import { btn, inputCls, Notice } from "./ui";

function Shell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[80vh] max-w-md place-items-center px-6 py-16">
      <div className="w-full rounded-3xl border border-stone-warm bg-white p-8 shadow-xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brass font-display text-2xl font-bold text-white">ر</div>
        <h1 className="mt-5 text-center text-3xl font-bold">{title}</h1>
        {sub && <p className="mt-2 text-center text-sm text-muted">{sub}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/login", "POST", { email, password });
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تسجيل الدخول");
      setBusy(false);
    }
  };
  return (
    <Shell title="لوحة تحكم المتجر" sub="للمالك والموظفين المصرّح لهم فقط">
      <form onSubmit={submit} className="space-y-4">
        <input type="email" className={inputCls} dir="ltr" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus />
        <input type="password" className={inputCls} dir="ltr" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        {error && <Notice kind="err">{error}</Notice>}
        <button disabled={busy} className={`${btn} w-full`}>{busy ? "جارٍ الدخول..." : "دخول"}</button>
        <Link href="/admin/recover" className="block text-center text-sm text-brass-dark hover:underline">نسيت كلمة المرور؟</Link>
      </form>
    </Shell>
  );
}

export function RecoverForm({ enabled }: { enabled: boolean }) {
  const [f, setF] = useState({ email: "", key: "", password: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/admin/recover", "POST", f);
      setMsg({ ok: true, text: "تم تعيين كلمة المرور الجديدة. يمكنك تسجيل الدخول الآن." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "تعذّر التنفيذ" });
    }
    setBusy(false);
  };
  return (
    <Shell title="استعادة كلمة المرور" sub="باستخدام مفتاح الاستعادة المحفوظ في إعدادات الاستضافة">
      {!enabled ? (
        <Notice kind="warn">
          الاستعادة غير مفعّلة بعد. أضف متغير البيئة <code dir="ltr">ADMIN_RECOVERY_KEY</code> (١٢ حرفًا على الأقل) في إعدادات الاستضافة ثم أعد تشغيل المتجر. وإن كنت موظفًا فاطلب من المالك رابط إعادة تعيين.
        </Notice>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input type="email" className={inputCls} dir="ltr" placeholder="بريد الحساب" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
          <input type="password" className={inputCls} dir="ltr" placeholder="مفتاح الاستعادة" value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })} required />
          <input type="password" className={inputCls} dir="ltr" placeholder="كلمة المرور الجديدة (٨ أحرف: حروف وأرقام)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required minLength={8} />
          {msg && <Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice>}
          <button disabled={busy} className={`${btn} w-full`}>{busy ? "..." : "تعيين كلمة المرور"}</button>
        </form>
      )}
      <Link href="/admin/login" className="mt-4 block text-center text-sm text-brass-dark hover:underline">العودة لتسجيل الدخول</Link>
    </Shell>
  );
}

export function ResetForm({ token, valid }: { token: string; valid: boolean }) {
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== again) return setMsg({ ok: false, text: "كلمتا المرور غير متطابقتين" });
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/admin/reset", "POST", { token, password });
      setMsg({ ok: true, text: "تم تعيين كلمة المرور بنجاح." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "تعذّر التنفيذ" });
    }
    setBusy(false);
  };
  return (
    <Shell title="تعيين كلمة مرور" sub="اختر كلمة مرور قوية لحسابك">
      {!valid ? (
        <Notice kind="err">هذا الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا من مالك المتجر.</Notice>
      ) : msg?.ok ? (
        <div className="space-y-4">
          <Notice kind="ok">{msg.text}</Notice>
          <Link href="/admin/login" className={`${btn} block text-center`}>تسجيل الدخول</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input type="password" className={inputCls} dir="ltr" placeholder="كلمة المرور الجديدة (٨ أحرف: حروف وأرقام)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
          <input type="password" className={inputCls} dir="ltr" placeholder="تأكيد كلمة المرور" value={again} onChange={(e) => setAgain(e.target.value)} required autoComplete="new-password" />
          {msg && <Notice kind="err">{msg.text}</Notice>}
          <button disabled={busy} className={`${btn} w-full`}>{busy ? "..." : "حفظ"}</button>
        </form>
      )}
    </Shell>
  );
}

export function PasswordChangeForm({ forced = false }: { forced?: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (f.next !== f.again) return setMsg({ ok: false, text: "كلمتا المرور الجديدتان غير متطابقتين" });
    setBusy(true);
    try {
      await api("/api/admin/password", "POST", { current: f.current, next: f.next });
      setMsg({ ok: true, text: "تم تغيير كلمة المرور ✓" });
      setF({ current: "", next: "", again: "" });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "تعذّر التغيير" });
    }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      {forced && <Notice kind="warn">لأمان متجرك يجب تغيير كلمة المرور المؤقتة قبل استخدام لوحة التحكم.</Notice>}
      <input type="password" className={inputCls} dir="ltr" placeholder="كلمة المرور الحالية" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} autoComplete="current-password" required />
      <input type="password" className={inputCls} dir="ltr" placeholder="الجديدة (٨ أحرف: حروف وأرقام)" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} autoComplete="new-password" required minLength={8} />
      <input type="password" className={inputCls} dir="ltr" placeholder="تأكيد الجديدة" value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} autoComplete="new-password" required />
      {msg && <Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice>}
      <button disabled={busy} className={btn}>{busy ? "جارٍ الحفظ..." : "تغيير كلمة المرور"}</button>
    </form>
  );
}
