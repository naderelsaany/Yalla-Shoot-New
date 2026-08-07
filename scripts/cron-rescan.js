const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BASE = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '')}/storage/v1/object/public/news-images/`;
(async () => {
  // Re-scan: which of the original missing are still broken now?
  const missing = JSON.parse(require('fs').readFileSync('scripts/_missing-images.json', 'utf-8'));
  const still = [];
  for (const n of missing) {
    const file = (n.image_url || '').split('/news-images/')[1];
    if (!file) continue;
    try {
      const r = await fetch(BASE + file, { method: 'HEAD' });
      if (!r.ok) still.push({ id: n.id, title: n.title, file });
    } catch (e) { still.push({ id: n.id, title: n.title, file }); }
  }
  console.log('STILL BROKEN:', still.length);
  still.forEach(s => console.log(' -', s.title.substring(0, 65), '|', s.file));
  require('fs').writeFileSync('scripts/_still-broken.json', JSON.stringify(still, null, 1));
})();
