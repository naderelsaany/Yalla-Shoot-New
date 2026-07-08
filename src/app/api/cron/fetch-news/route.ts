import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import Parser from 'rss-parser';

// You can use any reliable public Arabic sports RSS feed
const RSS_FEED_URL = 'https://www.skynewsarabia.com/rss/sport.xml';

export async function GET() {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(RSS_FEED_URL);
    const supabase = getServiceSupabase();

    let insertedCount = 0;

    // Process the latest 10 news items
    const latestItems = feed.items.slice(0, 10);

    for (const item of latestItems) {
      if (!item.title) continue;

      // Extract image if available in enclosure or content
      let imageUrl = null;
      if (item.enclosure?.url) {
        imageUrl = item.enclosure.url;
      }

      // We use the 'title' as the unique identifier constraint (conceptually)
      // to avoid duplicates. Since we don't have a unique constraint on title in DB,
      // we do a select first.
      const { data: existingNews } = await supabase
        .from('news')
        .select('id')
        .eq('title', item.title)
        .maybeSingle();

      if (!existingNews) {
        // Generate a simple slug from title or fallback to timestamp
        const slug = item.title.replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '') + '-' + Date.now();

        const { error } = await supabase.from('news').insert({
          title: item.title,
          slug: slug,
          content: item.contentSnippet || item.content || '',
          image_url: imageUrl,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        });
        
        if (error) {
          console.error('Insert error:', error);
        } else {
          insertedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${latestItems.length} news items. Inserted ${insertedCount} new news.`,
    });
  } catch (error: any) {
    console.error('News Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
