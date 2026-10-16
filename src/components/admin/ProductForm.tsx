"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ImageUploader from "./ImageUploader";
import { PlusIcon, TrashIcon } from "../Icons";
import { api } from "@/lib/admin-fetch";
import type { ProductOption } from "@/lib/types";
import { btn, card, inputCls, Label, Notice } from "./ui";

export type ProductFormValues = {
  id?: number;
  slug: string;
  name: string;
  nameEn: string;
  shortDescription: string;
  shortDescriptionEn: string;
  description: string;
  descriptionEn: string;
  categoryId: number;
  price: number;
  compareAtPrice: number | null;
  unit: string;
  minQty: number;
  step: number;
  images: string[];
  options: ProductOption[];
  optionsLabel: string;
  features: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  badge: string | null;
  featured: boolean;
  active: boolean;
  available: boolean;
  newArrival: boolean;
  leadTime: string;
  sku: string;
  brand: string;
  stock: number | null;
};

export default function ProductForm({ initial, categories }: { initial: ProductFormValues; categories: { id: number; name: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [featuresText, setFeaturesText] = useState(initial.features.join("\n"));
  const [sizesText, setSizesText] = useState(initial.sizes.join("، "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isNew = !initial.id;
  const set = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) => setV((x) => ({ ...x, [k]: val }));
  const num = (k: "price" | "minQty" | "step") => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { ...v, features: featuresText.split("\n"), sizes: sizesText.split(/[،,\n]/).map((s) => s.trim()).filter(Boolean) };
      if (isNew) await api("/api/admin/products", "POST", payload);
      else await api(`/api/admin/products/${initial.id}`, "PUT", payload);
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر الحفظ");
      setBusy(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const remove = async () => {
    if (!confirm("هل تريد حذف هذا المنتج نهائيًا؟ (يمكنك إخفاءه بدلًا من حذفه)")) return;
    setBusy(true);
    await api(`/api/admin/products/${initial.id}`, "DELETE");
    router.push("/admin/products");
    router.refresh();
  };

  const chk = (k: "active" | "available" | "featured" | "newArrival", title: string, sub: string) => (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-sand p-4">
      <input type="checkbox" className="h-5 w-5 accent-[#a97c3f]" checked={v[k]} onChange={(e) => set(k, e.target.checked)} />
      <span><b className="block">{title}</b><span className="text-xs text-muted">{sub}</span></span>
    </label>
  );

  return (
    <form onSubmit={save} className="space-y-6">
      {error && <Notice kind="err">{error}</Notice>}

      <section className={card}>
        <h2 className="font-display text-2xl font-bold">الصور</h2>
        <p className="mb-5 mt-1 text-sm text-muted">أول صورة هي الرئيسية. رتّب الصور بالأسهم. الصور تُصغَّر تلقائيًا قبل الرفع.</p>
        <ImageUploader multiple value={v.images} onChange={(imgs) => set("images", imgs)} />
      </section>

      <section className={`${card} grid gap-5 md:grid-cols-2`}>
        <h2 className="font-display text-2xl font-bold md:col-span-2">المعلومات الأساسية</h2>
        <Label label="اسم المنتج (عربي) *"><input className={inputCls} value={v.name} onChange={(e) => set("name", e.target.value)} required /></Label>
        <Label label="Product name (English)"><input className={inputCls} dir="ltr" value={v.nameEn} onChange={(e) => set("nameEn", e.target.value)} /></Label>
        <Label label="التصنيف *">
          <select className={inputCls} value={v.categoryId} onChange={(e) => set("categoryId", Number(e.target.value))}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Label>
        <Label label="العلامة التجارية"><input className={inputCls} value={v.brand} onChange={(e) => set("brand", e.target.value)} /></Label>
        <Label label="رقم المنتج (SKU)" hint="يُستخدم لمطابقة المنتجات عند الاستيراد"><input className={inputCls} dir="ltr" value={v.sku} onChange={(e) => set("sku", e.target.value)} /></Label>
        <Label label="شارة (اختياري)" hint="مثل: جديد، الأكثر مبيعًا، خصم ١٠٪"><input className={inputCls} value={v.badge ?? ""} onChange={(e) => set("badge", e.target.value)} /></Label>
        <Label label="وصف مختصر (عربي)" className="md:col-span-2"><input className={inputCls} value={v.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} /></Label>
        <Label label="Short description (English)" className="md:col-span-2"><input className={inputCls} dir="ltr" value={v.shortDescriptionEn} onChange={(e) => set("shortDescriptionEn", e.target.value)} /></Label>
        <Label label="الوصف الكامل (عربي)" hint="اترك سطرًا فارغًا بين الفقرات" className="md:col-span-2"><textarea className={`${inputCls} min-h-36`} value={v.description} onChange={(e) => set("description", e.target.value)} /></Label>
        <Label label="Full description (English)" className="md:col-span-2"><textarea className={`${inputCls} min-h-28`} dir="ltr" value={v.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} /></Label>
        <Label label="ماذا تشمل الخدمة؟ (كل نقطة في سطر)" className="md:col-span-2"><textarea className={`${inputCls} min-h-28`} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} /></Label>
      </section>

      <section className={`${card} grid gap-5 md:grid-cols-3`}>
        <h2 className="font-display text-2xl font-bold md:col-span-3">السعر والمخزون</h2>
        <Label label="السعر (ج.م) *"><input type="number" min={1} className={inputCls} value={v.price || ""} onChange={num("price")} required /></Label>
        <Label label="السعر قبل الخصم" hint="اتركه فارغًا إن لم يوجد خصم"><input type="number" min={0} className={inputCls} value={v.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)} /></Label>
        <Label label="وحدة البيع" hint="م² ، متر طولي ، قطعة ..."><input className={inputCls} value={v.unit} onChange={(e) => set("unit", e.target.value)} /></Label>
        <Label label="الكمية المتوفرة" hint="اتركه فارغًا إذا كانت غير محدودة"><input type="number" min={0} className={inputCls} value={v.stock ?? ""} onChange={(e) => set("stock", e.target.value === "" ? null : Number(e.target.value))} /></Label>
        <Label label="الحد الأدنى للكمية"><input type="number" min={1} className={inputCls} value={v.minQty} onChange={num("minQty")} /></Label>
        <Label label="خطوة الزيادة"><input type="number" min={1} className={inputCls} value={v.step} onChange={num("step")} /></Label>
        <Label label="مدة التنفيذ / التجهيز" className="md:col-span-3"><input className={inputCls} value={v.leadTime} onChange={(e) => set("leadTime", e.target.value)} /></Label>
      </section>

      <section className={card}>
        <h2 className="font-display text-2xl font-bold">الألوان والمقاسات</h2>
        <p className="mb-5 mt-1 text-sm text-muted">إن أضفت ألوانًا أو مقاسات فسيُطلب من العميل اختيارها قبل الإضافة للسلة.</p>
        <div className="space-y-3">
          {v.colors.map((c, i) => (
            <div key={i} className="flex gap-3">
              <input type="color" value={c.hex} onChange={(e) => set("colors", v.colors.map((x, k) => (k === i ? { ...x, hex: e.target.value } : x)))} className="h-12 w-14 shrink-0 cursor-pointer rounded-xl border border-stone-warm bg-white p-1" aria-label="اللون" />
              <input className={inputCls} placeholder="اسم اللون (أبيض، رمادي...)" value={c.name} onChange={(e) => set("colors", v.colors.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
              <button type="button" onClick={() => set("colors", v.colors.filter((_, k) => k !== i))} className="grid w-12 shrink-0 place-items-center rounded-xl border border-stone-warm text-muted hover:text-red-600" aria-label="حذف"><TrashIcon width={18} height={18} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set("colors", [...v.colors, { name: "", hex: "#cccccc" }])} className="mt-4 flex items-center gap-2 text-sm font-bold text-brass-dark hover:underline"><PlusIcon width={16} height={16} /> إضافة لون</button>
        <Label label="المقاسات (افصل بفاصلة)" className="mt-6"><input className={inputCls} value={sizesText} onChange={(e) => setSizesText(e.target.value)} placeholder="صغير، متوسط، كبير" /></Label>
      </section>

      <section className={card}>
        <h2 className="font-display text-2xl font-bold">خيارات أخرى بسعر مختلف</h2>
        <p className="mb-5 mt-1 text-sm text-muted">مثل: مستوى التشطيب، نوع الألواح. الزيادة تُضاف على السعر الأساسي.</p>
        <Label label="عنوان الخيارات" className="mb-5 max-w-sm"><input className={inputCls} value={v.optionsLabel} onChange={(e) => set("optionsLabel", e.target.value)} /></Label>
        <div className="space-y-3">
          {v.options.map((o, i) => (
            <div key={i} className="flex gap-3">
              <input className={inputCls} placeholder="اسم الخيار" value={o.label} onChange={(e) => set("options", v.options.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
              <input type="number" className={`${inputCls} max-w-36`} placeholder="زيادة السعر" value={o.priceDelta} onChange={(e) => set("options", v.options.map((x, k) => (k === i ? { ...x, priceDelta: Number(e.target.value) } : x)))} />
              <button type="button" onClick={() => set("options", v.options.filter((_, k) => k !== i))} className="grid w-12 shrink-0 place-items-center rounded-xl border border-stone-warm text-muted hover:text-red-600" aria-label="حذف الخيار"><TrashIcon width={18} height={18} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set("options", [...v.options, { label: "", priceDelta: 0 }])} className="mt-4 flex items-center gap-2 text-sm font-bold text-brass-dark hover:underline"><PlusIcon width={16} height={16} /> إضافة خيار</button>
      </section>

      <section className={`${card} grid gap-4 md:grid-cols-2`}>
        <h2 className="font-display text-2xl font-bold md:col-span-2">الظهور والتوفر</h2>
        {chk("active", "ظاهر في المتجر", "أوقفه لإخفاء المنتج دون حذفه")}
        {chk("available", "متاح للطلب", "عند الإيقاف يظهر «غير متاح» ولا يمكن شراؤه")}
        {chk("featured", "منتج مميز", "يظهر في قسم المنتجات المميزة")}
        {chk("newArrival", "وصل حديثًا", "يظهر في قسم الجديد أولًا")}
        <Label label="رابط المنتج (إنجليزي)" hint="اتركه فارغًا ليُنشأ تلقائيًا" className="md:col-span-2"><input className={inputCls} dir="ltr" value={v.slug} onChange={(e) => set("slug", e.target.value)} placeholder="my-product" /></Label>
      </section>

      <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-full border border-stone-warm bg-white/95 p-3 shadow-xl backdrop-blur">
        <button disabled={busy} className={`${btn} flex-1`}>{busy ? "جارٍ الحفظ..." : isNew ? "إضافة المنتج" : "حفظ ونشر التعديلات"}</button>
        {!isNew && <button type="button" onClick={remove} disabled={busy} className="rounded-full border border-red-200 px-6 py-3.5 font-bold text-red-600 hover:bg-red-50">حذف</button>}
      </div>
    </form>
  );
}
