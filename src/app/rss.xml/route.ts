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
      <guid isPermaLink="true">${baseUrl}/news/${item.slug}</guid>
      <pubDate>${new Date(item.published_at || new Date()).toUTCString()}</pubDate>
      <description>${escapeXML((item.content || '').substring(0, 300))}</description>
      <category>رياضة</category>
      <category>كرة قدم</category>
      ${item.image_url ? `
      <enclosure url="${escapeXML(item.image_url)}" type="image/jpeg" length="0" />
      <media:content url="${escapeXML(item.image_url)}" medium="image" />
      ` : ''}
    </item>
  `).join('') || '';

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>يلا شوت نيو - آخر الأخبار الرياضية</title>
    <link>${baseUrl}</link>
    <description>تابع آخر الأخبار الرياضية الحصرية، نتائج المباريات، انتقالات اللاعبين، وتغطية كأس العالم 2026 من يلا شوت نيو.</description>
    <language>ar-sa</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>يلا شوت نيو RSS</generator>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <webMaster>info@yallashootnew.com (فريق يلا شوت نيو)</webMaster>
    <copyright>جميع الحقوق محفوظة © يلا شوت نيو</copyright>
    <image>
      <url>${baseUrl}/icon-192.png</url>
      <title>يلا شوت نيو</title>
      <link>${baseUrl}</link>
      <width>192</width>
      <height>192</height>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

function escapeXML(str: string) {
  if (!str) return '';
  return str.replace(/[<>&'\"]/g, char => {
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
