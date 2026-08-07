const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  // fetch titles containing key words to find duplicates
  const words = ['أوغندا', 'جريمة', 'صلاح', 'طرابزون', 'فورلان', 'يايسله', 'بيب', 'بوسيتش'];
  for (const w of words) {
    const { data } = await sup.from('news').select('id, title, slug, published_at').ilike('title', `%${w}%`).limit(10);
    if (data && data.length) {
      console.log(`== ${w}: ${data.length}`);
      data.forEach(n => console.log('   ', n.title.substring(0, 70), '|', n.published_at));
    }
  }
})();
