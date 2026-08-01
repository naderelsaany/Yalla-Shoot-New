// فحص آخر 3 روابط خارجية متبقية
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const supabase = createClient(
  env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim(),
  env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
);
(async () => {
  const { data } = await supabase.from('news')
    .select('id,title,image_url,published_at')
    .not('image_url', 'like', '%supabase.co%')
    .not('image_url', 'is', null)
    .limit(10);
  for (const n of data || []) {
    console.log('---', (n.published_at || '').substring(0, 10), '|', n.title.substring(0, 60));
    console.log('   ', n.image_url);
    try {
      const r = await fetch(n.image_url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0', 'Referer': 'https://www.winwin.com/' },
      });
      const buf = Buffer.from(await r.arrayBuffer());
      console.log('   HTTP', r.status, '| size', (buf.length / 1024).toFixed(0) + 'KB', '| magic:', buf.subarray(0, 4).toString('hex'));
    } catch (e) { console.log('   ERR:', e.message); }
  }
})();
