import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-tajawal px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--color-accent)] opacity-10 blur-[150px] pointer-events-none"></div>
      
      <div className="relative z-10 text-center flex flex-col items-center">
        <h1 className="text-[150px] md:text-[200px] leading-none font-bold text-[var(--color-accent)] opacity-20 select-none">
          404
        </h1>
        <div className="-mt-16 md:-mt-24 mb-6">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-arabic">عذراً، الصفحة غير موجودة</h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-md mx-auto">
            يبدو أنك وصلت إلى صفحة غير متوفرة أو تم نقلها. لا تقلق، يمكنك العودة ومتابعة المباريات والأخبار.
          </p>
        </div>
        
        <Link 
          href="/" 
          className="bg-[var(--color-accent)] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-opacity-90 hover:scale-105 transition-all shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.3)]"
        >
          العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  );
}
