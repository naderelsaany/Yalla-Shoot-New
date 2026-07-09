import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { League, Match, News } from '@/types/database';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yallashootnew.com'; // Replace with actual domain when deployed

  // Fetch dynamic routes
  const { data: leagues } = await supabase.from('leagues').select('id, updated_at');
  const { data: matches } = await supabase.from('matches').select('id, updated_at');
  const { data: news } = await supabase.from('news').select('slug, updated_at');

  const leagueUrls = leagues?.map((l: Pick<League, 'id' | 'updated_at'>) => ({
    url: `${baseUrl}/leagues/${l.id}`,
    lastModified: new Date(l.updated_at || new Date()),
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  })) || [];

  const matchUrls = matches?.map((m: Pick<Match, 'id' | 'updated_at'>) => ({
    url: `${baseUrl}/match/${m.id}`,
    lastModified: new Date(m.updated_at || new Date()),
    changeFrequency: 'always' as const,
    priority: 0.9,
  })) || [];

  const newsUrls = news?.map((n: Pick<News, 'slug' | 'updated_at'>) => ({
    url: `${baseUrl}/news/${n.slug}`,
    lastModified: new Date(n.updated_at || new Date()),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  })) || [];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
    {
      url: `${baseUrl}/matches`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leagues`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...leagueUrls,
    ...matchUrls,
    ...newsUrls,
  ];
}
