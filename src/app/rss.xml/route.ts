import { supabase } from '@/lib/supabase';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yalla-shoot-new.vercel.app';
  const { data: news } = await supabase
    .from('news')
    .select('title, slug, content, published_at, image_url')
    .order('published_at', { ascending: false })
    .limit(20);

  const items = news?.map(item => `
    <item>
      <title>${escapeXML(item.title)}</title>
      <link>${baseUrl}/news/${item.slug}</link>
      <guid>${baseUrl}/news/${item.slug}</guid>
      <pubDate>${new Date(item.published_at || new Date()).toUTCString()}</pubDate>
      <description>${escapeXML((item.content || '').substring(0, 200))}</description>
      ${item.image_url ? `<enclosure url="${escapeXML(item.image_url)}" type="image/jpeg" />` : ''}
    </item>
  `).join('') || '';

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>يلا شوت نيو - RSS</title>
    <link>${baseUrl}</link>
    <description>آخر الأخبار الرياضية</description>
    <language>ar</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Next.js</generator>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { 'Content-Type': 'application/xml' },
  });
}

function escapeXML(str: string) {
  if (!str) return '';
  return str.replace(/[<>&'"]/g, char => {
    switch (char) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return char;
    }
  });
}
