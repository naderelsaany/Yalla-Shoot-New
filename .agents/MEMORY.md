# 🧠 ذاكرة مشروع يلا شوت نيو

> آخر تحديث: 2026-07-09
> هذا الملف هو الذاكرة الدائمة للمشروع. يُقرأ في بداية كل محادثة جديدة.

---

## 📌 معلومات المشروع

| المعلومة | القيمة |
|----------|--------|
| اسم المشروع | يلا شوت نيو |
| الاسم بالإنجليزي | Yalla Shoot New |
| المالك | Nader Elsadany |
| النوع | موقع رياضي عربي (RTL) لمتابعة المباريات والأخبار |
| المنافس المباشر | yallasootlive.com |
| الدومين | https://yalla-shoot-new.vercel.app |
| GitHub | https://github.com/naderelsaany/Yalla-Shoot-New |
| الحالة | **✅ Production Ready** |

---

## 🔧 التقنيات (Tech Stack)

| العنصر | التقنية | ملاحظات |
|--------|---------|---------|
| Framework | Next.js 16.2.10 (App Router + Turbopack) | يستخدم `proxy.ts` بدل `middleware.ts` |
| CSS | TailwindCSS v4 | RTL + Dark Mode |
| Database | Supabase (PostgreSQL) | Realtime للمباريات المباشرة |
| Hosting | Vercel | Hobby Plan (مجاني) |
| Analytics | Google Analytics 4 | Measurement ID: G-2P6S4QFBJ2 |
| Search Console | Google Search Console | مفعّل ومتحقق |
| Language | TypeScript | صارم — لا JavaScript عادي |
| Fonts | Cairo + Tajawal | Google Fonts |
| Testing | Playwright | 7 ملفات E2E في `/e2e/` |
| Sanitization | sanitize-html | لحماية محتوى الأخبار من XSS |

---

## 📁 هيكل المشروع

```
yalla-shoot-new/
├── .agents/
│   ├── AGENTS.md              ← قواعد المشروع
│   └── MEMORY.md              ← هذا الملف (الذاكرة)
├── src/
│   ├── app/
│   │   ├── layout.tsx         ← Layout رئيسي (SEO + Analytics + Structured Data)
│   │   ├── page.tsx           ← الصفحة الرئيسية (المباريات)
│   │   ├── not-found.tsx      ← صفحة 404 مخصصة
│   │   ├── error.tsx          ← صفحة خطأ
│   │   ├── robots.ts          ← ملف الزحف
│   │   ├── sitemap.ts         ← خريطة الموقع الديناميكية
│   │   ├── globals.css        ← Design System (CSS Variables)
│   │   ├── icon.png           ← Favicon
│   │   ├── apple-icon.png     ← Apple Touch Icon
│   │   ├── opengraph-image.png← صورة OG
│   │   ├── twitter-image.png  ← صورة Twitter
│   │   ├── match/[slug]/      ← صفحة تفاصيل المباراة
│   │   ├── news/              ← قائمة الأخبار (Paginated)
│   │   ├── news/[slug]/       ← صفحة الخبر
│   │   ├── about/             ← من نحن
│   │   ├── contact/           ← اتصل بنا
│   │   ├── privacy/           ← سياسة الخصوصية
│   │   ├── terms/             ← الشروط والأحكام
│   │   ├── admin/             ← لوحة التحكم (محمية بـ JWT)
│   │   ├── rss.xml/           ← RSS Feed للأخبار
│   │   └── api/               ← API Routes
│   │       ├── admin/         ← إضافة مباريات/أخبار
│   │       └── cron/          ← جلب مباريات/أخبار/ترتيب
│   ├── components/
│   │   ├── Header.tsx         ← الهيدر (Logo + Nav)
│   │   ├── Footer.tsx         ← الفوتر (روابط + حقوق)
│   │   ├── MatchCard.tsx      ← كارت المباراة
│   │   ├── LiveMatchesList.tsx← قائمة المباريات (Realtime)
│   │   ├── LiveScoreTicker.tsx← شريط الأخبار العلوي
│   │   ├── LiveScoreBanner.tsx← بانر النتائج المباشرة
│   │   └── TeamLogo.tsx       ← شعار الفريق (Fallback SVG)
│   ├── lib/
│   │   ├── supabase.ts        ← Supabase Client
│   │   └── translations.ts   ← ترجمة أسماء الفرق والبطولات
│   └── types/
│       └── database.ts        ← TypeScript Types
├── e2e/                       ← اختبارات Playwright E2E
├── supabase/
│   └── schema.sql             ← مخطط قاعدة البيانات
├── public/
│   ├── icon-192.png           ← أيقونة 192px
│   ├── icon-512.png           ← أيقونة 512px
│   └── manifest.json          ← PWA Manifest
├── scripts/
│   └── generate-icons.js      ← سكريبت توليد الأيقونات
├── next.config.ts             ← إعدادات Next.js (Security Headers + Images)
├── playwright.config.ts       ← إعدادات Playwright
├── eslint.config.mjs          ← إعدادات ESLint
└── package.json
```

