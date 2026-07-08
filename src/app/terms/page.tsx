import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "شروط الاستخدام | يلا شوت نيو",
  description: "شروط وأحكام استخدام موقع يلا شوت نيو.",
  alternates: {
    canonical: "https://yallashootnew.com/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex-1 max-w-4xl text-[var(--color-text-primary)]">
      <h1 className="text-3xl font-bold font-arabic mb-8 text-[var(--color-accent)]">شروط الاستخدام</h1>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-8 leading-relaxed font-tajawal text-[var(--color-text-secondary)]">
        <p className="mb-4">باستخدامك لموقع يلا شوت نيو، فأنت توافق على شروطنا.</p>
        <p>المحتوى الرياضي معروض بغرض التغطية الإخبارية والمتابعة اللحظية. يُمنع استخدام الموقع لأي أغراض تجارية أو نقل البيانات بدون إذن.</p>
      </div>
    </div>
  );
}
