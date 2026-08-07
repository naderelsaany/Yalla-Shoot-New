const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const names = ['الزمالك', 'الأهلي', 'الرمثا', 'لايبزيغ', 'نيوكاسل', 'طرابزون', 'ريال مدريد'];
  const { data, error } = await sup.from('teams').select('name, logo_url').in('name', names);
  console.log('error:', error ? error.message : 'none');
  (data || []).forEach(t => console.log(' -', t.name, '|', (t.logo_url || '').substring(0, 80)));
})();
