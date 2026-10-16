"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { GalleryDTO, ProductDTO } from "@/lib/types";
import { api } from "@/lib/admin-fetch";
import { useEdit } from "./EditProvider";
import ImageUploader from "./admin/ImageUploader";
import { CloseIcon } from "./Icons";

const inputCls =
  "w-full rounded-xl border border-stone-warm bg-white px-4 py-3 outline-none transition focus:border-brass focus:ring-4 focus:ring-brass/15";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      dir="rtl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="animate-fade-in absolute inset-0 bg-ink/60" onClick={onClose} />
      <div className="animate-fade-up relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-ivory text-ink shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-stone-warm px-6 py-4">
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand" aria-label="إغلاق">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function SaveBar({
  busy,
  onSave,
  onDelete,
  error,
  label = "حفظ التعديلات",
}: {
  busy: boolean;
  onSave: () => void;
  onDelete?: () => void;
  error: string;
  label?: string;
}) {
  return (
    <div className="mt-8">
      {error && <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onSave} disabled={busy} className="flex-1 rounded-full bg-ink py-3.5 font-bold text-white transition hover:bg-brass-dark disabled:opacity-60">
          {busy ? "جارٍ الحفظ..." : label}
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} disabled={busy} className="rounded-full border border-red-200 px-6 py-3.5 font-bold text-red-600 hover:bg-red-50">
            حذف
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Product ------------------------------ */

function ProductEditModal({ product: p, onClose, onDeleted }: { product: ProductDTO; onClose: () => void; onDeleted: () => void }) {
  const router = useRouter();
  const { notify } = useEdit();
  const [f, setF] = useState({
    name: p.raw.name,
    nameEn: p.raw.nameEn,
    price: String(p.price),
    compare: p.compareAtPrice ? String(p.compareAtPrice) : "",
    unit: p.unit,
    badge: p.badge ?? "",
    shortDescription: p.raw.shortDescription,
    shortDescriptionEn: p.raw.shortDescriptionEn,
    description: p.raw.description,
    descriptionEn: p.raw.descriptionEn,
    sku: p.sku,
    brand: p.brand,
    stock: p.stock === null ? "" : String(p.stock),
  });
  const [features, setFeatures] = useState(p.features.join("\n"));
  const [images, setImages] = useState(p.images);
  const [flags, setFlags] = useState({ featured: p.featured, available: p.available, newArrival: p.newArrival });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/products/${p.id}`, "PATCH", {
        patch: {
          name: f.name, nameEn: f.nameEn, price: Number(f.price), compareAtPrice: f.compare === "" ? 0 : Number(f.compare),
          unit: f.unit, badge: f.badge, shortDescription: f.shortDescription, shortDescriptionEn: f.shortDescriptionEn,
          description: f.description, descriptionEn: f.descriptionEn, features: features.split("\n"), images,
          sku: f.sku, brand: f.brand, stock: f.stock === "" ? null : Number(f.stock), ...flags,
        },
      });
      notify("تم حفظ المنتج كمسودة ✓ — اضغط «نشر التغييرات» ليراه الزوار");
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
      setBusy(false);
    }
  };

  const del = async () => {
    if (!confirm("حذف هذا المنتج نهائيًا (فورًا)؟ يمكنك إخفاءه بدلًا من حذفه.")) return;
    setBusy(true);
    await api(`/api/admin/products/${p.id}`, "DELETE");
    notify("تم حذف المنتج");
    onDeleted();
    onClose();
  };

  const chk = (k: keyof typeof flags, label: string) => (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-sand p-3 text-sm">
      <input type="checkbox" className="h-4 w-4 accent-[#a97c3f]" checked={flags[k]} onChange={(e) => setFlags((x) => ({ ...x, [k]: e.target.checked }))} />
      <b>{label}</b>
    </label>
  );

  return (
    <Modal title="تعديل المنتج (مسودة)" onClose={onClose}>
      <div className="space-y-5">
        <Field label="الصور (الأولى هي الرئيسية)">
          <ImageUploader multiple value={images} onChange={setImages} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم المنتج (عربي)"><input className={inputCls} value={f.name} onChange={set("name")} /></Field>
          <Field label="Name (English)"><input className={inputCls} dir="ltr" value={f.nameEn} onChange={set("nameEn")} /></Field>
          <Field label="السعر (ج.م)"><input type="number" min={1} className={inputCls} value={f.price} onChange={set("price")} /></Field>
          <Field label="السعر قبل الخصم" hint="فارغ = بدون خصم"><input type="number" min={0} className={inputCls} value={f.compare} onChange={set("compare")} /></Field>
          <Field label="وحدة البيع"><input className={inputCls} value={f.unit} onChange={set("unit")} /></Field>
          <Field label="شارة (مثل: جديد)"><input className={inputCls} value={f.badge} onChange={set("badge")} /></Field>
          <Field label="رقم المنتج (SKU)"><input className={inputCls} dir="ltr" value={f.sku} onChange={set("sku")} /></Field>
          <Field label="العلامة التجارية"><input className={inputCls} value={f.brand} onChange={set("brand")} /></Field>
          <Field label="الكمية المتوفرة" hint="فارغ = غير محدودة"><input type="number" min={0} className={inputCls} value={f.stock} onChange={set("stock")} /></Field>
        </div>
        <Field label="وصف مختصر (عربي)"><input className={inputCls} value={f.shortDescription} onChange={set("shortDescription")} /></Field>
        <Field label="Short description (English)"><input className={inputCls} dir="ltr" value={f.shortDescriptionEn} onChange={set("shortDescriptionEn")} /></Field>
        <Field label="الوصف الكامل (عربي)"><textarea className={`${inputCls} min-h-28`} value={f.description} onChange={set("description")} /></Field>
        <Field label="Full description (English)"><textarea className={`${inputCls} min-h-24`} dir="ltr" value={f.descriptionEn} onChange={set("descriptionEn")} /></Field>
        <Field label="ماذا تشمل؟ (كل نقطة في سطر)"><textarea className={`${inputCls} min-h-20`} value={features} onChange={(e) => setFeatures(e.target.value)} /></Field>
        <div className="grid gap-2 sm:grid-cols-3">
          {chk("available", "متاح للطلب")}
          {chk("featured", "منتج مميز")}
          {chk("newArrival", "وصل حديثًا")}
        </div>
        <Link href={`/admin/products/${p.id}`} className="block text-center text-sm font-bold text-brass-dark hover:underline">
          فتح المحرر الكامل (الألوان والمقاسات والخيارات والأسعار) ←
        </Link>
      </div>
      <SaveBar busy={busy} onSave={save} onDelete={del} error={error} label="حفظ كمسودة" />
    </Modal>
  );
}

export function ProductAdminControls({ product, variant = "card" }: { product: ProductDTO; variant?: "card" | "page" }) {
  const { editing, notify } = useEdit();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!editing) return null;

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const hide = async (e: React.MouseEvent) => {
    stop(e);
    if (!confirm("إخفاء هذا المنتج من المتجر؟ (كمسودة، يُنشر مع باقي التغييرات)")) return;
    await api(`/api/admin/products/${product.id}`, "PATCH", { patch: { active: false } });
    notify("تم الإخفاء كمسودة — اضغط «نشر التغييرات»");
    router.refresh();
  };
  const afterDelete = () => {
    if (variant === "page") router.push("/shop");
    router.refresh();
  };
  const modal = open && <ProductEditModal product={product} onClose={() => setOpen(false)} onDeleted={afterDelete} />;

  if (variant === "page") {
    return (
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-brass/40 bg-brass/10 p-3 text-sm">
        <span className="font-bold text-brass-dark">وضع التعديل:</span>
        <button onClick={() => setOpen(true)} className="rounded-full bg-ink px-4 py-2 font-bold text-white hover:bg-brass-dark">✎ تعديل المنتج والصور</button>
        <button onClick={hide} className="rounded-full border border-ink/20 bg-white px-4 py-2 font-bold hover:bg-sand">إخفاء</button>
        {product.hasDraft && <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-ink">تعديلات غير منشورة</span>}
        <span className="text-xs text-muted">أو اضغط على الاسم والسعر والوصف لتعديلها مباشرة</span>
        {modal}
      </div>
    );
  }

  return (
    <div className="absolute left-3 top-3 z-20 flex gap-1.5" onClick={stop}>
      <button onClick={(e) => { stop(e); setOpen(true); }} className="rounded-full bg-white/95 px-3.5 py-2 text-xs font-bold text-ink shadow-lg ring-1 ring-brass/60 hover:bg-brass hover:text-white">✎ تعديل</button>
      <button onClick={hide} className="rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-ink shadow-lg ring-1 ring-black/10 hover:bg-ink hover:text-white" aria-label="إخفاء المنتج">إخفاء</button>
      {product.hasDraft && <span className="rounded-full bg-amber-400 px-2.5 py-2 text-[11px] font-bold text-ink shadow">مسودة</span>}
      {modal}
    </div>
  );
}

/* ------------------------------ Category ------------------------------ */

type Cat = { id: number; name: string; description: string; image: string; raw: { name: string; description: string; nameEn: string; descriptionEn: string } };

export function CategoryAdminButton({ category }: { category: Cat }) {
  const { editing, notify } = useEdit();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category.raw.name);
  const [nameEn, setNameEn] = useState(category.raw.nameEn);
  const [description, setDescription] = useState(category.raw.description);
  const [descriptionEn, setDescriptionEn] = useState(category.raw.descriptionEn);
  const [image, setImage] = useState(category.image);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!editing) return null;

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/r/categories/${category.id}`, "PUT", { name, nameEn, description, descriptionEn, image });
      notify("تم حفظ القسم ونشره ✓");
      router.refresh();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
    setBusy(false);
  };

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="absolute left-3 top-3 z-20 rounded-full bg-white/95 px-3.5 py-2 text-xs font-bold text-ink shadow-lg ring-1 ring-brass/60 hover:bg-brass hover:text-white"
      >
        ✎ تعديل القسم
      </button>
      {open && (
        <Modal title="تعديل القسم (يُنشر فورًا)" onClose={() => setOpen(false)}>
          <div className="space-y-5">
            <Field label="صورة القسم">
              <div className="max-w-xs"><ImageUploader value={[image]} onChange={(v) => setImage(v[0] ?? image)} /></div>
            </Field>
            <Field label="اسم القسم (عربي)"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Name (English)"><input className={inputCls} dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></Field>
            <Field label="وصف القسم (عربي)"><input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
            <Field label="Description (English)"><input className={inputCls} dir="ltr" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} /></Field>
          </div>
          <SaveBar busy={busy} onSave={save} error={error} label="حفظ ونشر" />
        </Modal>
      )}
    </>
  );
}