---

## 🔐 الأمان

- **API Keys:** كلها في Environment Variables (`.env.local`) — ممنوع `NEXT_PUBLIC_` لأي مفتاح سري
- **Admin Auth:** JWT Token — لوحة التحكم محمية
- **XSS Protection:** sanitize-html لمحتوى الأخبار
- **SQL Injection:** استعلامات `.eq()` بدل `.or()` مع interpolation
- **Security Headers:** HSTS + X-Frame-Options + X-Content-Type-Options + Referrer-Policy
- **Rate Limiting:** ممنوع استخدام API بدون حماية

---

## 🔍 السيو (SEO) — الحالة الحالية

| العنصر | الحالة |
|--------|--------|
| Title Template | `%s \| يلا شوت نيو` — كل صفحة فيها اسم الموقع |
| Keywords | 26 كلمة مفتاحية في الصفحة الرئيسية + keywords خاصة لكل صفحة |
| Structured Data | Organization + WebSite + SportsEvent + NewsArticle + BreadcrumbList |
| Open Graph | موجود في كل صفحة |
| Twitter Cards | summary_large_image |
| Canonical URLs | موجود في كل صفحة |
| Sitemap | ديناميكي — كل المباريات والأخبار |
| Robots | يسمح بالزحف — يمنع /admin/ و /api/ |
| RSS Feed | /rss.xml — آخر 20 خبر |
| Google Verification | مفعّل |
| application-name | "يلا شوت نيو" — لظهور الاسم في جوجل |
| category | sports |

---

## ⚠️ قرارات مهمة

1. **Supabase بدل Firebase** — المشروع يستخدم Supabase PostgreSQL مع Realtime
2. **proxy.ts بدل middleware.ts** — Next.js 16.2.10 يستخدم `proxy.ts` حصرياً. **ممنوع** إعادة تسميته لـ `middleware.ts`
3. **كل شيء مجاني** — لا ميزانية. كل الخدمات على باقات مجانية بدون كريديت كارد
4. **الـ slug عربي** — روابط المباريات بالعربي بدل UUID
5. **Dark Mode أولاً** — التصميم مبني على Dark Mode كأساس

---

## 🚫 ممنوعات

- ممنوع إعادة تسمية `proxy.ts` لـ `middleware.ts`
- ممنوع استخدام خدمات مدفوعة
- ممنوع رفع ملفات مؤقتة أو سكريبتات اختبار على GitHub
- ممنوع نسخ محتوى حرفياً من أي مصدر
- ممنوع تعديل `.env.local` بدون إذن المالك

---

## 📊 الأوامر المهمة

```bash
npm run dev          # تشغيل السيرفر محلياً
npm run build        # بناء المشروع للإنتاج
npm run lint         # فحص ESLint
npx playwright test  # تشغيل اختبارات E2E
```
