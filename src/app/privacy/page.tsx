import { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yalla-shoot-new.vercel.app";

export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description: 'سياسة الخصوصية لموقع يلا شوت نيو. تعرف على كيفية جمع واستخدام وحماية بياناتك الشخصية عند استخدام منصتنا الرياضية.',
  keywords: 'سياسة الخصوصية, سياسة يلا شوت نيو, الخصوصية, حماية البيانات, ملفات تعريف الارتباط, سياسة cookies, Yalla Shoot New privacy',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'سياسة الخصوصية - يلا شوت نيو',
    description: 'تعرف على سياسة الخصوصية لموقع يلا شوت نيو وكيف نحمي بياناتك.',
    url: `${baseUrl}/privacy`,
    type: 'website',
    images: [{ url: `${baseUrl}/icon-512.png`, width: 512, height: 512, alt: 'يلا شوت نيو' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سياسة الخصوصية - يلا شوت نيو',
    description: 'سياسة الخصوصية لموقع يلا شوت نيو - تعرف على كيفية حماية بياناتك.',
  },
};

function PrivacyStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/privacy`,
        'name': 'سياسة الخصوصية | يلا شوت نيو',
        'description': 'سياسة الخصوصية لموقع يلا شوت نيو...',
        'url': `${baseUrl}/privacy`,
        'inLanguage': 'ar',
        'about': { '@type': 'Organization', 'name': 'يلا شوت نيو' },
        'isPartOf': { '@type': 'WebSite', '@id': `${baseUrl}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'سياسة الخصوصية', item: `${baseUrl}/privacy` },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 flex-1 max-w-4xl text-[var(--color-text-primary)] font-tajawal">
      <PrivacyStructuredData />
      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">الرئيسية</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">سياسة الخصوصية</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold font-tajawal mb-8 text-[var(--color-text-primary)]">سياسة الخصوصية</h1>
      
      <div className="prose prose-invert max-w-none text-[var(--color-text-secondary)] font-tajawal space-y-6 leading-relaxed bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] p-6 md:p-10 rounded-3xl shadow-[var(--shadow-card)]">
        <p>
          في <strong>يلا شوت نيو</strong> (yallashootnew.com)، نعتبر خصوصية زوارنا من أهم أولوياتنا. توضح وثيقة سياسة الخصوصية هذه أنواع المعلومات الشخصية التي نتلقاها ونجمعها وكيفية استخدامها.
        </p>

        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8 mb-4">ملفات الدخول (Log Files)</h2>
        <p>
          مثل العديد من مواقع الويب الأخرى، يستخدم يلا شوت نيو ملفات الدخول. تتضمن المعلومات داخل ملفات الدخول عناوين بروتوكول الإنترنت (IP)، نوع المتصفح، مزود خدمة الإنترنت (ISP)، طابع التاريخ/الوقت، صفحات الإحالة/الخروج، وعدد النقرات لتحليل الاتجاهات، إدارة الموقع، تتبع حركة المستخدم حول الموقع، وجمع المعلومات الديموغرافية. عناوين IP وغيرها من هذه المعلومات غير مرتبطة بأي معلومات لتحديد هويتك.
        </p>

        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8 mb-4">ملفات تعريف الارتباط (Cookies) وإعدادات الشبكة</h2>
        <p>
          يستخدم موقع يلا شوت نيو ملفات تعريف الارتباط لتخزين المعلومات عن تفضيلات الزوار، تسجيل معلومات خاصة بالمستخدم عن الصفحات التي يصل إليها الزائر، وتخصيص محتوى صفحة الويب استناداً إلى نوع متصفح الزوار أو معلومات أخرى يرسلها الزائر عبر متصفحه.
        </p>

        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8 mb-4">شركاء الإعلانات (Google AdSense)</h2>
        <ul className="list-disc list-inside space-y-2 mr-4">
          <li>جوجل، كطرف ثالث مورد، يستخدم ملفات تعريف الارتباط لعرض الإعلانات على موقعنا.</li>
          <li>استخدام جوجل لملف تعريف الارتباط DART يمهد لعرض الإعلانات للمستخدمين استناداً إلى زياراتهم لموقعنا والمواقع الأخرى على الإنترنت.</li>
          <li>يجوز للمستخدمين اختيار عدم استخدام ملف تعريف الارتباط DART عن طريق زيارة سياسة الخصوصية الخاصة بإعلانات جوجل وشبكة المحتوى على الرابط التالي: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">https://policies.google.com/technologies/ads</a></li>
        </ul>
        <p className="mt-4">
          قد يستخدم شركاء الإعلان الآخرين لدينا، مثل Google AdSense، ملفات تعريف الارتباط وإشارات الويب على موقعنا لقياس مدى فعالية حملاتهم الإعلانية و/أو لتخصيص محتوى الإعلان الذي تراه. ليس لدى يلا شوت نيو أي وصول أو سيطرة على ملفات تعريف الارتباط هذه التي يستخدمها معلنو الطرف الثالث.
        </p>

        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8 mb-4">سياسات خصوصية الطرف الثالث</h2>
        <p>
          يجب عليك استشارة كل سياسة خصوصية خاصة بخوادم إعلانات الجهات الخارجية لمزيد من المعلومات التفصيلية حول ممارساتها وكذلك للحصول على تعليمات حول كيفية إلغاء الاشتراك في بعض الممارسات. لا تنطبق سياسة خصوصية يلا شوت نيو عليها، ولا يمكننا التحكم في أنشطة المعلنين الآخرين أو مواقع الويب الأخرى.
        </p>

        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8 mb-4">موافقة</h2>
        <p>
          باستخدامك لموقعنا، فإنك توافق على سياسة الخصوصية الخاصة بنا وتوافق على شروطها.
        </p>
      </div>
    </div>
  );
}
