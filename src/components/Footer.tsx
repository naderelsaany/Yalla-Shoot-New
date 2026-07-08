import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Copyright */}
        <div className="text-sm font-tajawal text-[var(--color-text-secondary)]">
          &copy; {new Date().getFullYear()} يلا شوت <span className="text-[var(--color-accent)]">نيو</span>. جميع الحقوق محفوظة.
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)] font-tajawal">
          <Link href="/about" className="hover:text-[var(--color-text-primary)] transition-colors">من نحن</Link>
          <Link href="/privacy" className="hover:text-[var(--color-text-primary)] transition-colors">سياسة الخصوصية</Link>
          <Link href="/terms" className="hover:text-[var(--color-text-primary)] transition-colors">الشروط والأحكام</Link>
          <Link href="/contact" className="hover:text-[var(--color-text-primary)] transition-colors">اتصل بنا</Link>
        </div>

      </div>
    </footer>
  );
}
