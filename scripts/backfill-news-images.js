// Backfill images for news items with null image_url (last 3 days)
const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const i = l.indexOf('='); if (i > 0) { process.env[l.slice(0, i).trim()] = l.slice(i + 1).trim(); } });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function validImage(buf) {
  if (buf.length > 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpeg';
  if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'png';
  if (buf.length > 3 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'gif';
  if (buf.length > 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}
function norm(s) { return (s || '').replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, '').toLowerCase(); }

const FEEDS = [
  'https://www.winwin.com/rss',
  'https://www.skynewsarabia.com/rss/sport.xml',
  'https://arabic.rt.com/rss/',
];

(async () => {
  // 1. Get missing-image news
  const { data: missing } = await sup.from('news').select('id, title').is('image_url', null).gte('published_at', '2026-07-30');
  console.log('missing:', missing.length);

  // 2. Build feed index: normalized title -> image url
  const index = new Map();
  for (const url of FEEDS) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const xml = await res.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let m;
      while ((m = itemRegex.exec(xml)) !== null) {
        const itemXml = m[1];
        const title = (itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || '').trim();
        const image = itemXml.match(/<media:content[^>]*url="([^"]+)"/i)?.[1]
          || itemXml.match(/<enclosure[^>]*url="([^"]+)"/i)?.[1]
          || itemXml.match(/<media:thumbnail[^>]*url="([^"]+)"/i)?.[1];
        if (image) index.set(norm(title), image);
      }
    } catch (e) { console.log('feed err', url, e.message); }
  }
  console.log('feed index size:', index.size);

  // 3. Try to match + download + upload + update
  let fixed = 0;
  for (const item of missing) {
    const key = norm(item.title);
    // try exact, then first 20 chars
    let imgUrl = index.get(key);
    if (!imgUrl) {
      for (const [k, v] of index) { if (k.startsWith(key.substring(0, 20))) { imgUrl = v; break; } }
    }
    if (!imgUrl) { console.log('⏭️ not in feeds:', item.title.substring(0, 50)); continue; }
    try {
      const res = await fetch(imgUrl, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36', 'Referer': 'https://www.winwin.com/' } });
      if (!res.ok) { console.log('⏭️ HTTP', res.status, item.title.substring(0, 40)); continue; }
      let buf = Buffer.from(await res.arrayBuffer());
      let ext = validImage(buf);
      if (!ext) { console.log('⏭️ bad magic', item.title.substring(0, 40), buf.subarray(0, 8).toString('hex')); continue; }
      console.log('   raw:', (buf.length / 1024 / 1024).toFixed(1) + 'MB', ext);
      if (buf.length > 1024 * 1024) {
        try {
          const sharp = require('sharp');
          const c = await sharp(buf, { failOn: 'none' }).rotate().resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
          if (c.length < buf.length) { buf = c; ext = 'jpeg'; }
        } catch (e) { console.log('   compress err:', e.message.substring(0, 50)); }
      }
      const fileName = `news-fix-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const { error: ue } = await sup.storage.from('news-images').upload(fileName, buf, { contentType: `image/${ext}`, upsert: true });
      if (ue) { console.log('❌ upload', ue.message); continue; }
      const { data: urlData } = sup.storage.from('news-images').getPublicUrl(fileName);
      const { error: dbe } = await sup.from('news').update({ image_url: urlData.publicUrl }).eq('id', item.id);
      if (dbe) { console.log('❌ db', dbe.message); continue; }
      fixed++;
      console.log('✅', item.title.substring(0, 50), '→', fileName);
    } catch (e) { console.log('⏭️ err', item.title.substring(0, 40), e.message.substring(0, 40)); }
  }
  console.log('\nfixed:', fixed, '/', missing.length);
})();
