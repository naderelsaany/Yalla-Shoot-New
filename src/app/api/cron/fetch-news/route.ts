import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import Parser from 'rss-parser';

const RSS_FEEDS = [
  // Sky News Arabia Sports
  { url: 'https://www.skynewsarabia.com/rss/sport.xml', lang: 'ar' },
  // WinWin Football News
  { url: 'https://www.winwin.com/rss', lang: 'ar' },
];

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parser = new Parser();
    const supabase = getServiceSupabase();
    let totalInserted = 0;
    let totalProcessed = 0;

    for (const feedConfig of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedConfig.url);
        const latestItems = feed.items.slice(0, 10);

        for (const item of latestItems) {
          if (!item.title) continue;
          totalProcessed++;

          // Extract image from multiple possible sources
          let imageUrl = null;
          if (item.enclosure?.url) {
            imageUrl = item.enclosure.url;
          }
          // WinWin uses media:content as well (rss-parser maps this to mediaContent or similar)
          if (!imageUrl && (item as any).mediaContent?.url) {
            imageUrl = (item as any).mediaContent.url;
          }
          // Fallback: try to extract from content HTML
          if (!imageUrl && item.content) {
            const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/);
            if (imgMatch) imageUrl = imgMatch[1];
          }

          // Check for duplicate by title
          const { data: existingNews } = await supabase
            .from('news')
            .select('id')
            .eq('title', item.title)
            .maybeSingle();

          if (!existingNews) {
            // Generate slug from title
            const titleClean = item.title.replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '');
            const slug = titleClean + '-' + Date.now();

            const rawContent = (item.contentSnippet || item.content || '');
            const excerpt = rawContent.length > 300 ? rawContent.substring(0, 300) + '...' : rawContent;
            const originalLink = item.link 
              ? `<br><br><a href="${item.link}" target="_blank" rel="nofollow noopener" style="color: var(--color-accent); font-weight: bold;">اقرأ الخبر كاملاً من المصدر الرسمي</a>` 
              : '';
            const content = excerpt + originalLink;

            const { error } = await supabase.from('news').insert({
              title: item.title,
              slug: slug,
              content: content,
              image_url: imageUrl,
              published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            });

            if (error) {
              console.error(`Insert error (${feedConfig.url}):`, error);
            } else {
              totalInserted++;
            }
          }
        }
      } catch (feedError) {
        console.error(`Failed to parse feed ${feedConfig.url}:`, feedError);
        // Continue to next feed
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${totalProcessed} items across ${RSS_FEEDS.length} feeds. Inserted ${totalInserted} new news.`,
    });
  } catch (error) {
    console.error('News Cron Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
