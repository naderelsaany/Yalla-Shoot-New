import { supabase } from '@/lib/supabase';
import { generateSlug } from '@/lib/slug';
import { League } from '@/types/database';
import { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yalla-shoot-new.vercel.app';
  return {
    title: 'البطولات',
    description: 'جميع البطولات والدوريات على يلا شوت نيو — كأس العالم، الدوري المصري، الدوري السعودي، دوري أبطال أوروبا والمزيد.',
    keywords: 'بطولات كرة قدم, دوريات, يلا شوت نيو, كأس العالم, دوري أبطال أوروبا, الدوري المصري, الدوري السعودي',
    alternates: { canonical: `${baseUrl}/leagues` },
    openGraph: { title: 'البطولات | يلا شوت نيو', url: `${baseUrl}/leagues` },
  };
}

export default async function LeaguesPage() {
  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name', { ascending: true });

  if (!leagues || leagues.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">البطولات</h1>
        <p className="text-[var(--color-text-secondary)]">لا توجد بطولات مسجلة حالياً</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)]">الرئيسية</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">البطولات</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold font-tajawal mb-2 tracking-tight">
          جميع <span className="text-[var(--color-accent)]">البطولات</span>
        </h1>
        <p className="text-[var(--color-text-secondary)]">{leagues.length} بطولة ودوري رياضي.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {leagues.map(league => (
          <Link key={league.id} href={`/league/${generateSlug(league.name)}`}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-5 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all group">
            <div className="flex items-center gap-4">
              {league.logo_url ? (
                <img src={league.logo_url} alt={league.name} 
                     className="w-14 h-14 object-contain rounded-xl bg-white/5 p-2" />
              ) : (
                <div className="w-14 h-14 bg-[var(--color-bg-elevated)] rounded-xl flex items-center justify-center text-2xl">
                  🏆
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold font-tajawal truncate group-hover:text-[var(--color-accent)] transition-colors">
                  {league.name}
                </h2>
                {league.country && (
                  <p className="text-sm text-[var(--color-text-muted)]">{league.country}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
