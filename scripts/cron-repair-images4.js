/**
 * REPAIR phase 4: 4 corrupt images (UTF-8-mangled) uploaded by Vercel fetch-news route.
 * Find the correct images in RSS feeds and re-upload with upsert under same filenames.
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36' };

// corrupt file -> news title
const CORRUPT = {
  'news-fb0218e6-1786050500958.jpg': 'الاتحاد يطوي صفحة فابينيو',
  'news-48649eaf-1786050497507.jpg': 'بيان رسمي.. الزمالك يحسم الجدل ويرد على خوان بيزيرا',
  'news-1da5a516-1786050498884.jpg': 'راشفورد يربك حسابات مانشستر يونايتد',
  'news-4339a995-1786050496451.jpg': 'عكس التيار.. الكاف يفاجئ الجميع ويدعم إنفانتينو',
};

const FEEDS = ['https://www.winwin.com/rss', 'https://www.skynewsarabia.com/rss/sport.xml', 'https://arabic.rt.com/rss/'];

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ');
}
function norm(s) { return decodeEntities(s || '').replace(/\s+/g, ' ').trim(); }

async function fetchFeed(url) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  const xml = await r.text();
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml))) {
    const block = m[1];
    const title = (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || '';
    const enc = (block.match(/<enclosure[^>]*url="([^"]+)"/) || [])[1] || '';
    const media = (block.match(/<media:content[^>]*url="([^"]+)"/) || [])[1] || '';
    items.push({ title: norm(title), img: media || enc });
  }
  return items;
}

async function upload(imgUrl, filename) {
  try {
    const img = await fetch(imgUrl, { headers: UA, signal: AbortSignal.timeout(25000) });
    if (!img.ok) return 'img http ' + img.status;
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf.length < 1000) return 'too small ' + buf.length;
    if (buf[0] === 0xef && buf[1] === 0xbf) return 'still corrupt source';
    const { error } = await sup.storage.from('news-images').upload(filename, buf, { contentType: img.headers.get('content-type') || 'image/jpeg', upsert: true });
    return error ? 'up err ' + error.message : 'OK ' + buf.length + 'B';
  } catch (e) { return e.message; }
}

(async () => {
  const allItems = [];
  for (const f of FEEDS) {
    try { allItems.push(...await fetchFeed(f)); } catch (e) { console.log('feed err', f, e.message); }
  }
  console.log('total feed items:', allItems.length);

  for (const [file, title] of Object.entries(CORRUPT)) {
    const key = norm(title);
    // find best match: exact startsWith or includes
    let best = allItems.find(i => i.title === key) ||
               allItems.find(i => i.title.startsWith(key.substring(0, 30))) ||
               allItems.find(i => key.startsWith(i.title.substring(0, 30))) || null;
    if (!best) { console.log('❌ no feed match for', title.substring(0, 40)); continue; }
    if (!best.img) { console.log('❌ match but no image:', title.substring(0, 40)); continue; }
    const res = await upload(best.img, file);
    console.log(`${res.startsWith('OK') ? '✅' : '❌'} ${title.substring(0, 35)} <- ${res} | ${best.img.substring(0, 60)}`);
  }
})();
