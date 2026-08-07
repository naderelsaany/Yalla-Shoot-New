const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  // check Uganda article and جريمة article side by side
  const { data: ug } = await sup.from('news').select('id, title, content, image_url').ilike('title', '%أوغندا%').limit(5);
  console.log('UGANDA articles:');
  (ug || []).forEach(n => console.log(' -', n.title.substring(0, 60), '| img ok?', (n.image_url || '').slice(-30)));
  const { data: cr } = await sup.from('news').select('id, title, content, image_url').ilike('title', '%جريمة%').limit(5);
  console.log('CRIME articles:');
  (cr || []).forEach(n => console.log(' -', n.title.substring(0, 60), '|', (n.content || '').replace(/<[^>]+>/g, ' ').substring(0, 120)));
  // handball article
  const { data: hb } = await sup.from('news').select('id, title, content').ilike('title', '%ناشئات%').limit(3);
  console.log('HANDBALL articles:');
  (hb || []).forEach(n => console.log(' -', n.title.substring(0, 60), '|', (n.content || '').replace(/<[^>]+>/g, ' ').substring(0, 120)));
})();
