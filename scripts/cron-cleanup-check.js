const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const now = new Date();
  const cutoff48 = new Date(now - 48 * 3600 * 1000).toISOString();
  const { data: oldFinished } = await sup.from('matches').select('id, slug, match_date, status').lt('match_date', cutoff48).eq('status', 'FINISHED');
  console.log('FINISHED older than 48h:', oldFinished?.length);
  const { data: stale } = await sup.from('matches').select('id, slug, match_date, status').lt('match_date', new Date(now - 6 * 3600 * 1000).toISOString()).neq('status', 'FINISHED');
  console.log('PAST-due non-finished:', stale?.length);
  if (stale) stale.forEach(m => console.log('  ', m.match_date, m.status, (m.slug || '').substring(0, 60)));
  const { data: upcoming } = await sup.from('matches').select('id, match_date, status, slug').gte('match_date', new Date(now - 6 * 3600 * 1000).toISOString()).order('match_date').limit(25);
  console.log('UPCOMING/live count:', upcoming?.length);
  if (upcoming) upcoming.forEach(m => console.log('  ', m.match_date, m.status, (m.slug || '').substring(0, 60)));
})();
