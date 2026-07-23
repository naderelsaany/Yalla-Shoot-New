import { supabase } from '@/lib/supabase';
import { translateName } from '@/lib/translations';
import { generateSlug } from '@/lib/slug';
import TeamLogo from '@/components/TeamLogo';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Match, Team } from '@/types/database';

export const revalidate = 60;

export async function generateStaticParams() {
  const { data: teams } = await supabase.from('teams').select('name').limit(200);
  return teams?.map(team => ({ slug: generateSlug(team.name) })) || [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yalla-shoot-new.vercel.app';

  // Find team by reverse slug matching
  const { data: teams } = await supabase.from('teams').select('id, name').limit(200);
  const team = teams?.find(t => generateSlug(t.name) === decodedSlug);
  if (!team) return { title: 'فريق غير موجود' };

  const translatedName = translateName(team.name);
  return {
    title: `${translatedName} — فريق`,
    description: `صفحة فريق ${translatedName} — مباريات الفريق، نتائج، مواعيد وإحصائيات على يلا شوت نيو.`,
    keywords: `${translatedName}, فريق ${translatedName}, مباريات ${translatedName}, نتائج ${translatedName}, ${translatedName} اليوم`,
    alternates: { canonical: `${baseUrl}/team/${decodedSlug}` },
    openGraph: {
      title: `${translatedName} | يلا شوت نيو`,
      description: `جميع مباريات فريق ${translatedName} على يلا شوت نيو`,
      url: `${baseUrl}/team/${decodedSlug}`,
      type: 'profile',
      siteName: 'يلا شوت نيو',
      locale: 'ar_AR',
    },
  };
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  // Find team
  const { data: teams } = await supabase.from('teams').select('*').limit(200);
  const team = teams?.find(t => generateSlug(t.name) === decodedSlug);
  if (!team) notFound();

  const translatedName = translateName(team.name);

  // Get team's matches
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, slug, match_date, status, home_score, away_score, video_url,
      home_team:teams!matches_home_team_id_fkey(id, name, logo_url),
      away_team:teams!matches_away_team_id_fkey(id, name, logo_url),
      league:leagues(name)
    `)
    .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
    .order('match_date', { ascending: false })
    .limit(50);

  const upcoming = matches?.filter(m => m.status === 'SCHEDULED') || [];
  const live = matches?.filter(m => m.status === 'IN_PLAY' || m.status === 'LIVE') || [];
  const finished = matches?.filter(m => m.status === 'FINISHED') || [];

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)]">الرئيسية</Link>
        <span>/</span>
        <Link href="/teams" className="hover:text-[var(--color-accent)]">الفرق</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">{translatedName}</span>
      </nav>

      {/* Team Header */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-6 md:p-8 mb-8 shadow-[var(--shadow-card)] text-center md:text-right">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <TeamLogo src={team.logo_url || undefined} alt={translatedName} size="lg" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-tajawal mb-2">{translatedName}</h1>
            <p className="text-[var(--color-text-secondary)]">
              {(matches?.length || 0)} مباراة مسجلة
              {upcoming.length > 0 && ` — ${upcoming.length} مباراة قادمة`}
              {live.length > 0 && ` 🔴 ${live.length} مباراة مباشرة الآن`}
            </p>
          </div>
        </div>
      </div>

      {/* Live Matches */}
      {live.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold font-tajawal mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            مباشر الآن
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {live.map(match => <MatchCard key={match.id} match={match} />)}
          </div>
        </section>
      )}

      {/* Upcoming Matches */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold font-tajawal mb-4">المباريات القادمة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map(match => <MatchCard key={match.id} match={match} />)}
          </div>
        </section>
      )}

      {/* Finished Matches */}
      {finished.length > 0 && (
        <section>
          <h2 className="text-xl font-bold font-tajawal mb-4">المباريات السابقة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finished.map(match => <MatchCard key={match.id} match={match} />)}
          </div>
        </section>
      )}

      {(!matches || matches.length === 0) && (
        <div className="text-center py-12 text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)]">
          لا توجد مباريات مسجلة لهذا الفريق حالياً
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: any }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yalla-shoot-new.vercel.app';
  const homeName = translateName(match.home_team?.name || '');
  const awayName = translateName(match.away_team?.name || '');
  const leagueName = translateName(match.league?.name || '');
  const matchDate = new Date(match.match_date);
  const dateStr = matchDate.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Cairo' });
  const timeStr = matchDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' });

  const isLive = match.status === 'IN_PLAY' || match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';

  return (
    <Link href={`/match/${match.slug || match.id}`}
          className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-4 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--color-text-muted)]">{dateStr}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
          isLive ? 'bg-red-500/20 text-red-400' :
          isFinished ? 'bg-green-500/20 text-green-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {isLive ? 'مباشر' : isFinished ? 'انتهت' : timeStr}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <TeamLogo src={match.home_team?.logo_url || undefined} alt={homeName} size="sm" />
          <span className="font-bold font-tajawal text-sm truncate">{homeName}</span>
        </div>

        <div className="text-center min-w-[50px]">
          {isFinished ? (
            <span className="text-lg font-bold font-mono">{match.home_score}-{match.away_score}</span>
          ) : (
            <span className="text-sm text-[var(--color-text-muted)]">vs</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="font-bold font-tajawal text-sm truncate">{awayName}</span>
          <TeamLogo src={match.away_team?.logo_url || undefined} alt={awayName} size="sm" />
        </div>
      </div>

      <div className="mt-2 text-xs text-[var(--color-text-muted)] text-center">{leagueName}</div>
    </Link>
  );
}
