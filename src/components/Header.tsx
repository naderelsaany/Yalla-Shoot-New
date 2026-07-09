'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/icon-192.png" 
            alt="يلا شوت نيو" 
            width={40} 
            height={40} 
            className="w-10 h-10 object-contain"
          />
          <span className="text-xl font-bold font-arabic tracking-tight text-[var(--color-text-primary)]">
            يلا شوت <span className="text-[var(--color-accent)]">نيو</span>
          </span>
        </Link>

        {/* Navigation - Scrollable on Mobile */}
        <nav className="flex items-center gap-4 md:gap-8 font-tajawal text-[var(--color-text-secondary)] font-medium overflow-x-auto md:overflow-visible whitespace-nowrap no-scrollbar pr-4">
          <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">الرئيسية</Link>
          <Link href="/news" className="hover:text-[var(--color-accent)] transition-colors">الأخبار</Link>
        </nav>
      </div>
    </header>
  );
}
