// Restore missing news images: re-fetch from RSS feeds, download og image, upload to Supabase Storage, update rows.
// Fixes 14 news rows whose bucket files were accidentally deleted (2026-08-07 incident).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Load env
const envPath = path.join(process.cwd(), '.env.local');
const env = fs.readFileSync(envPath, 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
if (!supabaseUrl || !supabaseKey) { console.error('Missing env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

const RSS_FEEDS = [
  { name: 'WinWin', url: 'https://www.winwin.com/rss' },
  { name: 'SkyNews', url: 'https://www.skynewsarabia.com/rss/sport.xml' },
  { name: 'RT', url: 'https://arabic.rt.com/rss/' },
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function normalize(t) {
  return (t || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}

async function fetchFeedXml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml, */*' } });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
  return await res.text();
}

// Minimal XML item parser (title + enclosure url / media:content)
function parseItems(xml) {
  const items = [];
  const itemRe = /<item[\s>][\s\S]*?<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[0];
    const titleM = block.match(/<title(?:[^>]*)>([\s\S]*?)<\/title>/);
    if (!titleM) continue;
    const title = titleM[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    let img = null;
    const enc = block.match(/<enclosure[^>]+url=["']([^"']+)["']/);
    if (enc) img = enc[1];
    const mc = block.match(/<media:content[^>]+url=["']([^"']+)["']/);
    if (!img && mc) img = mc[1];
    const th = block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/);
    if (!img && th) img = th[1];
    items.push({ title: normalize(title), rawTitle: title, img });
  }
  return items;
}

async function downloadImage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://www.google.com/' } });
  if (!res.ok) throw new Error('img HTTP ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error('img too small (' + buf.length + 'B)');
  return buf;
}

async function uploadImage(buf, title) {
  const hash = crypto.createHash('md5').update(title + Date.now()).digest('hex').substring(0, 8);
  const ext = 'jpg';
  const fileName = `news-${hash}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('news-images').upload(fileName, buf, {
    contentType: 'image/jpeg', upsert: false,
  });
  if (error) throw new Error('upload: ' + error.message);
  const { data } = supabase.storage.from('news-images').getPublicUrl(fileName);
  return data.publicUrl;
}

async function main() {
  // 1) Find broken rows
  let files = [];
  for (let offset = 0; offset < 5000; offset += 100) {
    const { data } = await supabase.storage.from('news-images').list('', { limit: 100, offset });
    if (!data || data.length === 0) break;
    files = files.concat(data.map(f => f.name));
  }
  const fileSet = new Set(files);
  const { data: allNews } = await supabase.from('news').select('id,title,image_url,published_at');
  const broken = allNews.filter(n => n.image_url && !fileSet.has(n.image_url.split('/').pop()));
  console.log('Broken rows:', broken.length);

  // 2) Fetch all feeds, build title->image map
  const titleToImg = new Map();
  for (const feed of RSS_FEEDS) {
    try {
      const xml = await fetchFeedXml(feed.url);
      const items = parseItems(xml);
      let withImg = 0;
      for (const it of items) {
        if (it.img) { titleToImg.set(it.title, it.img); withImg++; }
      }
      console.log(`${feed.name}: ${items.length} items, ${withImg} with image`);
    } catch (e) {
      console.log(`${feed.name}: FAILED ${e.message}`);
    }
  }

  // 3) Restore each broken row
  let restored = 0, failed = [];
  for (const row of broken) {
    const nTitle = normalize(row.title);
    // exact match first, then prefix match (35 chars)
    let imgUrl = titleToImg.get(nTitle);
    if (!imgUrl) {
      const prefix = nTitle.substring(0, 35);
      for (const [t, u] of titleToImg) {
        if (t.substring(0, 35) === prefix) { imgUrl = u; break; }
      }
    }
    if (!imgUrl) { failed.push({ title: row.title, reason: 'not in feeds' }); continue; }
    try {
      const buf = await downloadImage(imgUrl);
      const newUrl = await uploadImage(buf, row.title);
      const { error } = await supabase.from('news').update({ image_url: newUrl }).eq('id', row.id);
      if (error) throw new Error(error.message);
      restored++;
      console.log(`✅ ${row.title.substring(0, 50)}`);
    } catch (e) {
      failed.push({ title: row.title, reason: e.message });
    }
  }
  console.log(`\nRestored: ${restored}/${broken.length}`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach(f => console.log('  ❌', f.title.substring(0, 55), '—', f.reason));
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