/* ------------------------------ Gallery ------------------------------ */

export function GalleryEditModal({ item, onClose }: { item: GalleryDTO; onClose: () => void }) {
  const router = useRouter();
  const { notify } = useEdit();
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [category, setCategory] = useState(item.category);
  const [image, setImage] = useState(item.image);
  const [active, setActive] = useState(item.active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/gallery/${item.id}`, "PUT", { title, description, category, image, active });
      notify("تم الحفظ ✓");
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
      setBusy(false);
    }
  };
  const del = async () => {
    if (!confirm("حذف هذه الصورة نهائيًا من المعرض؟")) return;
    setBusy(true);
    await api(`/api/admin/gallery/${item.id}`, "DELETE");
    notify("تم حذف الصورة");
    router.refresh();
    onClose();
  };

  return (
    <Modal title="تعديل صورة المعرض" onClose={onClose}>
      <div className="space-y-5">
        <Field label="الصورة">
          <div className="max-w-xs">
            <ImageUploader value={[image]} onChange={(v) => setImage(v[0] ?? image)} />
          </div>
        </Field>
        <Field label="العنوان">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="وصف قصير (اختياري)">
          <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="التصنيف">
          <input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="أسقف، جدران، دهانات..." />
        </Field>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-sand p-4">
          <input type="checkbox" className="h-5 w-5 accent-[#a97c3f]" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <b>ظاهرة للزوار</b>
        </label>
      </div>
      <SaveBar busy={busy} onSave={save} onDelete={del} error={error} />
    </Modal>
  );
}
