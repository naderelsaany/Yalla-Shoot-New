const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const missing = JSON.parse(require('fs').readFileSync('scripts/_missing-images.json', 'utf-8'));
  const ids = missing.map(n => n.id).filter(Boolean);
  const { data: news } = await sup.from('news').select('id, title, content, image_url').in('id', ids).limit(50);
  if (!news || !news.length) { console.log('no data'); return; }
  console.log('rows fetched:', news.length);
  for (const n of news) {
    const href = (n.content || '').match(/href="([^"]+)"/)?.[1] || 'NO-LINK';
    const file = (n.image_url || '').split('/news-images/')[1] || '';
    console.log('---');
    console.log('T:', n.title.substring(0, 60));
    console.log('L:', href.substring(0, 110));
    console.log('F:', file);
  }
})();
