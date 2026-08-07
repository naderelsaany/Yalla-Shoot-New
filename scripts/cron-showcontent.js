const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const still = JSON.parse(require('fs').readFileSync('scripts/_still-broken.json', 'utf-8'));
  const sportsTitles = still.filter(s => !['اتفاقية التجارة الحرة', 'مجلس الشيوخ', 'مفاعلات', 'بلدية سبتة', 'العتاد العسكري'].some(k => s.title.includes(k)));
  const ids = sportsTitles.map(s => s.id);
  const { data } = await sup.from('news').select('id, title, content').in('id', ids);
  if (!data) return;
  for (const n of data) {
    console.log('===');
    console.log('T:', n.title.substring(0, 70));
    console.log('C:', (n.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 180));
  }
})();
