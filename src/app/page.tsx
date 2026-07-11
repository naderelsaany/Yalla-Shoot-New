import LiveMatchesList from '@/components/LiveMatchesList';
import { supabase } from '@/lib/supabase';
import { translateName } from '@/lib/translations';
import { MatchWithTeams } from '@/types/database';

import { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "يلا شوت نيو | بث مباشر مباريات اليوم بدون تقطيع Yalla Shoot",
  description: "يلا شوت نيو - تابع مباريات اليوم بث مباشر بدون تقطيع، نتائج المباريات لحظة بلحظة، أهداف اليوم، ترتيب الدوريات، وأحدث الأخبار الرياضية. تغطية حصرية لكأس العالم 2026، دوري أبطال أوروبا، الدوري الإنجليزي، الدوري المصري، والدوري السعودي.",
  keywords: ["يلا شوت", "يلا شوت نيو", "يلا شوت الجديد", "بدون تقطيع", "بجودة HD", "مباشر جوال", "بث مباشر", "مباريات اليوم", "مباريات اليوم بث مباشر", "جدول مباريات اليوم", "يلا شوت بث مباشر مباريات اليوم بدون تقطيع", "نتائج مباريات اليوم", "كأس العالم", "كأس العالم 2026", "اهداف اليوم", "yalla shoot", "yalla shoot new", "koora live", "كورة لايف", "دوري ابطال اوروبا", "الدوري الانجليزي", "الدوري المصري", "الدوري السعودي", "ريال مدريد", "برشلونة", "الاهلي", "الزمالك", "الاهلي اليوم", "الزمالك اليوم", "ليفربول", "مانشستر سيتي"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "يلا شوت نيو | بث مباشر مباريات اليوم بدون تقطيع",
    description: "أسرع تغطية لنتائج المباريات وأهم الأخبار الرياضية. تابع مباريات اليوم بث مباشر بجودة HD.",
    url: "/",
    type: "website",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "يلا شوت نيو" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "يلا شوت نيو | بث مباشر مباريات اليوم بدون تقطيع",
    description: "أسرع تغطية لنتائج المباريات وأهم الأخبار الرياضية. تابع مباريات اليوم بث مباشر بجودة HD.",
    creator: "@yallashootnew",
  },
};

// JSON-LD للصفحة الرئيسية - SportsEvent list with scores
function HomeStructuredData({ matches }: { matches: MatchWithTeams[] }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yalla-shoot-new.vercel.app";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: matches.map((match, index) => {
      const isFinished = match.status === "FINISHED";
      const isLive = match.status === "IN_PLAY" || match.status === "LIVE";
      const homeName = translateName(match.home_team?.name || "");
      const awayName = translateName(match.away_team?.name || "");
      
      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "SportsEvent",
          name: isFinished && match.home_score !== null && match.away_score !== null
            ? `${homeName} ${match.home_score} - ${match.away_score} ${awayName}`
            : `${homeName} ضد ${awayName}`,
          startDate: match.match_date,
          sport: "Soccer",
          eventStatus: isFinished ? "https://schema.org/EventCompleted" : isLive ? "https://schema.org/EventActive" : "https://schema.org/EventScheduled",
          ...(isFinished && match.home_score !== null && match.away_score !== null ? {
            homeScore: { "@type": "Score", player: homeName, value: match.home_score },
            awayScore: { "@type": "Score", player: awayName, value: match.away_score },
          } : {}),
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
            name: translateName(match.league?.name || ""),
          },
          url: `${baseUrl}/match/${match.slug || match.id}`,
        },
      };
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

const getRecentTime = () => new Date(Date.now() - 48 * 60 * 60 * 1000);

export default async function Home() {
  // Fetch recent and upcoming matches (starting from 14 hours ago to cover today's finished matches)
  const recentTime = getRecentTime();

  const { data: matchesData } = await supabase
    .from('matches')
    .select(`
      id,
      slug,
      match_date,
      status,
      home_score,
      away_score,
      home_team:teams!matches_home_team_id_fkey(name, logo_url),
      away_team:teams!matches_away_team_id_fkey(name, logo_url),
      league:leagues(name)
    `)
    .gte('match_date', recentTime.toISOString())
    .order('match_date', { ascending: true })
    .limit(15);

  let matches = matchesData as unknown as MatchWithTeams[] | null;

  // Fallback: If no upcoming/recent matches exist in the DB, fetch the latest past matches so the homepage is never empty.
  if (!matches || matches.length === 0) {
    const { data: fallbackData } = await supabase
      .from('matches')
      .select(`
        id,
        slug,
        match_date,
        status,
        home_score,
        away_score,
        home_team:teams!matches_home_team_id_fkey(name, logo_url),
        away_team:teams!matches_away_team_id_fkey(name, logo_url),
        league:leagues(name)
      `)
      .order('match_date', { ascending: false })
      .limit(15);
      
    matches = fallbackData as unknown as MatchWithTeams[] | null;
  }

  return (
    <div className="flex-1 flex flex-col">
      <HomeStructuredData matches={matches || []} />
      <main className="flex-1 container mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold font-tajawal mb-4 tracking-tight leading-tight">
            يلا شوت نيو - بث مباشر مباريات اليوم <span className="text-[var(--color-accent)]">بدون تقطيع</span>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            شاهد جدول مباريات اليوم عبر يلا شوت الجديد بجودة HD ومباشر جوال. أسرع تغطية لنتائج المباريات، الأهداف، وأهم الأخبار الرياضية في مكان واحد.
          </p>
        </div>

        {/* Matches Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-arabic flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[var(--color-accent)] rounded-full"></span>
              أهم المباريات ({matches?.length || 0})
            </h2>
          </div>

          {/* Grid of Matches */}
          <LiveMatchesList initialMatches={matches || []} />
        </section>

      </main>
    </div>
  );
}
