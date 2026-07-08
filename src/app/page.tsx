import LiveMatchesList from '@/components/LiveMatchesList';
import { supabase } from '@/lib/supabase';
import { translateName } from '@/lib/translations';

import { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "يلا شوت نيو | بث مباشر لمباريات اليوم وكأس العالم",
  description: "تابع مباريات اليوم بث مباشر بدون تقطيع على يلا شوت نيو. تغطية حصرية لكأس العالم، دوري أبطال أوروبا، والدوريات الكبرى.",
  alternates: {
    canonical: "https://yallashootnew.com",
  },
  openGraph: {
    title: "يلا شوت نيو | بث مباشر لمباريات اليوم",
    description: "أسرع تغطية لنتائج المباريات وأهم الأخبار الرياضية.",
    url: "https://yallashootnew.com",
    type: "website",
  },
};

// JSON-LD للصفحة الرئيسية - SportsEvent list
function HomeStructuredData({ matches }: { matches: any[] }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: matches.map((match, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SportsEvent",
        name: `${translateName(match.home_team?.name || "")} ضد ${translateName(match.away_team?.name || "")}`,
        startDate: match.match_date,
        sport: "Soccer",
        homeTeam: {
          "@type": "SportsTeam",
          name: translateName(match.home_team?.name || ""),
          image: match.home_team?.logo_url,
        },
        awayTeam: {
          "@type": "SportsTeam",
          name: translateName(match.away_team?.name || ""),
          image: match.away_team?.logo_url,
        },
        location: {
          "@type": "Place",
          name: translateName(match.league?.name || ""),
        },
        url: `https://yallashootnew.com/match/${match.id}`,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default async function Home() {
  // Fetch recent and upcoming matches (starting from 14 hours ago to cover today's finished matches)
  const recentTime = new Date(Date.now() - 14 * 60 * 60 * 1000);

  const { data: matches } = await supabase
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
    `)
    .gte('match_date', recentTime.toISOString())
    .order('match_date', { ascending: true })
    .limit(15);

  return (
    <div className="flex-1 flex flex-col">
      <HomeStructuredData matches={matches || []} />
      <main className="flex-1 container mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold font-tajawal mb-4 tracking-tight">
            تابع مباريات اليوم <span className="text-[var(--color-accent)]">لحظة بلحظة</span>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl mx-auto">
            أسرع تغطية لنتائج المباريات وأهم الأخبار الرياضية في مكان واحد.
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
