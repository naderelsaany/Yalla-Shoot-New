// Scan all news image_urls — check which return non-200 from Supabase Storage
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// load .env.local
fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(l => {
  const [k, v] = l.split('=');
  if (k && v) process.env[k] = v.trim();
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/news-images/';

async function check(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    clearTimeout(t);
    return res.status;
  } catch (e) {
    return 'ERR';
  }
}

(async () => {
  const { data: news, error } = await supabase.from('news').select('id, title, image_url, published_at').order('published_at', { ascending: false }).limit(300);
  if (error) { console.log('DB error:', error.message); return; }
  console.log('Total news fetched:', news.length);
  let broken = 0, external = 0, ok = 0;
  for (const n of news) {
    if (!n.image_url) { console.log('NO IMAGE:', n.title.substring(0, 60)); broken++; continue; }
    if (!n.image_url.includes('supabase.co/storage')) { console.log('EXTERNAL:', n.image_url.substring(0, 90), '|', n.title.substring(0, 50)); external++; continue; }
    const status = await check(n.image_url);
    if (status !== 200) {
      broken++;
      console.log(`BROKEN [${status}]:`, n.image_url.split('/').pop(), '|', n.title.substring(0, 55));
    } else ok++;
  }
  console.log(`\n=== SUMMARY: ok=${ok} broken=${broken} external=${external} noimage=${news.length - ok - broken - external} ===`);
})();
