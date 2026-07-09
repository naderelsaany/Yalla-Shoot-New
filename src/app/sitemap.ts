import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { League, Match, News } from '@/types/database';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yalla-shoot-new.vercel.app'; // Replace with actual domain when deployed

  // Fetch dynamic routes
  const { data: matches } = await supabase.from('matches').select('id, slug, updated_at, created_at, match_date');
  const { data: news } = await supabase.from('news').select('slug, updated_at');

  const matchUrls: MetadataRoute.Sitemap = matches?.map((m: any) => ({
    url: `${baseUrl}/match/${m.slug || m.id}`,
    lastModified: new Date(m.updated_at || m.created_at || m.match_date).toISOString(),
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
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...matchUrls,
    ...newsUrls,
  ];
}
