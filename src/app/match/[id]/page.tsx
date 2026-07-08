import { supabase } from "@/lib/supabase";
import { translateName } from "@/lib/translations";
import TeamLogo from "@/components/TeamLogo";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MatchWithTeams } from "@/types/database";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: matchData } = await supabase
    .from("matches")
    .select(`
      home_team:teams!matches_home_team_id_fkey(id, name),
      away_team:teams!matches_away_team_id_fkey(id, name),
      league:leagues(name)
    `)
    .eq("id", id)
    .single();

  const match = matchData as unknown as MatchWithTeams | null;

  if (!match) return { title: "مباراة غير موجودة | يلا شوت نيو" };

  const home = translateName(match.home_team?.name || "");
  const away = translateName(match.away_team?.name || "");
  const league = translateName(match.league?.name || "");

  return {
    title: `مباراة ${home} ضد ${away} | ${league}`,
    description: `تغطية وتفاصيل ونتيجة مباراة ${home} ضد ${away} في بطولة ${league}. بث مباشر وأحداث اللحظة بلحظة.`,
    alternates: {
      canonical: `https://yallashootnew.com/match/${id}`,
    },
    openGraph: {
      title: `مباراة ${home} ضد ${away}`,
      description: `تابع مباراة ${home} و${away} في ${league}`,
      url: `https://yallashootnew.com/match/${id}`,
      type: "article",
    },
  };
}

