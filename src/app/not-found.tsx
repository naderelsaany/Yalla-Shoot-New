import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الصفحة غير موجودة (404)',
  description: 'عذراً، الصفحة التي تبحث عنها غير موجودة. يمكنك العودة للصفحة الرئيسية لتصفح مباريات اليوم وأحدث الأخبار الرياضية.',
};

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-8">
        <span className="text-8xl md:text-9xl font-bold font-tajawal text-[var(--color-accent)] opacity-30 select-none">
          404
        </span>
      </div>

      <h1 className="text-2xl md:text-4xl font-bold font-tajawal text-[var(--color-text-primary)] mb-4">
        الصفحة غير موجودة
      </h1>

      <p className="text-[var(--color-text-secondary)] text-lg max-w-md mb-8 font-tajawal">
        عذراً، الصفحة التي تبحث عنها قد تكون حُذفت أو نُقلت. يمكنك تصفح المباريات أو الأخبار من الروابط أدناه.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/"
          className="bg-[var(--color-accent)] text-white font-bold font-tajawal px-8 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg"
        >
          العودة للرئيسية
        </Link>
        <Link
          href="/news"
          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-bold font-tajawal px-8 py-3 rounded-xl hover:bg-[var(--color-bg-card)] transition-colors"
        >
          تصفح الأخبار
        </Link>
      </div>
    </div>
  );
}
