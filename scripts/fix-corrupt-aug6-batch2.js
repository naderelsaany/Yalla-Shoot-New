// Fix 4 corrupt news images from the stale deployment (2026-08-06 14:49 UTC)
// Root cause: old deployed lambda had UTF-8 round-trip bug (FF → EF BF BD).
// New deployment (force, cache-purged) is fixed — verified by clean news-87b4eb07.
const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => {
  const [k, v] = l.split('=');
  if (k && v) process.env[k] = v;
});
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CORRUPT = [
  'news-94e9d75a-1786027740477.jpg',
  'news-2fb96f3e-1786027742558.jpg',
  'news-03c93d50-1786027743857.jpg',
  'news-85527f80-1786027746860.jpg',
];

async function main() {
  // 1. Find the news rows
  const { data: news, error } = await sup.from('news').select('id, title, image_url').limit(5000);
  if (error) throw error;
  const rows = news.filter(n => CORRUPT.some(c => (n.image_url || '').includes(c)));
  console.log(`Found ${rows.length} corrupt news rows`);

  // 2. Fetch WinWin RSS to find original image URLs
  const rss = await (await fetch('https://www.winwin.com/rss')).text();
  const items = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const block = m[1];
    const title = (block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    const enc = (block.match(/<enclosure url="([^"]+)"/) || [])[1] || '';
    const media = (block.match(/media:content[^>]*url="([^"]+)"/) || [])[1] || '';
    return { title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(), img: enc || media };
  });

  let fixed = 0;
  for (const row of rows) {
    // match by title (normalized)
    const norm = t => t.replace(/\s+/g, ' ').trim();
    const item = items.find(i => norm(i.title) === norm(row.title)) || items.find(i => norm(i.title).includes(norm(row.title).slice(0, 25)));
    if (!item || !item.img) {
      console.log(`⚠️ No RSS image found for: ${row.title}`);
      continue;
    }
    // download
    const resp = await fetch(item.img, { signal: AbortSignal.timeout(20000) });
    const buf = Buffer.from(await resp.arrayBuffer());
    console.log(`Downloaded ${buf.length} bytes from ${item.img.slice(0, 70)}`);
    const magic = buf.subarray(0, 4).toString('hex');
    if (!['ffd8ffe0', 'ffd8ffe1', 'ffd8ffdb', '89504e47'].includes(magic)) {
      console.log(`⚠️ Still bad magic ${magic} — skipping`);
      continue;
    }
    // upload fresh
    const fname = `news-fix-${Date.now()}-${Math.random().toString(36).slice(2, 4)}.jpeg`;
    const { error: upErr } = await sup.storage.from('news-images').upload(fname, buf, { contentType: 'image/jpeg', upsert: true });
    if (upErr) { console.log(`⚠️ Upload failed: ${upErr.message}`); continue; }
    const { data: urlData } = sup.storage.from('news-images').getPublicUrl(fname);
    // update row
    const { error: dbErr } = await sup.from('news').update({ image_url: urlData.publicUrl }).eq('id', row.id);
    if (dbErr) { console.log(`⚠️ DB update failed: ${dbErr.message}`); continue; }
    console.log(`✅ Fixed: ${row.title.slice(0, 50)} → ${fname}`);
    // delete corrupt file
    await sup.storage.from('news-images').remove([CORRUPT.find(c => row.image_url.includes(c))]);
    fixed++;
  }
  console.log(`\nDone. Fixed ${fixed}/${rows.length}`);
}
main().catch(e => { console.error(e); process.exit(1); });
