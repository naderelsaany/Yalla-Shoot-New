import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'الشروط والأحكام',
  description: 'الشروط والأحكام الخاصة باستخدام موقع يلا شوت نيو.',
  keywords: 'الشروط والأحكام, يلا شوت نيو',
  alternates: { canonical: '/terms' }
};

function TermsStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "شروط الاستخدام | يلا شوت نيو",
          "description": "اقرأ شروط الاستخدام لمنصة يلا شوت نيو...",
          "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://yalla-shoot-new.vercel.app"}/terms`
        })
      }}
    />
  );
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 flex-1 max-w-4xl text-[var(--color-text-primary)] font-tajawal">
      <TermsStructuredData />
      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">الرئيسية</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">الشروط والأحكام</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold font-tajawal mb-8 text-[var(--color-text-primary)]">الشروط والأحكام</h1>
      
      <div className="prose prose-invert max-w-none text-[var(--color-text-secondary)] font-tajawal space-y-6 leading-relaxed bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] p-6 md:p-10 rounded-3xl shadow-[var(--shadow-card)]">
        <p>
          مرحباً بك في موقع <strong>يلا شوت نيو</strong>. تنص هذه الشروط والأحكام على القواعد واللوائح لاستخدام موقعنا. باستخدامك لهذا الموقع، فإننا نفترض أنك تقبل بهذه الشروط والأحكام بالكامل.
        </p>

        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8 mb-4">1. شروط الاستخدام</h2>
        <p>
          المحتوى الموجود في هذا الموقع هو لأغراض إعلامية وتغطية رياضية فقط. نحن لا نضمن دقة أو اكتمال جميع المعلومات المقدمة، ونتنصل من أي مسؤولية قانونية تنشأ عن استخدام هذه المعلومات.
        </p>

        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8 mb-4">2. حقوق الملكية الفكرية</h2>
        <p>
          ما لم ينص على خلاف ذلك، يمتلك يلا شوت نيو و/أو المرخصون له حقوق الملكية الفكرية لجميع المواد الموجودة على الموقع. جميع حقوق الملكية الفكرية محفوظة. يمكنك عرض و/أو طباعة الصفحات للاستخدام الشخصي الخاص بك مع مراعاة القيود المحددة في هذه الشروط والأحكام.
        </p>

        <p>يجب ألا تقوم بـ:</p>
        <ul className="list-disc list-inside space-y-2 mr-4">
          <li>إعادة نشر المواد من هذا الموقع دون إذن.</li>
          <li>بيع أو تأجير أو الترخيص من الباطن للمواد.</li>
          <li>إعادة إنتاج أو تكرار أو نسخ المواد.</li>
          <li>إعادة توزيع المحتوى (إلا إذا كان المحتوى مصمماً خصيصاً لإعادة التوزيع).</li>
        </ul>

        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8 mb-4">3. إخلاء المسؤولية عن المحتوى الخارجي</h2>
        <p>
          قد يحتوي موقع يلا شوت نيو على روابط لمواقع خارجية ليس لنا سيطرة عليها. نحن غير مسؤولين عن محتوى هذه المواقع أو أي أضرار قد تنتج عن استخدامك لها. استخدام الروابط الخارجية يكون على مسؤوليتك الخاصة.
        </p>
        
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8 mb-4">4. التغييرات في الشروط</h2>
        <p>
          يحتفظ يلا شوت نيو بالحق في مراجعة وتعديل هذه الشروط والأحكام في أي وقت دون إشعار مسبق. باستخدام هذا الموقع، فإنك توافق على الالتزام بالإصدار الحالي من هذه الشروط.
        </p>

        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8 mb-4">5. القانون المطبق</h2>
        <p>
          تخضع هذه الشروط والأحكام وتفسر وفقاً للقوانين المحلية، وأي نزاعات تخضع للاختصاص القضائي الحصري للمحاكم المختصة.
        </p>
      </div>
    </div>
  );
}
