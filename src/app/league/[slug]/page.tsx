import { supabase } from '@/lib/supabase';
import { translateName } from '@/lib/translations';
import TeamLogo from '@/components/TeamLogo';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 60;

function generateSlug(name: string): string {
  return name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '').trim().replace(/\s+/g, '-');
}

export async function generateStaticParams() {
  const { data: leagues } = await supabase.from('leagues').select('name').limit(30);
  return leagues?.map(league => ({ slug: generateSlug(league.name) })) || [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yalla-shoot-new.vercel.app';

  const { data: leagues } = await supabase.from('leagues').select('id, name').limit(30);
  const league = leagues?.find(l => generateSlug(l.name) === decodedSlug);
  if (!league) return { title: 'بطولة غير موجودة' };

  const translatedName = translateName(league.name);
  return {
    title: `${translatedName} — بطولة | يلا شوت نيو`,
    description: `بطولة ${translatedName} على يلا شوت نيو — جدول المباريات، النتائج، الترتيب والإحصائيات.`,
    keywords: `${translatedName}, ${translatedName} 2026, نتائج ${translatedName}, مباريات ${translatedName}, ترتيب ${translatedName}`,
    alternates: { canonical: `${baseUrl}/league/${decodedSlug}` },
    openGraph: { title: `${translatedName} | يلا شوت نيو`, url: `${baseUrl}/league/${decodedSlug}` },
  };
}

export default async function LeaguePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const { data: leagues } = await supabase.from('leagues').select('*').limit(30);
  const league = leagues?.find(l => generateSlug(l.name) === decodedSlug);
  if (!league) notFound();

  const translatedName = translateName(league.name);

  // Get league's matches
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, slug, match_date, status, home_score, away_score, video_url,
      home_team:teams!matches_home_team_id_fkey(id, name, logo_url),
      away_team:teams!matches_away_team_id_fkey(id, name, logo_url),
      league:leagues(name)
    `)
    .eq('league_id', league.id)
    .order('match_date', { ascending: false })
    .limit(100);

  const upcoming = matches?.filter(m => m.status === 'SCHEDULED') || [];
  const live = matches?.filter(m => m.status === 'IN_PLAY' || m.status === 'LIVE') || [];
  const finished = matches?.filter(m => m.status === 'FINISHED') || [];

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)]">الرئيسية</Link>
        <span>/</span>
        <Link href="/leagues" className="hover:text-[var(--color-accent)]">البطولات</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">{translatedName}</span>
      </nav>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-6 mb-8 shadow-[var(--shadow-card)]">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {league.logo_url ? (
            <img src={league.logo_url} alt={translatedName} className="w-16 h-16 object-contain rounded-xl bg-white/5 p-2" />
          ) : (
            <div className="w-16 h-16 bg-[var(--color-bg-elevated)] rounded-xl flex items-center justify-center text-3xl">🏆</div>
          )}
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-bold font-tajawal mb-1">{translatedName}</h1>
            <p className="text-[var(--color-text-secondary)]">
              {(matches?.length || 0)} مباراة
              {league.country && ` — ${league.country}`}
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      {live.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold font-tajawal mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> مباشر الآن
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {live.map(match => <MatchCard key={match.id} match={match} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-tajawal">المباريات القادمة</h2>
            <span className="text-sm text-[var(--color-text-muted)]">{upcoming.length} مباراة</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map(match => <MatchCard key={match.id} match={match} />)}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-tajawal">المباريات السابقة</h2>
            <span className="text-sm text-[var(--color-text-muted)]">{finished.length} مباراة</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finished.map(match => <MatchCard key={match.id} match={match} />)}
          </div>
        </section>
      )}

      {(!matches || matches.length === 0) && (
        <div className="text-center py-12 text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)]">
          لا توجد مباريات في هذه البطولة حالياً
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: any }) {
  const homeName = translateName(match.home_team?.name || '');
  const awayName = translateName(match.away_team?.name || '');
  const matchDate = new Date(match.match_date);
  const dateStr = matchDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Cairo' });
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
    </Link>
  );
}
