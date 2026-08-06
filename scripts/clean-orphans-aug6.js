// Orphan image check: files in news-images bucket not referenced by any news row
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(l => {
  const i = l.indexOf('='); if (i > 0) process.env[l.slice(0, i)] = l.slice(i + 1);
});
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/news-images/';

(async () => {
  const { data: news } = await sup.from('news').select('image_url').limit(5000);
  const referenced = new Set((news || []).map(r => r.image_url).filter(Boolean).map(u => decodeURIComponent(u.split('/news-images/')[1] || '')));
  console.log('referenced files:', referenced.size);

  let orphans = [];
  for (let offset = 0; offset < 5000; offset += 100) {
    const { data: files, error } = await sup.storage.from('news-images').list('', { limit: 100, offset });
    if (error) { console.log('list err:', error.message); break; }
    if (!files || files.length === 0) break;
    files.forEach(f => { if (!referenced.has(f.name)) orphans.push(f.name); });
    if (files.length < 100) break;
  }
  console.log('orphans found:', orphans.length);
  if (orphans.length > 0) {
    console.log('sample:', orphans.slice(0, 5));
    // delete orphans in batches of 100
    for (let i = 0; i < orphans.length; i += 100) {
      const batch = orphans.slice(i, i + 100);
      const { error } = await sup.storage.from('news-images').remove(batch);
      if (error) console.log('del err:', error.message);
    }
    console.log('deleted', orphans.length, 'orphans');
  }
})();
