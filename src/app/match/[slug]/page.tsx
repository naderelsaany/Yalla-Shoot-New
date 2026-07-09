import { supabase } from "@/lib/supabase";
import { translateName } from "@/lib/translations";
import TeamLogo from "@/components/TeamLogo";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MatchWithTeams } from "@/types/database";

export const revalidate = 30;

export async function generateStaticParams() {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const { data: matches } = await supabase
    .from('matches')
    .select('id, slug')
    .gte('match_date', startDate.toISOString())
    .lte('match_date', endDate.toISOString())
    .limit(200);
  return matches?.map((match) => ({ slug: match.slug || match.id })) || [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yalla-shoot-new.vercel.app";
  let query = supabase
    .from("matches")
    .select(`
      home_score,
      away_score,
      status,
      match_date,
      home_team:teams!matches_home_team_id_fkey(id, name),
      away_team:teams!matches_away_team_id_fkey(id, name),
      league:leagues(name)
    `);
    
  if (isUUID) {
    query = query.or(`slug.eq.${decodedSlug},id.eq.${decodedSlug}`);
  } else {
    query = query.eq("slug", decodedSlug);
  }

  const { data: match } = await query.single();

  if (!match) return { title: "مباراة غير موجودة | يلا شوت نيو" };

  const matchData = match as unknown as MatchWithTeams;
  const home = translateName(matchData.home_team?.name || "");
  const away = translateName(matchData.away_team?.name || "");
  const league = translateName(matchData.league?.name || "");
  
  // Dynamic title based on match status
  let title: string;
  let description: string;
  let ogTitle: string;
  
  if (matchData.status === "FINISHED" && matchData.home_score !== null && matchData.away_score !== null) {
    const score = `${matchData.home_score}-${matchData.away_score}`;
    title = `${home} ${matchData.home_score}-${matchData.away_score} ${away} — ${league} | يلا شوت نيو`;
    description = `🔴 نتيجة مباراة ${home} ضد ${away} في ${league}: ${home} ${score} ${away}. ملخص وأهداف وأحداث المباراة الكاملة.`;
    ogTitle = `${home} ${score} ${away} | ${league}`;
  } else if (matchData.status === "IN_PLAY" || matchData.status === "LIVE") {
    title = `🟢 ${home} ضد ${away} — ${league} (مباشر الآن) | يلا شوت نيو`;
    description = `مشاهدة مباراة ${home} ضد ${away} في ${league} بث مباشر. أحداث المباراة لحظة بلحظة وتغطية حصرية.`;
    ogTitle = `🟢 ${home} ضد ${away} — ${league} (مباشر)`;
  } else {
    title = `مباراة ${home} ضد ${away} — ${league} | يلا شوت نيو`;
    description = `موعد مباراة ${home} ضد ${away} في بطولة ${league}، القنوات الناقلة، البث المباشر والتشكيل المتوقع.`;
    ogTitle = `مباراة ${home} ضد ${away} — ${league}`;
  }

  // Build status-specific keywords
  let resultKeywords = "";
  if (matchData.status === "FINISHED" && matchData.home_score !== null && matchData.away_score !== null) {
    const winner = matchData.home_score > matchData.away_score ? home : away;
    resultKeywords = `نتيجة ${home} و ${away}, فوز ${winner}, ${home} ${matchData.home_score}-${matchData.away_score} ${away}, أهداف ${home} ${away}, ملخص مباراة ${home} ${away}, `;
  } else if (matchData.status === "IN_PLAY" || matchData.status === "LIVE") {
    resultKeywords = `${home} ضد ${away} مباشر, بث مباشر ${home} ${away}, نتيجة مباراة ${home} ${away} الآن, `;
  } else {
    resultKeywords = `موعد مباراة ${home} ${away}, موعد مباراة ${home} ضد ${away}, القنوات الناقلة ${home} ${away}, `;
  }

  return {
    title,
    description,
    keywords: `${home} ضد ${away}, نتيجة مباراة ${home} و ${away}, ${resultKeywords}${league}, بث مباشر, يلا شوت نيو, مباريات اليوم, كرة قدم, كورة لايف`,
    alternates: {
      canonical: `/match/${slug}`,
    },
    openGraph: {
      title: ogTitle,
      description,
      url: `/match/${slug}`,
      type: "article",
      publishedTime: matchData.match_date,
      siteName: "يلا شوت نيو",
      locale: "ar_AR",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

function MatchStructuredData({ match }: { match: MatchWithTeams }) {
  const homeName = translateName(match.home_team?.name || "");
  const awayName = translateName(match.away_team?.name || "");
  const leagueName = translateName(match.league?.name || "");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yalla-shoot-new.vercel.app";
  const matchUrl = `${baseUrl}/match/${match.slug || match.id}`;

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${homeName} ضد ${awayName}`,
    startDate: match.match_date,
    sport: "Soccer",
    description: match.status === "FINISHED" 
      ? `مباراة ${homeName} ضد ${awayName} في بطولة ${leagueName}. النتيجة: ${homeName} ${match.home_score}-${match.away_score} ${awayName}`
      : `مباراة ${homeName} ضد ${awayName} في بطولة ${leagueName}`,
    url: matchUrl,
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

  // Add result data for finished matches (Google rich snippets)
  if (match.status === "FINISHED" && match.home_score !== null && match.away_score !== null) {
    structuredData.competitor = [
      {
        "@type": "SportsTeam",
        name: homeName,
        score: match.home_score,
        image: match.home_team?.logo_url,
      },
      {
        "@type": "SportsTeam",
        name: awayName,
        score: match.away_score,
        image: match.away_team?.logo_url,
      },
    ];
    structuredData.result = {
      "@type": "SportsEvent",
      homeTeam: { name: homeName, score: match.home_score },
      awayTeam: { name: awayName, score: match.away_score },
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {match.video_url && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "VideoObject",
              "name": `${homeName} ضد ${awayName}`,
              "description": `بث مباشر لمباراة ${homeName} ضد ${awayName}`,
              "embedUrl": match.video_url,
              "uploadDate": match.match_date,
              "thumbnailUrl": "https://yalla-shoot-new.vercel.app/icon-192.png"
            })
          }}
        />
      )}
    </>
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
        item: process.env.NEXT_PUBLIC_BASE_URL || "https://yalla-shoot-new.vercel.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: leagueName,
      },
      {
        "@type": "ListItem",
        position: 3,
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

export default async function MatchDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug);
  let query = supabase
    .from("matches")
    .select(`
      id,
      match_date,
      status,
      home_score,
      away_score,
      video_url,
      slug,
      home_team:teams!matches_home_team_id_fkey(id, name, logo_url),
      away_team:teams!matches_away_team_id_fkey(id, name, logo_url),
      league:leagues(name)
    `);

  if (isUUID) {
    query = query.or(`slug.eq.${decodedSlug},id.eq.${decodedSlug}`);
  } else {
    query = query.eq("slug", decodedSlug);
  }

  const { data: matchData } = await query.single();

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
        const { data: dataClub } = await supabase
          .from("players")
          .select("id, name")
          .eq("club", match.home_team.name);
        const { data: dataNational } = await supabase
          .from("players")
          .select("id, name")
          .eq("national_team", match.home_team.name);
        
        const merged = [...(dataClub || []), ...(dataNational || [])];
        homePlayers = Array.from(new Map(merged.map(p => [p.id, p])).values());
    } catch {}
  }

  if (match.away_team?.name) {
    try {
        const { data: dataClub } = await supabase
          .from("players")
          .select("id, name")
          .eq("club", match.away_team.name);
        const { data: dataNational } = await supabase
          .from("players")
          .select("id, name")
          .eq("national_team", match.away_team.name);
        
        const merged = [...(dataClub || []), ...(dataNational || [])];
        awayPlayers = Array.from(new Map(merged.map(p => [p.id, p])).values());
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

      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)]">الرئيسية</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">{leagueName}</span>
      </nav>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-6 md:p-10 shadow-[var(--shadow-elevated)] relative overflow-hidden mb-8">
        <h1 className="text-xl md:text-3xl font-bold font-arabic text-center text-[var(--color-text-primary)] mb-2">
          {match.status === "FINISHED" 
            ? `${homeName} ${match.home_score}-${match.away_score} ${awayName}`
            : `${homeName} ضد ${awayName}`
          }
        </h1>
        <div className="text-center mb-6">
          <p className="text-[var(--color-text-secondary)] font-tajawal text-sm">{leagueName}</p>
          <p className="text-[var(--color-text-secondary)] font-tajawal mt-1">{dateString} • {timeString}</p>
          {match.status === "FINISHED" && (
            <p className="text-sm font-bold text-[var(--color-text-secondary)] mt-2 bg-[var(--color-bg-elevated)] px-3 py-1 rounded-full border border-[var(--color-border-subtle)] inline-block">
              نهاية المباراة
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div
            data-testid="team-link-home"
            className="flex flex-col items-center gap-4 flex-1"
          >
            <TeamLogo src={match.home_team?.logo_url ?? undefined} alt={homeName} size="lg" priority />
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
                {(match.status === "IN_PLAY" || match.status === "LIVE") && (
                  <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-live)] animate-pulse mt-2 bg-[var(--color-live)]/10 px-3 py-1 rounded-full border border-[var(--color-live)]/20">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-live)]"></span>
                    مباشر الآن
                  </span>
                )}
              </div>
            )}
          </div>

          <div
            data-testid="team-link-away"
            className="flex flex-col items-center gap-4 flex-1"
          >
            <TeamLogo src={match.away_team?.logo_url ?? undefined} alt={awayName} size="lg" priority />
            <span className="text-lg md:text-2xl font-bold text-center text-[var(--color-text-primary)]">{awayName}</span>
          </div>
        </div>
      </div>

      {match.video_url && (
        <div className="mt-8 mb-8 bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold font-arabic text-lg text-[var(--color-text-primary)] mb-4">البث المباشر</h2>
          <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-inner">
            {(() => {
              const url = match.video_url as string;
              const isDirectVideo = /\.(mp4|webm|ogg|m3u8)$/i.test(url.split('?')[0]);
              
              if (isDirectVideo) {
                return <video controls className="w-full h-full" src={url} />;
              }
              
              let iframeUrl = url;
              if (url.includes('youtube.com') || url.includes('youtu.be')) {
                iframeUrl = url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/');
              }
              
              return (
                <iframe
                  src={iframeUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              );
            })()}
          </div>
        </div>
      )}

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-bold font-arabic text-[var(--color-text-primary)] mb-4">قائمة اللاعبين (التشكيل)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text-secondary)] mb-2">تشكيلة أصحاب الأرض</h3>
            <ul>
              {homePlayers.length === 0 ? (
                <li className="text-sm text-[var(--color-text-secondary)]">سيتم إضافة قائمة اللاعبين قريباً</li>
              ) : (
                homePlayers.map((p) => (
                  <li key={p.id} className="mb-1">
                    <span data-testid="player-name" className="text-[var(--color-text-primary)]">
                      {p.name}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text-secondary)] mb-2">تشكيلة الضيوف</h3>
            <ul>
              {awayPlayers.length === 0 ? (
                <li className="text-sm text-[var(--color-text-secondary)]">سيتم إضافة قائمة اللاعبين قريباً</li>
              ) : (
                awayPlayers.map((p) => (
                  <li key={p.id} className="mb-1">
                    <span data-testid="player-name" className="text-[var(--color-text-primary)]">
                      {p.name}
                    </span>
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
