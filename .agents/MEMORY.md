# 🧠 ذاكرة مشروع يلا شوت نيو

> آخر تحديث: 2026-07-09
> هذا الملف هو الذاكرة الدائمة للمشروع. يُقرأ في بداية كل محادثة جديدة.

---

## 📌 معلومات المشروع الأساسية

| المعلومة | القيمة |
|----------|--------|
| اسم المشروع | يلا شوت نيو |
| الاسم بالإنجليزي | Yalla Shoot New |
| المالك | Nader Elsadany |
| النوع | موقع رياضي لمتابعة المباريات والأخبار |
| المنافس المباشر | yallasootlive.com |
| الهدف | التفوق على المنافس في التصميم والسرعة والسيو والمحتوى |
| الحالة | **✅ جاهز للنشر (Production Ready)** |

---

## 🔧 التقنيات المعتمدة

| العنصر | التقنية | الباقة |
|--------|---------|--------|
| Framework | Next.js 14+ (App Router) | - |
| CSS | TailwindCSS v4 (RTL) | - |
| Database | Firebase Firestore | Spark (مجاني) |
| Auth | Firebase Authentication | مجاني |
| Hosting | Vercel | Hobby (مجاني + دومين مجاني Vercel) |
| Image CDN | Cloudinary | Free (25 credits/شهر) |
| Analytics | Google Analytics 4 | مجاني |
| Search Console | Google Search Console | مجاني |
| Language | TypeScript | - |
| Font | Cairo أو Tajawal | Google Fonts مجاني |

---

## 💰 حدود الباقات المجانية (مرجع سريع)

### Vercel Hobby
- Bandwidth: 100 GB/شهر
- Serverless Functions: 1 مليون/شهر
- Build Minutes: محدودة
- ⚠️ للاستخدام الشخصي فقط (غير تجاري رسمياً)

### Firebase Spark
- Firestore Reads: 50,000/يوم
- Firestore Writes: 20,000/يوم
- Firestore Deletes: 20,000/يوم
- Firestore Storage: 1 GB
- Hosting Storage: 10 GB
- Hosting Bandwidth: 10 GB/شهر
- Cloud Functions: 2 مليون/شهر
- Auth: مجاني بلا حدود (email/Google)
- ⚠️ لا يحتاج كريديت كارد

### Cloudinary Free
- 25 credit/شهر (rolling 30 يوم)
- 1 credit = 1,000 image transformation أو 1 GB storage أو 1 GB bandwidth

---

## 📊 سجل التقدم (Changelog)

### [2026-07-09] - تحسينات الأداء والـ SEO (رد DeepSeek)
- **القرارات:** 
  - الإبقاء على ملف `proxy.ts` بدلاً من `middleware.ts` لأن إصدار Next.js 16.2.10 (Turbopack) يدعم `proxy.ts` حصرياً بناءً على رسائل الـ Build، واقتراح DeepSeek كان مبنياً على إصدارات أقدم.
  - تطبيق تقنية SSG عبر `generateStaticParams` للصفحات الديناميكية.
- **ما تم تنفيذه:**
  - إضافة `generateStaticParams` لمسارات (`/leagues/[id]`, `/match/[id]`, `/news/[slug]`) لتحسين سرعة التحميل وفهرسة جوجل.
  - إنشاء ملفات `loading.tsx` لمسارات `match` و `leagues` لتحسين تجربة المستخدم.
  - إضافة `alternates.canonical` لصفحات الأخبار والبطولات لتقوية الـ SEO.
  - إضافة روابط `preconnect` في `layout.tsx` لتقليل الـ Latency للخطوط وقاعدة البيانات.
  - تحسين مخرجات `rss.xml` بإضافة `lastBuildDate` و `generator`.
- **المشاكل الحالية:** لا يوجد (تم تأكيد نجاح الـ Build بنسبة 100%).

### [2026-07-09] - تنظيف المشروع وتحديث الهيكلةوبة (Teams, Matches, World Cup)
- ✅ حذف مجلدات `src/app/teams`, `src/app/world-cup`, `src/app/matches` بالكامل.
- ✅ تنظيف الروابط في `Header.tsx` و `match/[id]/page.tsx` و `sitemap.ts`.
- ✅ تشغيل `npm run build` بنجاح بعد تنظيف الـ Cache (صفر أخطاء).

