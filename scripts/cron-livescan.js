const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'news-images';
(async () => {
  // get all news image_urls
  let all = [];
  for (let off = 0; off < 5000; off += 1000) {
    const { data } = await sup.from('news').select('image_url').range(off, off + 999);
    if (!data || !data.length) break;
    all = all.concat(data);
  }
  const referenced = new Set(all.map(r => (r.image_url || '').split('/news-images/')[1]).filter(Boolean));

  // list all files in bucket (paginate 100)
  const files = [];
  for (let off = 0; ; off += 100) {
    const { data, error } = await sup.storage.from(BUCKET).list('', { limit: 100, offset: off });
    if (error) { console.log('list error:', error.message); break; }
    if (!data || !data.length) break;
    files.push(...data.map(f => f.name));
  }

  const fileSet = new Set(files);
  const missing = [...referenced].filter(f => !fileSet.has(f));
  const orphans = files.filter(f => !referenced.has(f));

  console.log('news rows:', all.length, '| referenced files:', referenced.size, '| bucket files:', files.length);
  console.log('MISSING (referenced but not in bucket):', missing.length);
  missing.forEach(f => console.log('  ❌', f));
  console.log('ORPHANS (in bucket but not referenced):', orphans.length);
  console.log('sample orphans:', orphans.slice(0, 5).join(', '));
})();
