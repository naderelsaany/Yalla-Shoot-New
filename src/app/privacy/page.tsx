import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "سياسة الخصوصية | يلا شوت نيو",
  description: "سياسة الخصوصية لموقع يلا شوت نيو - حماية بياناتك أولويتنا.",
  alternates: {
    canonical: "https://yallashootnew.com/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex-1 max-w-4xl text-[var(--color-text-primary)]">
      <h1 className="text-3xl font-bold font-arabic mb-8 text-[var(--color-accent)]">سياسة الخصوصية</h1>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-8 leading-relaxed font-tajawal text-[var(--color-text-secondary)]">
        <p className="mb-4">في يلا شوت نيو، خصوصيتك هي أولويتنا القصوى.</p>
        <p>نحن لا نقوم بجمع أي بيانات شخصية تضرك، ونستخدم ملفات تعريف الارتباط فقط لتحسين تجربة تصفحك للمباريات والأخبار.</p>
      </div>
    </div>
  );
}
