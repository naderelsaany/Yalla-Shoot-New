// Find original RSS images for the 4 corrupt news items
const TARGETS = [
  'النزيف مستمر',
  'أتلتيكو مدريد يجهز عرضًا',
  'ريال مدريد سيضم ديوماندي',
  'ريجيكامب ينجح مبكرا',
];
const FEEDS = [
  { name: 'WinWin', url: 'https://www.winwin.com/rss' },
  { name: 'SkyNews', url: 'https://www.skynewsarabia.com/rss/sport.xml' },
  { name: 'RT', url: 'https://arabic.rt.com/rss/' },
];
(async () => {
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, { signal: AbortSignal.timeout(15000) });
      const xml = await res.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let m;
      while ((m = itemRegex.exec(xml)) !== null) {
        const itemXml = m[1];
        const title = (itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || '').trim();
        for (const t of TARGETS) {
          if (title.includes(t)) {
            const image = itemXml.match(/<media:content[^>]*url="([^"]+)"/i)?.[1]
              || itemXml.match(/<enclosure[^>]*url="([^"]+)"/i)?.[1]
              || itemXml.match(/<media:thumbnail[^>]*url="([^"]+)"/i)?.[1];
            console.log(feed.name, '|', title.substring(0, 70), '\n   IMG:', image);
          }
        }
      }
    } catch (e) { console.log(feed.name, 'ERR', e.message); }
  }
})();