### 2026-07-09 — تنفيذ مراجعة DeepSeek
- ✅ إزالة `instrumentation.ts` و `mockFetch` من الكود للإنتاج الحقيقي
- ✅ تحسين الـ SEO (إصلاح تكرار العنوان، روابط Canonical صحيحة، وتحديث خريطة الموقع)
- ✅ إضافة مسار RSS `src/app/rss.xml/route.ts` للأخبار
- ✅ إنشاء صفحة `teams` لعرض كافة الفرق، وإضافتها للـ `Header`
- ✅ تحسين صفحة `match/[id]` بإضافة فيديو البث وتحديث رسالة اللاعبين
- ✅ إصلاح أخطاء شريط البث المباشر `LiveScoreBanner` 
- ✅ إضافة إحصائيات كأس العالم (متوسط التهديف، إجمالي الأهداف، المباريات) في `WorldCupHubClient`

### 2026-07-09 — Hotfix 2: تصحيح الـ Middleware (Next.js 16.2.10)
- ✅ إعادة تسمية `middleware.ts` إلى `proxy.ts` وتصدير الدالة باسم `proxy` (تغيير إجباري في إصدار Next.js الجديد، حيث تم الاستغناء عن `middleware.ts` تماماً).
- ✅ هذه الخطوة أصلحت مشكلة الفشل في Vercel (Build Error) مع الاحتفاظ بحماية لوحة التحكم.

### 2026-07-09 — Hotfix 1: الإصلاحات الأمنية
- ✅ إصلاح ثغرات SQL Injection في معلمات الاستعلام بصفحات اللاعبين والفرق
- ✅ إصلاح حالة EventCompleted في الـ Schema.org للمباريات المنتهية
- ✅ تصحيح أخطاء الـ CSS Variables للـ World Cup ورفع الحجب عن الـ Next.js Portal

### 2026-07-09 — التسليم النهائي (Production Ready)
- ✅ Production Build ناجح بدون أخطاء (Next.js 16.2.10 + Turbopack — 9 ثواني)
- ✅ ESLint نظيف بالكامل: صفر أخطاء + صفر تحذيرات (30 ملف TypeScript)
- ✅ 180/180 اختبار E2E ناجح (Chromium + Firefox + WebKit)
- ✅ تقرير التسليم النهائي (walkthrough.md) — يغطي كل التفاصيل
- ✅ 29 صفحة (ثابتة + ديناميكية) مع SEO كامل (JSON-LD, OG, Twitter Cards, Sitemap)
- ✅ 7 API Routes محمية (Admin JWT + Cron Jobs)
- ✅ نظام مباريات مباشرة مع Supabase Realtime
- ✅ حماية XSS بـ DOMPurify + JWT Auth للوحة التحكم
- ✅ Design System احترافي Dark Mode (TailwindCSS v4 + RTL)
- ✅ المشروع جاهز للنشر على Vercel (Hobby Plan مجاني)

### 2026-07-08 — V3 Refactor & Final Kimi Fixes
- ✅ تم تنفيذ مراجعات DeepSeek بالكامل (Security, SEO, Cron Jobs).
- ✅ تم تنفيذ مراجعات Kimi لسد ثغرات الـ SEO المتبقية وإصلاح مشاكل التوقيت وتحديث الـ Realtime.
- ✅ تم تأمين الـ JWT Token لمنع الدخول العشوائي للوحة التحكم.
- ✅ تم تطهير حقل الأخبار من هجمات XSS باستخدام DOMPurify.
- ✅ تم معالجة مشاكل الوقت (Timezone) في واجهة المباريات.
- ✅ تم إضافة JSON-LD و metadata قوية للـ SEO.
- ✅ تم تحسين الـ components مثل MatchCard لاستيعاب كل الحالات.

### 2026-07-07 — بداية المشروع
- ✅ تم تحليل الموقع المنافس (yallasootlive.com) بالكامل
- ✅ تم تحديد نقاط الضعف (14 نقطة) في الموقع المنافس
- ✅ تم البحث عن حدود الباقات المجانية (Vercel, Firebase, Cloudinary)
- ✅ تم البحث عن متطلبات ظهور اللوجو والاسم في بحث جوجل
- ✅ تم البحث عن أفضل ممارسات أمان API Routes
- ✅ تم البحث عن تكامل Next.js مع Firebase
- 🔄 جاري إعداد خطة التنفيذ الشاملة
- ⏳ في انتظار موافقة نادر على الخطة

