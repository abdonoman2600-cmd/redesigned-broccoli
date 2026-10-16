# متجر رشيد للديكور والجبس بورد

متجر Next.js 16 (App Router) + PostgreSQL (Drizzle ORM). الواجهة عربية (RTL) مع إنجليزية، ولوحة تحكم للمالك على `/admin`.

> الكود فقط هو ما يُحفظ على GitHub. **المنتجات والطلبات والصور المرفوعة والإعدادات توجد في قاعدة البيانات**، فاحتفظ بنسخة احتياطية منها من `/admin/backup`.

## التشغيل محليًا

```bash
npm install
cp .env.example .env        # ثم اكتب DATABASE_URL (قاعدة PostgreSQL فارغة)
DATABASE_URL="postgresql://..." npx drizzle-kit push --config=drizzle.prod.config.ts
npm run dev
```

عند أول زيارة على قاعدة فارغة تُنشأ بيانات البداية (المنتجات والأقسام والصفحات) وحساب المالك تلقائيًا.

## المتغيرات المطلوبة

انظر `.env.example`. المطلوب: `DATABASE_URL`. وللمالك: `OWNER_EMAIL` و`ADMIN_PASSWORD` (يُجبر على تغييرها عند أول دخول).

## النشر

1. أنشئ قاعدة PostgreSQL على مزوّد (Neon / Railway / Render).
2. أنشئ الجداول: `DATABASE_URL="..." npx drizzle-kit push --config=drizzle.prod.config.ts`
3. اربط المستودع بمنصة الاستضافة، وأضف المتغيرات (يجب أن يكون `DATABASE_URL` متاحًا أثناء **البناء** أيضًا).
4. Build: `npm run build` — Start: `npm run start`.
5. افتح `/admin/login`، ثم استرجع نسختك الاحتياطية من `/admin/backup` إن كان لديك بيانات سابقة.

## أوامر مفيدة

```bash
npm run build        # بناء الإنتاج
npm run typecheck    # فحص الأنواع
```
