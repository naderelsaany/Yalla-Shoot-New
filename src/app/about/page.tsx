import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'من نحن | يلا شوت نيو',
  description: 'تعرف على منصة يلا شوت نيو، الموقع الرياضي الأول لتغطية الأخبار والمباريات.',
  alternates: { canonical: '/about' }
};

function AboutStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "من نحن | يلا شوت نيو",
          "description": "تعرف على منصة يلا شوت نيو...",
          "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://yalla-shoot-new.vercel.app"}/about`,
          "mainEntity": {
            "@type": "Organization",
            "name": "يلا شوت نيو"
          }
        })
      }}
    />
  );
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 flex-1 max-w-4xl">
      <AboutStructuredData />
      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">الرئيسية</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">من نحن</span>
      </nav>

      <div className="flex flex-col items-center mb-12 text-center">
        <div className="w-24 h-24 relative mb-6">
          <Image 
            src="/icon-192.png" 
            alt="شعار يلا شوت نيو" 
            fill 
            className="object-contain"
          />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold font-tajawal mb-4 text-[var(--color-text-primary)]">عن يلا شوت نيو</h1>
        <p className="text-lg text-[var(--color-text-secondary)] font-tajawal max-w-2xl">
          الوجهة الأولى للمشجع العربي المتابع لكرة القدم العالمية والمحلية
        </p>
      </div>
      
      <div className="prose prose-invert max-w-none text-[var(--color-text-secondary)] font-tajawal space-y-8 leading-relaxed bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] p-6 md:p-10 rounded-3xl shadow-[var(--shadow-card)]">
        
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <span className="w-8 h-1 bg-[var(--color-accent)] rounded-full inline-block"></span>
            رؤيتنا
          </h2>
          <p>
            موقع <strong>يلا شوت نيو</strong> تأسس ليكون المنصة الرياضية الشاملة التي تضع المشجع العربي في قلب الحدث. نحن نهدف إلى تقديم تجربة رياضية متكاملة تواكب أحدث التقنيات وتوفر وصولاً سريعاً وموثوقاً لآخر الأخبار والمستجدات في عالم كرة القدم.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <span className="w-8 h-1 bg-[var(--color-accent)] rounded-full inline-block"></span>
            ماذا نقدم؟
          </h2>
          <ul className="list-disc list-inside space-y-3 mr-4">
            <li><strong>تغطية حصرية:</strong> متابعة دقيقة ومستمرة لجميع الدوريات الكبرى (دوري أبطال أوروبا، الدوري الإنجليزي، الإسباني، وغيرها).</li>
            <li><strong>أخبار موثوقة:</strong> نلتزم في يلا شوت نيو بتقديم الأخبار من مصادرها الرسمية والموثوقة بعيداً عن الشائعات.</li>
            <li><strong>إحصائيات دقيقة:</strong> جدول الترتيب، تفاصيل المباريات، وأرقام اللاعبين والفرق محدثة بشكل لحظي.</li>
            <li><strong>تجربة مستخدم مميزة:</strong> تم تصميم الموقع ليكون سريعاً ومتجاوباً مع جميع الأجهزة (موبايل، تابلت، كمبيوتر) لضمان تصفح سلس.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <span className="w-8 h-1 bg-[var(--color-accent)] rounded-full inline-block"></span>
            التزامنا تجاه المحتوى
          </h2>
          <p>
            نحن في يلا شوت نيو نؤمن بأهمية احترام حقوق الملكية الفكرية. نحن لا نقوم باستضافة أو بث أي محتوى مقرصن أو غير قانوني على خوادمنا. جميع المعلومات المقدمة هدفها صحفي وتغطية رياضية احترافية توافق سياسات الاستخدام العادل وتلتزم بشروط وإرشادات جوجل والمؤسسات العالمية.
          </p>
        </div>

      </div>
    </div>
  );
}