function MatchStructuredData({ match }: { match: MatchWithTeams }) {
  const homeName = translateName(match.home_team?.name || "");
  const awayName = translateName(match.away_team?.name || "");
  const leagueName = translateName(match.league?.name || "");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${homeName} ضد ${awayName}`,
    startDate: match.match_date,
    sport: "Soccer",
    description: `مباراة ${homeName} ضد ${awayName} في بطولة ${leagueName}`,
    url: `https://yallashootnew.com/match/${match.id}`,
    homeTeam: {
      "@type": "SportsTeam",
      name: homeName,
      image: match.home_team?.logo_url,
    },
    awayTeam: {
      "@type": "SportsTeam",
      name: awayName,
      image: match.away_team?.logo_url,
    },
    location: {
      "@type": "Place",
      name: leagueName,
    },
    eventStatus: match.status === "IN_PLAY" 
      ? "https://schema.org/EventInProgress" 
      : match.status === "FINISHED" 
        ? "https://schema.org/EventCompleted" 
        : "https://schema.org/EventScheduled",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

function BreadcrumbStructuredData({ leagueName, matchTitle }: { leagueName: string; matchTitle: string }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "الرئيسية",
        item: "https://yallashootnew.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "المباريات",
        item: "https://yallashootnew.com/matches",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: leagueName,
        item: `https://yallashootnew.com/leagues`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: matchTitle,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default async function MatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: matchData } = await supabase
    .from("matches")
    .select(`
      id,
      match_date,
      status,
      home_score,
      away_score,
      home_team:teams!matches_home_team_id_fkey(id, name, logo_url),
      away_team:teams!matches_away_team_id_fkey(id, name, logo_url),
      league:leagues(name)
    `)
    .eq("id", id)
    .single();

  const match = matchData as unknown as MatchWithTeams | null;

  if (!match) {
    notFound();
  }

  interface SimplePlayer {
    id: string;
    name: string;
  }

  let homePlayers: SimplePlayer[] = [];
  let awayPlayers: SimplePlayer[] = [];

  if (match.home_team?.name) {
    try {
        const safeHomeName = match.home_team.name.replace(/"/g, '""');
        const { data } = await supabase
          .from("players")
          .select("id, name")
          .or(`club.eq."${safeHomeName}",national_team.eq."${safeHomeName}"`);
      homePlayers = data || [];
      if (homePlayers.length === 0) {
        const { data: data2 } = await supabase
          .from("players")
          .select("id, name")
          .eq("club", match.home_team.name);
        homePlayers = data2 || [];
      }
    } catch {}
  }

  if (match.away_team?.name) {
    try {
        const safeAwayName = match.away_team.name.replace(/"/g, '""');
        const { data } = await supabase
          .from("players")
          .select("id, name")
          .or(`club.eq."${safeAwayName}",national_team.eq."${safeAwayName}"`);
      awayPlayers = data || [];
      if (awayPlayers.length === 0) {
        const { data: data2 } = await supabase
          .from("players")
          .select("id, name")
          .eq("club", match.away_team.name);
        awayPlayers = data2 || [];
      }
    } catch {}
  }

  const dateObj = new Date(match.match_date);
  const timeString = dateObj.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" });
  const dateString = dateObj.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Cairo"
  });

  const homeName = translateName(match.home_team?.name || "");
  const awayName = translateName(match.away_team?.name || "");
  const leagueName = translateName(match.league?.name || "");

  return (
    <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
      <MatchStructuredData match={match} />
      <BreadcrumbStructuredData leagueName={leagueName} matchTitle={`${homeName} ضد ${awayName}`} />

      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)]">الرئيسية</Link>
        <span>/</span>
        <Link href="/matches" className="hover:text-[var(--color-accent)]">المباريات</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">{leagueName}</span>
      </nav>

      {/* Match Header */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-6 md:p-10 shadow-[var(--shadow-elevated)] relative overflow-hidden mb-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--color-accent)] opacity-5 blur-[100px] pointer-events-none"></div>

        <div className="text-center mb-8">
          <h1 className="text-xl md:text-2xl font-bold font-arabic text-[var(--color-text-primary)]">{leagueName}</h1>
          <p className="text-[var(--color-text-secondary)] font-tajawal mt-2">{dateString} • {timeString}</p>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/teams/${match.home_team?.id || 'ahly'}`}
            data-testid="team-link-home"
            className="flex flex-col items-center gap-4 flex-1 hover:text-[var(--color-accent)] transition-colors"
          >
            <TeamLogo src={match.home_team?.logo_url ?? undefined} alt={homeName} size="lg" />
            <span className="text-lg md:text-2xl font-bold text-center text-[var(--color-text-primary)]">{homeName}</span>
          </Link>

          <div className="flex-1 flex flex-col items-center justify-center">
            {match.status === "SCHEDULED" ? (
              <span className="text-2xl md:text-4xl font-bold text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] px-6 py-3 rounded-2xl border border-[var(--color-border-subtle)]">VS</span>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-4 text-4xl md:text-6xl font-bold font-tajawal text-[var(--color-text-primary)] tracking-tight">
                  <span>{match.home_score}</span>
                  <span className="text-[var(--color-text-muted)]">-</span>
                  <span>{match.away_score}</span>
                </div>
                {match.status === "IN_PLAY" && (
                  <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-live)] animate-pulse mt-2 bg-[var(--color-live)]/10 px-3 py-1 rounded-full border border-[var(--color-live)]/20">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-live)]"></span>
                    مباشر الآن
                  </span>
                )}
                {match.status === "FINISHED" && (
                  <span className="text-sm font-bold text-[var(--color-text-secondary)] mt-2 bg-[var(--color-bg-elevated)] px-3 py-1 rounded-full border border-[var(--color-border-subtle)]">
                    نهاية المباراة
                  </span>
                )}
              </div>
            )}
          </div>

          <Link
            href={`/teams/${match.away_team?.id || 'ahly'}`}
            data-testid="team-link-away"
            className="flex flex-col items-center gap-4 flex-1 hover:text-[var(--color-accent)] transition-colors"
          >
            <TeamLogo src={match.away_team?.logo_url ?? undefined} alt={awayName} size="lg" />
            <span className="text-lg md:text-2xl font-bold text-center text-[var(--color-text-primary)]">{awayName}</span>
          </Link>
        </div>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-bold font-arabic text-[var(--color-text-primary)] mb-4">قائمة اللاعبين (التشكيل)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text-secondary)] mb-2">تشكيلة أصحاب الأرض</h3>
            <ul>
              {homePlayers.length === 0 ? (
                <li className="text-xs text-[var(--color-text-muted)]">لا يوجد لاعبين مسجلين</li>
              ) : (
                homePlayers.map((p) => (
                  <li key={p.id} className="mb-1">
                    <Link href={`/players/${p.id}`} data-testid="player-link" className="text-[var(--color-accent)] hover:underline">
                      {p.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text-secondary)] mb-2">تشكيلة الضيوف</h3>
            <ul>
              {awayPlayers.length === 0 ? (
                <li className="text-xs text-[var(--color-text-muted)]">لا يوجد لاعبين مسجلين</li>
              ) : (
                awayPlayers.map((p) => (
                  <li key={p.id} className="mb-1">
                    <Link href={`/players/${p.id}`} data-testid="player-link" className="text-[var(--color-accent)] hover:underline">
                      {p.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-2xl p-6 text-center text-[var(--color-text-secondary)]">
        <p>التشكيل وأحداث المباراة ستتوفر قريباً.</p>
      </div>
    </div>
  );
}
