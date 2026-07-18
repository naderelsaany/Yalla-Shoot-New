import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { generateSlug } from '@/lib/slug';
import { Match, News } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yalla-shoot-new.vercel.app';

  // Fetch dynamic routes
  const { data: matches } = await supabase.from('matches').select('id, slug, updated_at, created_at, match_date, status');
  const { data: news } = await supabase.from('news').select('slug, updated_at');
  const { data: teams } = await supabase.from('teams').select('id, name, updated_at').limit(200);
  const { data: leagues } = await supabase.from('leagues').select('id, name, updated_at').limit(30);

  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const matchUrls: MetadataRoute.Sitemap = matches?.map((m: Partial<Match>) => {
    const isFinished = m.status === 'FINISHED';
    const isLive = m.status === 'IN_PLAY' || m.status === 'LIVE';
    
    let changeFreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    let priority: number;

    if (isLive) {
      changeFreq = 'always';
      priority = 0.9;
    } else if (isFinished) {
      changeFreq = 'weekly';
      priority = 0.6;
    } else {
      const matchDate = new Date(m.match_date || now);
      if (matchDate < weekLater) {
        changeFreq = 'daily';
        priority = 0.8;
      } else {
        changeFreq = 'weekly';
        priority = 0.7;
      }
    }

    return {
      url: `${baseUrl}/match/${m.slug || m.id}`,
      lastModified: new Date(m.updated_at || m.created_at || m.match_date || now).toISOString(),
      changeFrequency: changeFreq,
      priority,
    };
  }) || [];

  const newsUrls = news?.map((n: Pick<News, 'slug' | 'updated_at'>) => {
    const newsDate = new Date(n.updated_at || now);
    const daysSinceUpdate = Math.floor((now.getTime() - newsDate.getTime()) / (1000 * 60 * 60 * 24));
    return {
      url: `${baseUrl}/news/${n.slug}`,
      lastModified: newsDate.toISOString(),
      changeFrequency: (daysSinceUpdate < 2 ? 'daily' : daysSinceUpdate < 7 ? 'weekly' : 'monthly') as "daily" | "weekly" | "monthly",
      priority: daysSinceUpdate < 2 ? 0.8 : daysSinceUpdate < 7 ? 0.6 : 0.4,
    };
  }) || [];

  const teamUrls: MetadataRoute.Sitemap = teams?.map(t => ({
    url: `${baseUrl}/team/${generateSlug(t.name)}`,
    lastModified: new Date(t.updated_at || now).toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.5,
  })) || [];

  const leagueUrls: MetadataRoute.Sitemap = leagues?.map(l => ({
    url: `${baseUrl}/league/${generateSlug(l.name)}`,
    lastModified: new Date(l.updated_at || now).toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  })) || [];

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'always',
      priority: 1,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/teams`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/leagues`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    ...matchUrls,
    ...newsUrls,
    ...teamUrls,
    ...leagueUrls,
  ];
}
