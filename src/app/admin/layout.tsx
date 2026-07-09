import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة التحكم | يلا شوت نيو',
  description: 'إدارة محتوى الموقع',
  robots: {
    index: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-bg-primary)] min-h-screen text-[var(--color-text-primary)]">
      {/* Optional: Add a custom Admin header here */}
      <div className="bg-black/20 border-b border-[var(--color-border-subtle)] p-4 flex items-center justify-between">
        <h1 className="font-bold text-xl text-[var(--color-accent)] font-arabic">Yalla Shoot Admin</h1>
        <Link href="/" className="text-sm hover:underline">العودة للموقع</Link>
      </div>
      <div className="p-4 md:p-8">
        {children}
      </div>
    </div>
  );
}
