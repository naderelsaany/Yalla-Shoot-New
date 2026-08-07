const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'news-images';
const BASE = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '')}/storage/v1/object/public/${BUCKET}/`;
(async () => {
  // All files in bucket
  const files = new Set();
  for (let offset = 0; offset < 5000; offset += 200) {
    const { data, error } = await sup.storage.from(BUCKET).list('', { limit: 200, offset });
    if (error) { console.log('list ERR', error.message); break; }
    if (!data.length) break;
    data.forEach(f => files.add(f.name));
  }
  console.log('files in bucket:', files.size);
  // All news rows with image_url
  const { data: news, error } = await sup.from('news').select('id, title, image_url').limit(5000);
  if (error) { console.log('news ERR', error.message); return; }
  let missing = [];
  for (const n of news) {
    if (!n.image_url) continue;
    if (!n.image_url.startsWith(BASE)) { missing.push({ ...n, reason: 'external' }); continue; }
    const file = n.image_url.substring(BASE.length).split('?')[0];
    if (!files.has(file)) missing.push({ ...n, reason: 'missing', file });
  }
  console.log('news rows:', news.length, '| missing/external images:', missing.length);
  missing.slice(0, 40).forEach(n => console.log((n.reason === 'missing' ? '❌MISS' : '⚠️EXT'), n.file || n.image_url.substring(0, 60), '|', (n.title || '').substring(0, 45)));
  require('fs').writeFileSync('scripts/_missing-images.json', JSON.stringify(missing, null, 1));
  console.log('saved to scripts/_missing-images.json');
})();
