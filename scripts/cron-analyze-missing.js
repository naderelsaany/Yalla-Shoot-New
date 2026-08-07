const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const missing = JSON.parse(require('fs').readFileSync('scripts/_missing-images.json', 'utf-8'));
  console.log('=== MISSING IMAGE ROWS (full detail) ===');
  for (const n of missing) {
    console.log('---');
    console.log('title:', n.title);
    console.log('img:', n.image_url);
  }
  // Check for duplicate titles (same title, different rows)
  console.log('\n=== DUPLICATE TITLE CHECK ===');
  const { data: news } = await sup.from('news').select('id, title, slug, image_url').limit(5000);
  const byTitle = {};
  for (const n of news) {
    const t = (n.title || '').trim().toLowerCase();
    (byTitle[t] = byTitle[t] || []).push(n);
  }
  let dupCount = 0;
  for (const [t, arr] of Object.entries(byTitle)) {
    if (arr.length > 1) {
      dupCount++;
      console.log(`DUP(${arr.length}):`, t.substring(0, 50));
      for (const a of arr) console.log('   ', a.id, a.slug.substring(0, 60), '| img:', (a.image_url || '').split('/news-images/')[1] || 'none');
    }
  }
  console.log('\ntotal dup title groups:', dupCount);
})();