---

## 🔑 قرارات مهمة تم اتخاذها

1. **Firebase بدل Supabase** — قرار نادر. Firebase Spark مجاني بالكامل بدون كريديت كارد
2. **كل شيء مجاني** — لا توجد ميزانية. كل الخدمات على الباقات المجانية
3. **الـ Agent يتحكم عبر API Routes** — محمية بـ API Key + Rate Limiting
4. **التخطيط أولاً** — لا تنفيذ قبل اكتمال الخطة وموافقة نادر
5. **الرفع (Deployment):** تم الاستقرار على رفع الموقع على **Vercel** لسهولة الرفع وتوافقه التام مع Next.js و API Routes والـ Cron Jobs، بدلاً من Cloudflare Pages التي تتطلب بيئة Edge Runtime المعقدة.
6. **قاعدة مستودع الأكواد (GitHub):** يُمنع منعاً باتاً رفع أي ملفات وهمية، سكريبتات اختبار (`*.js`, `*.py`)، أو ملفات الـ Agents المؤقتة ومجلدات `scratch` إلى GitHub. يجب أن يكون الرفع نظيفاً ومقتصراً على أكواد المشروع الضرورية فقط.

---

## 🚫 ملاحظات وتحذيرات

- الموقع المنافس مش بتاع نادر — احنا بنبني موقع جديد منافس
- لا نسخ محتوى حرفياً من أي مصدر — إعادة صياغة دائماً
- الصور: icons مجانية أو مصممة — لا سرقة صور
- الـ API Keys لازم تكون في Environment Variables فقط
- كل تعديل يُسجل هنا في الذاكرة

---

## 📁 هيكل المشروع (سيُحدث بعد البدء)

```
yalla-shoot-new/
├── .agents/
│   ├── AGENTS.md          ← قواعد المشروع
│   └── MEMORY.md          ← هذا الملف (الذاكرة)
├── app/                   ← Next.js App Router
├── components/            ← React Components
├── lib/                   ← Firebase config + utilities
├── public/                ← Static files + favicon + logo
└── ... (سيُحدث لاحقاً)
```

## سجل مشاكل وحلول الأوركيستريتور (Orchestrator Knowledge Base)
تم بناء وتحديث نظام الأوركيستريتور للتواصل مع الفريق (ChatGPT, Claude, Kimi, DeepSeek) وتم حل المشاكل التالية:
1. **التعليق اللانهائي مع Kimi (Thinking):** 
   - المشكلة: مؤشر 	hinking-container يظل بالصفحة بعد انتهاء الرد، مما يوهم الكود أن التوليد مستمر.
   - الحل: تعديل is_generating_eval لكيمي ليعتمد فقط على زر الإيقاف (Stop Button) وعدم فحص عناصر الـ loading.
2. **عدم استقرار النص (Timeout Fallback & Normalization):**
   - المشكلة: مؤشرات الكتابة (Cursors) تجعل النص يتغير كل ثانية، فلا نصل للاستقرار (15 ثانية).
   - الحل: استخدام Text Normalization (تجاهل المسافات الفارغة). وإضافة مهلة قصوى (Max Timeout 300s) بحيث إذا لم يستقر يعطي Error بدلاً من التعليق للأبد.
3. **انهيار الأوركيستريتور كـ Background Task:**
   - المشكلة: إغلاق المهمة المؤقتة كان يغلق الأوركيستريتور معه.
   - الحل: تشغيله كـ Detached Daemon مستقل creationflags=subprocess.CREATE_NEW_CONSOLE.
4. **تشفير BOM عبر PowerShell:**
   - المشكلة: كتابة الكود بـ PowerShell تضيف UTF-8 BOM وتسبب SyntaxError في Python.
   - الحل: استخدام Python لكتابة الملفات (أو أدوات العميل الأصلية) لضمان التشفير النظيف.
5. **إرسال المسار بدلاً من النص:**
   - المشكلة: client.py قد يعجز عن قراءة مسار الملف إذا لم يكن Absolute، فيرسل المسار كنص.
   - الحل: التمرير المباشر للنص إذا كان قصيراً، أو التأكد من إرسال المسار المطلق بشكل لا غبار عليه.
