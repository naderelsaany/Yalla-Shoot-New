import { supabase } from "@/lib/supabase";
import { translateName } from "@/lib/translations";
import TeamLogo from "@/components/TeamLogo";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: match } = await supabase
    .from("matches")
    .select(`
      home_team:teams!matches_home_team_id_fkey(name),
      away_team:teams!matches_away_team_id_fkey(name),
      league:leagues(name)
    `)
    .eq("id", id)
    .single();

  if (!match) return { title: "مباراة غير موجودة | يلا شوت نيو" };

  const home = translateName((match.home_team as any)?.name || "");
  const away = translateName((match.away_team as any)?.name || "");
  const league = translateName((match.league as any)?.name || "");

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

function MatchStructuredData({ match }: { match: any }) {
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
        ? "https://schema.org/EventScheduled" 
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
        item: `https://yallashootnew.com/matches`,
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

  const { data: match } = await supabase
    .from("matches")
    .select(`
      id,
      match_date,
      status,
      home_score,
      away_score,
      home_team:teams!matches_home_team_id_fkey(name, logo_url),
      away_team:teams!matches_away_team_id_fkey(name, logo_url),
      league:leagues(name)
    `)
    .eq("id", id)
    .single();

  if (!match) {
    notFound();
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

  const homeName = translateName((match.home_team as any)?.name || "");
  const awayName = translateName((match.away_team as any)?.name || "");
  const leagueName = translateName((match.league as any)?.name || "");

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
          <div className="flex flex-col items-center gap-4 flex-1">
            <TeamLogo src={(match.home_team as any)?.logo_url} alt={homeName} size="lg" />
            <span className="text-lg md:text-2xl font-bold text-center text-[var(--color-text-primary)]">{homeName}</span>
          </div>

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

          <div className="flex flex-col items-center gap-4 flex-1">
            <TeamLogo src={(match.away_team as any)?.logo_url} alt={awayName} size="lg" />
            <span className="text-lg md:text-2xl font-bold text-center text-[var(--color-text-primary)]">{awayName}</span>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-2xl p-6 text-center text-[var(--color-text-secondary)]">
        <p>التشكيل وأحداث المباراة ستتوفر قريباً.</p>
      </div>
    </div>
  );
}
