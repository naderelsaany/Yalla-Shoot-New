import { supabase } from '@/lib/supabase';
import { Team } from '@/types/database';
import { Metadata } from 'next';
import Link from 'next/link';
import TeamImage from './TeamImage';

export const revalidate = 3600; // ISR - every hour

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yalla-shoot-new.vercel.app';
  return {
    title: 'الفرق الرياضية',
    description: 'جميع الفرق الرياضية في يلا شوت نيو — منتخبات وأندية من جميع البطولات والدوريات العربية والعالمية.',
    keywords: 'فرق كرة القدم, منتخبات, أندية, يلا شوت نيو, كرة قدم عربية, فرق الدوري المصري, فرق الدوري السعودي',
    alternates: { canonical: `${baseUrl}/teams` },
    openGraph: {
      title: 'الفرق الرياضية | يلا شوت نيو',
      description: 'جميع الفرق والمنتخبات في يلا شوت نيو',
      url: `${baseUrl}/teams`,
    },
  };
}

function generateSlug(name: string): string {
  return name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '').trim().replace(/\s+/g, '-');
}

function TeamsBreadcrumbsStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yalla-shoot-new.vercel.app';
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'الفرق', item: `${baseUrl}/teams` },
        ],
      })
    }} />
  );
}

export default async function TeamsPage() {
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true });

  if (!teams || teams.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <TeamsBreadcrumbsStructuredData />
        <h1 className="text-2xl font-bold mb-8">الفرق الرياضية</h1>
        <p className="text-[var(--color-text-secondary)]">لا توجد فرق مسجلة حالياً</p>
      </div>
    );
  }

  // Group teams by first letter
  const grouped: Record<string, Team[]> = {};
  for (const team of teams) {
    const firstChar = team.name.charAt(0).toUpperCase();
    const arabicLetter = /[\u0600-\u06FF]/.test(firstChar) ? firstChar : '#';
    const key = /[\u0600-\u06FF]/.test(team.name.charAt(0)) ? team.name.charAt(0) : '#';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(team);
  }

  // Sort keys - Arabic letters first, then #
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b, 'ar');
  });

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <TeamsBreadcrumbsStructuredData />

      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)]">الرئيسية</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">الفرق</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold font-tajawal mb-2 tracking-tight">
          جميع <span className="text-[var(--color-accent)]">الفرق</span>
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          {teams.length} فريق ومنتخب مسجل في يلا شوت نيو.
        </p>
      </div>

      {/* Alphabetical Index */}
      <div className="flex flex-wrap gap-2 mb-8">
        {sortedKeys.map(key => (
          <a key={key} href={`#group-${key}`} 
             className="px-3 py-1 bg-[var(--color-bg-elevated)] rounded-lg text-sm hover:bg-[var(--color-accent)] hover:text-white transition-colors border border-[var(--color-border-subtle)]">
            {key === '#' ? 'أخرى' : key}
          </a>
        ))}
      </div>

      {/* Teams Grid */}
      {sortedKeys.map(key => (
        <div key={key} id={`group-${key}`} className="mb-10">
          <h2 className="text-2xl font-bold font-tajawal mb-4 text-[var(--color-text-primary)] border-b border-[var(--color-border-subtle)] pb-2">
            {key === '#' ? 'أخرى' : key}
            <span className="text-sm text-[var(--color-text-muted)] mr-2">({grouped[key].length})</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {grouped[key].map(team => (
              <Link key={team.id} href={`/team/${generateSlug(team.name)}`} 
                    className="p-3 bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all text-center">
                <TeamImage src={team.logo_url} name={team.name} />
                <h3 className="text-sm font-bold font-tajawal text-[var(--color-text-primary)] truncate">{team.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
