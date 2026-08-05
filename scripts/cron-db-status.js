/**
 * DB status snapshot for self-monitoring cron (temp diagnostic script)
 */
const path = require('path');
const fs = require('fs');
const PROJECT_DIR = process.env.CRON_WORKDIR || process.cwd();
process.chdir(PROJECT_DIR);
const nodeModulesPath = path.join(PROJECT_DIR, 'node_modules');
if (fs.existsSync(nodeModulesPath)) module.paths.unshift(nodeModulesPath);
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync(path.join(PROJECT_DIR, '.env.local'), 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { count: m } = await supabase.from('matches').select('*', { count: 'exact', head: true });
  const { count: n } = await supabase.from('news').select('*', { count: 'exact', head: true });
  const { count: t } = await supabase.from('teams').select('*', { count: 'exact', head: true });
  const { count: l } = await supabase.from('leagues').select('*', { count: 'exact', head: true });
  console.log('COUNTS matches=' + m + ' news=' + n + ' teams=' + t + ' leagues=' + l);

  const { data: upcoming } = await supabase.from('matches')
    .select('id, match_date, status, home_team_id, away_team_id, external_id')
    .gte('match_date', new Date(Date.now() - 3 * 3600 * 1000).toISOString())
    .order('match_date').limit(15);
  console.log('--- upcoming/live (next 15) ---');
  for (const mm of upcoming || []) console.log(mm.match_date, '|', mm.status, '| ext:', mm.external_id || '-');

  const { data: finished48 } = await supabase.from('matches')
    .select('id, match_date, status, home_team_id, away_team_id')
    .eq('status', 'FINISHED')
    .lt('match_date', new Date(Date.now() - 48 * 3600 * 1000).toISOString())
    .order('match_date', { ascending: false }).limit(10);
  console.log('--- FINISHED older than 48h (last 10) count above ---');
  const { count: finOld } = await supabase.from('matches').select('*', { count: 'exact', head: true })
    .eq('status', 'FINISHED').lt('match_date', new Date(Date.now() - 48 * 3600 * 1000).toISOString());
  console.log('FINISHED>48h count = ' + finOld);
  for (const mm of finished48 || []) console.log(mm.match_date, '|', mm.status);

  const { data: recentNews } = await supabase.from('news')
    .select('title, published_at, image_url').order('published_at', { ascending: false }).limit(6);
  console.log('--- latest news ---');
  for (const nn of recentNews || []) {
    console.log(nn.published_at?.substring(0, 10), '|', (nn.title || '').substring(0, 55), '| img:', (nn.image_url || '').substring(0, 50));
  }

  const { data: teams } = await supabase.from('teams').select('name, logo_url').limit(300);
  const noLogo = (teams || []).filter(t => !t.logo_url).length;
  const extLogos = (teams || []).filter(t => t.logo_url && !t.logo_url.includes('supabase.co')).length;
  console.log('--- teams: total=' + (teams || []).length + ' noLogo=' + noLogo + ' externalLogos=' + extLogos);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
