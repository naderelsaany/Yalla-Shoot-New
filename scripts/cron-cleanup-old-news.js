const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'news-images';
const BASE = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '')}/storage/v1/object/public/${BUCKET}/`;
(async () => {
  const cutoff = new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString();
  const { data: oldNews, error } = await sup.from('news').select('id, image_url').lt('published_at', cutoff).limit(5000);
  if (error) { console.log('ERR:', error.message); return; }
  console.log('Old news to remove:', oldNews.length);
  let removed = 0, imgRemoved = 0, imgFail = 0;
  for (const n of oldNews) {
    if (n.image_url && n.image_url.startsWith(BASE)) {
      const file = n.image_url.substring(BASE.length).split('?')[0];
      if (file) {
        const { error: re } = await sup.storage.from(BUCKET).remove([file]);
        if (re) { imgFail++; console.log('  img fail', file, re.message); } else imgRemoved++;
      }
    }
    const { error: de } = await sup.from('news').delete().eq('id', n.id);
    if (de) { console.log('  del fail', n.id, de.message); } else removed++;
  }
  console.log(`✅ deleted ${removed} news rows, ${imgRemoved} images removed, ${imgFail} img failures`);
})();
