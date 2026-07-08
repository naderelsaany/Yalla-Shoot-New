import { supabase } from '@/lib/supabase';
import { translateName } from '@/lib/translations';
import TeamLogo from '@/components/TeamLogo';
import MatchCard from '@/components/MatchCard';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { League, StandingWithTeam, MatchWithTeams } from '@/types/database';

export const revalidate = 60; // Refresh every minute since we have matches now

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: league } = await supabase
    .from('leagues')
    .select('name, country')
    .eq('id', id)
    .single();

  if (!league) return { title: 'بطولة غير موجودة | يلا شوت نيو' };

  const leagueName = translateName(league.name);

  return {
    title: `${leagueName} | ترتيب ومباريات`,
    description: `تابع جدول ترتيب ${leagueName} وأهم المباريات والنتائج.`,
    alternates: {
      canonical: `https://yallashootnew.com/leagues/${id}`,
    },
    openGraph: {
      title: `${leagueName} | يلا شوت نيو`,
      description: `ترتيب ومباريات ${leagueName}`,
      url: `https://yallashootnew.com/leagues/${id}`,
      type: 'website',
    },
  };
}

function LeagueStructuredData({ standings, leagueName, id }: { league: League; standings: StandingWithTeam[]; leagueName: string; id: string }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: leagueName,
    sport: 'Soccer',
    member: standings.map((row) => ({
      '@type': 'SportsTeam',
      name: translateName(row.teams?.name || ''),
      position: row.position,
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
        name: 'البطولات',
        item: 'https://yallashootnew.com/leagues',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: leagueName,
        item: `https://yallashootnew.com/leagues/${id}`,
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

export default async function LeagueDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', id)
    .single();

  if (!league) {
    notFound();
  }

  // Fetch standings for this league
  const { data: standings } = await supabase
    .from('standings')
    .select('*, teams(name, logo_url)')
    .eq('league_id', id)
    .order('position', { ascending: true });

  // Fetch Matches for this league
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(name, logo_url),
      away_team:teams!matches_away_team_id_fkey(name, logo_url)
    `)
    .eq('league_id', id)
    .order('match_date', { ascending: true });

  const leagueName = translateName(league.name);

  // Split matches
  const pastMatches = (matches || []).filter((m: MatchWithTeams) => m.status === 'FINISHED').reverse(); // Newest past matches first
  const upcomingMatches = (matches || []).filter((m: MatchWithTeams) => m.status !== 'FINISHED');

  return (
    <div className="container mx-auto px-4 py-8 flex-1 max-w-5xl">
      <LeagueStructuredData league={league} standings={standings || []} leagueName={leagueName} id={id} />
      
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)]">الرئيسية</Link>
        <span>/</span>
        <Link href="/leagues" className="hover:text-[var(--color-accent)]">البطولات</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">{leagueName}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-12 bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-8 shadow-[var(--shadow-elevated)]">
        <TeamLogo src={league.logo_url} alt={leagueName} size="xl" />
        <div className="text-center md:text-right">
          <h1 className="text-3xl md:text-4xl font-bold font-arabic mb-2 text-[var(--color-text-primary)]">
            {leagueName}
          </h1>
          {league.country && (
            <p className="text-lg text-[var(--color-text-secondary)]">{translateName(league.country)}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content (Matches) */}
        <div className="lg:col-span-2 flex flex-col gap-12">
          
          {/* Upcoming Matches */}
          <section>
            <h2 className="text-2xl font-bold font-tajawal mb-6">المباريات القادمة / الجارية</h2>
            {upcomingMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingMatches.map((match: MatchWithTeams) => {
                  const dateObj = new Date(match.match_date);
                  const timeString = dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' });
                  const dateString = dateObj.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', timeZone: 'Africa/Cairo' });
                  return (
                    <MatchCard
                      key={match.id}
                      id={match.id}
                      league={leagueName}
                      homeTeam={translateName(match.home_team?.name || '')}
                      awayTeam={translateName(match.away_team?.name || '')}
                      homeLogo={match.home_team?.logo_url || undefined}
                      awayLogo={match.away_team?.logo_url || undefined}
                      homeScore={match.home_score}
                      awayScore={match.away_score}
                      time={`${dateString} - ${timeString}`}
                      status={match.status as 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED' | 'AWARDED'}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)]">
                لا توجد مباريات قادمة مجدولة حالياً.
              </div>
            )}
          </section>

          {/* Past Matches */}
          <section>
            <h2 className="text-2xl font-bold font-tajawal mb-6">أحدث النتائج (مباريات سابقة)</h2>
            {pastMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80 hover:opacity-100 transition-opacity">
                {pastMatches.map((match: MatchWithTeams) => {
                  const dateObj = new Date(match.match_date);
                  const dateString = dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Africa/Cairo' });
                  return (
                    <MatchCard
                      key={match.id}
                      id={match.id}
                      league={leagueName}
                      homeTeam={translateName(match.home_team?.name || '')}
                      awayTeam={translateName(match.away_team?.name || '')}
                      homeLogo={match.home_team?.logo_url || undefined}
                      awayLogo={match.away_team?.logo_url || undefined}
                      homeScore={match.home_score}
                      awayScore={match.away_score}
                      time={dateString}
                      status={match.status as 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED' | 'AWARDED'}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)]">
                لا توجد نتائج سابقة متاحة.
              </div>
            )}
          </section>

        </div>

        {/* Sidebar (Standings) */}
        <div className="lg:col-span-1">
          <section className="sticky top-24">
            <h2 className="text-2xl font-bold font-tajawal mb-6">جدول الترتيب</h2>
            {standings && standings.length > 0 ? (
              <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[var(--color-bg-card)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
                      <tr>
                        <th className="px-2 py-3 font-medium text-center">#</th>
                        <th className="px-2 py-3 font-medium">الفريق</th>
                        <th className="px-2 py-3 font-medium text-center">لعب</th>
                        <th className="px-2 py-3 font-medium text-center text-[var(--color-accent)]">نقاط</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)]">
                      {standings.map((row: StandingWithTeam) => (
                        <tr key={row.id} className="hover:bg-[var(--color-bg-card)] transition-colors">
                          <td className="px-2 py-3 text-center font-bold text-[var(--color-text-muted)]">{row.position}</td>
                          <td className="px-2 py-3">
                            <div className="flex items-center gap-2">
                              <TeamLogo src={row.teams?.logo_url || undefined} alt={row.teams?.name || ''} size="sm" />
                              <span className="font-bold text-[var(--color-text-primary)] truncate max-w-[100px]">{translateName(row.teams?.name || '')}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-center text-[var(--color-text-secondary)]">{row.played}</td>
                          <td className="px-2 py-3 text-center font-bold text-[var(--color-accent)]">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)]">
                الترتيب غير متاح.
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}
