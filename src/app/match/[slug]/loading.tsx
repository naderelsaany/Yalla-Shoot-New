export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl animate-pulse">
      <div className="h-6 bg-[var(--color-bg-elevated)] w-48 rounded mb-6"></div>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-6 md:p-10 h-64 mb-8"></div>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-6 h-48 mb-8"></div>
    </div>
  );
}
