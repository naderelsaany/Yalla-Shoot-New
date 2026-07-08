import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "اتصل بنا | يلا شوت نيو",
  description: "تواصل مع فريق يلا شوت نيو لأي استفسارات أو اقتراحات.",
  alternates: {
    canonical: "https://yallashootnew.com/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex-1 max-w-4xl text-[var(--color-text-primary)]">
      <h1 className="text-3xl font-bold font-arabic mb-8 text-[var(--color-accent)]">اتصل بنا</h1>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-8 font-tajawal text-[var(--color-text-secondary)] text-center">
        <p className="mb-6 text-lg">يسعدنا تواصلك معنا بخصوص أي اقتراحات أو استفسارات.</p>
        <a href="mailto:support@yallashootnew.com" className="inline-block bg-[var(--color-accent)] text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
          أرسل رسالة إلكترونية
        </a>
      </div>
    </div>
  );
}
