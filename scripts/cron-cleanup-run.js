const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const now = new Date();
  // 1. Delete FINISHED matches older than 48h
  const cutoff48 = new Date(now - 48 * 3600 * 1000).toISOString();
  const { data: oldFinished, error: e1 } = await sup.from('matches').select('id').lt('match_date', cutoff48).eq('status', 'FINISHED');
  if (e1) { console.log('ERR select oldFinished:', e1.message); return; }
  console.log('Deleting', oldFinished.length, 'finished matches >48h');
  if (oldFinished.length) {
    const ids = oldFinished.map(m => m.id);
    const { error: d1 } = await sup.from('matches').delete().in('id', ids);
    console.log(d1 ? 'DELETE ERR: ' + d1.message : '✅ deleted old finished');
  }
  // 2. Delete stale SCHEDULED matches whose kickoff already passed (past-due, not finished)
  const { data: stale, error: e2 } = await sup.from('matches').select('id').lt('match_date', now.toISOString()).neq('status', 'FINISHED');
  if (e2) { console.log('ERR select stale:', e2.message); return; }
  console.log('Deleting', stale.length, 'past-due non-finished matches');
  if (stale.length) {
    const ids = stale.map(m => m.id);
    const { error: d2 } = await sup.from('matches').delete().in('id', ids);
    console.log(d2 ? 'DELETE ERR: ' + d2.message : '✅ deleted stale');
  }
  // 3. News older than 15 days — count them (report only, cleanup separate)
  const cutoff15 = new Date(now - 15 * 24 * 3600 * 1000).toISOString();
  const { data: oldNews, error: e3, count } = await sup.from('news').select('id, image_url', { count: 'exact' }).lt('published_at', cutoff15);
  console.log('News older than 15 days:', count ?? oldNews?.length);
})();
