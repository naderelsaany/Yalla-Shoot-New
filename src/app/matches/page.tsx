import { supabase } from '@/lib/supabase';
import { translateName } from '@/lib/translations';
import MatchCard, { MatchCardProps } from '@/components/MatchCard';
import Link from 'next/link';
import { Metadata } from 'next';
import { MatchWithTeams } from '@/types/database';

export const metadata: Metadata = {
  title: 'جدول المباريات | يلا شوت نيو',
  description: 'تعرف على جدول مباريات اليوم والغد، المواعيد، والنتائج المباشرة.',
  alternates: {
    canonical: 'https://yallashootnew.com/matches',
  },
  openGraph: {
    title: 'جدول المباريات | يلا شوت نيو',
    description: 'تابع مواعيد ونتائج مباريات كافة البطولات.',
    url: 'https://yallashootnew.com/matches',
    type: 'website',
  },
};

export const revalidate = 60;

function MatchesStructuredData({ matches }: { matches: MatchWithTeams[] }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: matches.map((match, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SportsEvent',
        name: `${translateName(match.home_team?.name || '')} ضد ${translateName(match.away_team?.name || '')}`,
        startDate: match.match_date,
        url: `https://yallashootnew.com/match/${match.id}`,
      },
    })),
  };

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: 'https://yallashootnew.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'المباريات',
        item: 'https://yallashootnew.com/matches',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </>
  );
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; page?: string }>
}) {
  const { date, page } = await searchParams;
  
  // ✅ إصلاح: استخدام التوقيت المحلي بشكل صحيح
  let targetDate: Date;
  if (date) {
    const parts = date.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      const parsedDate = new Date(year, month - 1, day);
      targetDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    } else {
      targetDate = new Date();
    }
  } else {
    targetDate = new Date();
  }

  // إنشاء بداية ونهاية اليوم بالتوقيت المحلي
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

  const currentPage = parseInt(page || '1');
  const itemsPerPage = 20;
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  const { data: matchesData, count } = await supabase
    .from('matches')
    .select(`
      id,
      match_date,
      status,
      home_score,
      away_score,
      home_team:teams!matches_home_team_id_fkey(name, logo_url),
      away_team:teams!matches_away_team_id_fkey(name, logo_url),
      league:leagues(name)
    `, { count: 'exact' })
    .gte('match_date', startOfDay.toISOString())
    .lte('match_date', endOfDay.toISOString())
    .order('match_date', { ascending: true })
    .range(from, to);

  const matches = matchesData as unknown as MatchWithTeams[] | null;

  const totalPages = Math.ceil((count || 0) / itemsPerPage);

  const groupedMatches = matches?.reduce<Record<string, MatchWithTeams[]>>((acc, match) => {
    const leagueName = translateName(match.league?.name || 'بطولة أخرى');
    if (!acc[leagueName]) acc[leagueName] = [];
    acc[leagueName].push(match);
    return acc;
  }, {});

  const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <MatchesStructuredData matches={matches || []} />
      
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)]">الرئيسية</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">المباريات</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold font-tajawal mb-2 tracking-tight">
          جدول <span className="text-[var(--color-accent)]">المباريات</span>
        </h1>
        <p className="text-[var(--color-text-secondary)]">تابع مواعيد ونتائج مباريات كافة البطولات.</p>
      </div>

      {/* Date Navigation */}
      <div className="flex justify-center gap-4 mb-8">
        <Link 
          href={`/matches?date=${new Date(targetDate.getTime() - 86400000).toISOString().split('T')[0]}`}
          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-2 rounded-xl text-sm hover:bg-[var(--color-accent)] hover:text-white transition-colors"
        >
          اليوم السابق
        </Link>
        <span className="flex items-center text-[var(--color-text-primary)] font-bold">
          {targetDate.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        <Link 
          href={`/matches?date=${new Date(targetDate.getTime() + 86400000).toISOString().split('T')[0]}`}
          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-2 rounded-xl text-sm hover:bg-[var(--color-accent)] hover:text-white transition-colors"
        >
          اليوم التالي
        </Link>
      </div>

      {groupedMatches && Object.keys(groupedMatches).length > 0 ? (
        Object.keys(groupedMatches).map((league) => (
          <div key={league} className="mb-10">
            <h2 className="text-xl font-bold font-arabic flex items-center gap-2 mb-4 bg-[var(--color-bg-elevated)] p-3 rounded-xl border border-[var(--color-border-subtle)] w-fit pr-4 pl-8">
              <span className="w-1.5 h-5 bg-[var(--color-accent)] rounded-full"></span>
              {league}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedMatches[league].map((match) => {
                const dateObj = new Date(match.match_date);
                const timeString = dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' });
                
                return (
                  <MatchCard 
                    key={match.id}
                    id={match.id}
                    homeTeam={translateName(match.home_team?.name || 'فريق')}
                    awayTeam={translateName(match.away_team?.name || 'فريق')}
                    homeLogo={match.home_team?.logo_url ?? undefined}
                    awayLogo={match.away_team?.logo_url ?? undefined}
                    homeScore={match.home_score}
                    awayScore={match.away_score}
                    time={timeString}
                    status={match.status as MatchCardProps['status']}
                    league={translateName(match.league?.name || 'بطولة')}
                  />
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)]">
          لا توجد مباريات متاحة في هذا اليوم
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-12 font-tajawal">
          {currentPage > 1 && (
            <Link 
              href={`/matches?date=${dateStr}&page=${currentPage - 1}`}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] px-6 py-2 rounded-xl hover:bg-[var(--color-accent)] hover:text-white transition-colors shadow-[var(--shadow-card)]"
            >
              الصفحة السابقة
            </Link>
          )}
          
          <span className="flex items-center text-[var(--color-text-secondary)]">
            صفحة {currentPage} من {totalPages}
          </span>

          {currentPage < totalPages && (
            <Link 
              href={`/matches?date=${dateStr}&page=${currentPage + 1}`}
              className="bg-[var(--color-accent)] text-white px-6 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-[var(--shadow-card)]"
            >
              الصفحة التالية
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
