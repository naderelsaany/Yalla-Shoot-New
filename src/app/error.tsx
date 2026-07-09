'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-tajawal px-4">
      <div className="text-center flex flex-col items-center max-w-lg mx-auto bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] p-8 rounded-3xl shadow-[var(--shadow-elevated)]">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold mb-4 font-arabic">عذراً، حدث خطأ غير متوقع</h2>
        <p className="text-[var(--color-text-secondary)] mb-8">
          واجهنا مشكلة أثناء تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] px-6 py-3 rounded-xl font-bold hover:bg-[var(--color-border-subtle)] transition-colors"
          >
            حاول مرة أخرى
          </button>
          <Link 
            href="/" 
            className="flex-1 bg-[var(--color-accent)] text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-colors"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
