import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "اتصل بنا | يلا شوت نيو",
  description: "تواصل مع فريق يلا شوت نيو لأي استفسارات أو اقتراحات.",
  alternates: {
    canonical: "https://yallashootnew.com/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 flex-1 max-w-4xl text-[var(--color-text-primary)] font-tajawal">
      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">الرئيسية</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">اتصل بنا</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--color-text-primary)]">اتصل بنا</h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-8 max-w-2xl">
        نحن هنا للإجابة على استفساراتك وتلقي اقتراحاتك. يمكنك التواصل معنا في أي وقت وسنقوم بالرد عليك في أقرب فرصة.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-8 shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-6 h-1 bg-[var(--color-accent)] rounded-full inline-block"></span>
            معلومات التواصل المباشر
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
            للاستفسارات العامة، طلبات الإعلان، أو الإبلاغ عن مشكلة في الموقع، يرجى التواصل معنا عبر البريد الإلكتروني الرسمي.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-[var(--color-bg-elevated)] p-4 rounded-xl border border-[var(--color-border-subtle)]">
              <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">البريد الإلكتروني</p>
                <a href="mailto:info@yallashootnew.com" className="font-bold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors dir-ltr">
                  info@yallashootnew.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-8 shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-bold mb-6">أرسل لنا رسالة</h2>
          <form className="space-y-4" action="mailto:info@yallashootnew.com" method="post" encType="text/plain">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">الاسم الكامل</label>
              <input type="text" id="name" name="name" className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all" placeholder="أدخل اسمك" required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">البريد الإلكتروني</label>
              <input type="email" id="email" name="email" className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all" placeholder="أدخل بريدك الإلكتروني" required />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">نص الرسالة</label>
              <textarea id="message" name="message" rows={4} className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all resize-none" placeholder="اكتب رسالتك هنا..." required></textarea>
            </div>
            <button type="submit" className="w-full bg-[var(--color-accent)] text-white font-bold rounded-xl px-4 py-3 hover:opacity-90 transition-opacity">
              إرسال الرسالة
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
