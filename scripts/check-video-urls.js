// Check upcoming matches (next 3 days) for video_url presence
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(l => {
  const i = l.indexOf('='); if (i > 0) process.env[l.slice(0, i)] = l.slice(i + 1);
});
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: matches, error } = await sup.from('matches')
    .select('id, match_date, status, home_team_id, away_team_id, video_url, league_id, slug')
    .gte('match_date', new Date().toISOString())
    .lt('match_date', new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString())
    .order('match_date', { ascending: true });
  if (error) { console.log('err', error.message); return; }
  console.log('Matches in next 3 days:', matches.length);
  const { data: teams } = await sup.from('teams').select('id, name');
  const { data: leagues } = await sup.from('leagues').select('id, name');
  const tmap = Object.fromEntries((teams || []).map(t => [t.id, t.name]));
  const lmap = Object.fromEntries((leagues || []).map(l => [l.id, l.name]));
  (matches || []).forEach(m => {
    console.log(
      (m.match_date || '').substring(0, 16),
      '|', (lmap[m.league_id] || '?').substring(0, 25),
      '|', (tmap[m.home_team_id] || '?').substring(0, 18), 'vs', (tmap[m.away_team_id] || '?').substring(0, 18),
      '|', m.status,
      '| video:', m.video_url ? 'YES' : '❌ NO'
    );
  });
})();
