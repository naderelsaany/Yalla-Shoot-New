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
        <a href="/" className="text-sm hover:underline">العودة للموقع</a>
      </div>
      <div className="p-4 md:p-8">
        {children}
      </div>
    </div>
  );
}
