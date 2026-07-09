# قواعد مشروع يلا شوت نيو

## القاعدة الأساسية
هذا مشروع موقع رياضي عربي (RTL) لمتابعة المباريات والأخبار. كل كود يُكتب يجب أن يراعي:

## 1. اللغة والاتجاه
- الموقع بالكامل عربي — `lang="ar"` و `dir="rtl"`
- كل النصوص عربية إلا الكود والمصطلحات التقنية
- الخط: Cairo أو Tajawal من Google Fonts

## 2. الباقات المجانية
- **ممنوع** استخدام أي خدمة مدفوعة أو تحتاج كريديت كارد
- Firebase Spark فقط — لا Blaze
- Vercel Hobby فقط — لا Pro
- Cloudinary Free فقط
- راقب حدود الاستخدام دائماً (راجع MEMORY.md)

## 3. الأمان
- كل API Keys في Environment Variables فقط
- لا `NEXT_PUBLIC_` لأي مفتاح سري
- Firebase Admin SDK على السيرفر فقط
- Firestore Security Rules صارمة
- Rate Limiting على كل API Route
- Input Validation بـ Zod
- كل طلب API يُسجل في log

## 4. الأداء
- هدف LCP < 1.5 ثانية
- هدف CLS < 0.05
- صور WebP + Lazy Loading
- ISR للصفحات الديناميكية
- SSG للصفحات الثابتة

## 5. SEO
- كل صفحة لها title + description فريد
- Open Graph + Twitter Card في كل صفحة
- JSON-LD Schema حسب نوع الصفحة
- Sitemap.xml ديناميكي
- Canonical URL في كل صفحة
- Breadcrumbs مرئية + Schema

## 6. الذاكرة
- **كل تعديل يُسجل في `.agents/MEMORY.md`**
- اقرأ MEMORY.md في بداية كل محادثة جديدة
- سجّل: التاريخ + ما تم + القرارات + المشاكل

## 7. الكود
- TypeScript فقط — لا JavaScript عادي
- Components صغيرة وقابلة لإعادة الاستخدام
- Server Components بالـ default
- Client Components فقط لما يكون فيه interactivity
- تعليقات على WHY مش WHAT

## 8. قاعدة استكمال فريق الذكاء الاصطناعي (Teamwork) 
- عندما يتوقف الفريق بسبب استهلاك الباقة (Quota Limit 429)، لا يتم إلغاء عملهم. 
- المستخدم يقوم بشحن الباقة بنفسه، وعندما يطلب استكمال العمل يجب عمل (Revive) للفريق فوراً ليستكمل من نفس النقطة بدون نقاش أو طلب توقف.
