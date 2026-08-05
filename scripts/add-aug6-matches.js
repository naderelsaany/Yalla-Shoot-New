/**
 * Aug 5 maintenance:
 * 1. Fix Milan-Inter time: 10:00 -> 11:00 UTC (Kooora shows 14:00 Cairo = 11:00 UTC)
 * 2. Add missing teams for Aug 6 matches (Salzburg, Getafe, Shelbourne, Hradec Kralove)
 * 3. Add Aug 6 important matches (Kooora times, Cairo = UTC+3)
 */
const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const i = l.indexOf('='); if (i > 0) process.env[l.slice(0, i)] = l.slice(i + 1); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const EL_Q = 'f8959643-39c8-41e4-baa6-ee87ed9b7ce1'; // تصفيات الدوري الأوروبي
const ECL_Q = 'dc7379d7-d937-44df-b0bb-78ace5bdcc9c'; // تصفيات دوري المؤتمر الأوروبي

const newTeams = [
  { name: 'سالزبورج', short_name: 'سالزبورج', logo_url: 'https://r2.thesportsdb.com/images/media/team/badge/nc2cua1781541639.png' },
  { name: 'خيتافي', short_name: 'خيتافي', logo_url: 'https://r2.thesportsdb.com/images/media/team/badge/eyh2891655594452.png' },
  { name: 'شيلبورن', short_name: 'شيلبورن', logo_url: 'https://r2.thesportsdb.com/images/media/team/badge/brh8t91579281545.png' },
  { name: 'هراديك كرالوف', short_name: 'هراديك كرالوف', logo_url: 'https://r2.thesportsdb.com/images/media/team/badge/ckjzy41691419056.png' },
];

// (league_id, home, away, UTC ISO time) — from Kooora Aug 6 (times shown in Cairo = UTC+3)
const matches = [
  [EL_Q, 'هراديك كرالوف', 'بيشكتاش', '2026-08-06T17:00:00+00:00'],   // 20:00 Cairo
  [EL_Q, 'سالزبورج', 'بافوس', '2026-08-06T17:00:00+00:00'],          // 20:00 Cairo
  [EL_Q, 'باوك سالونيكا', 'أندرلخت', '2026-08-06T17:45:00+00:00'],   // 20:45 Cairo
  [ECL_Q, 'أياكس', 'شيلبورن', '2026-08-06T18:00:00+00:00'],           // 21:00 Cairo
  [EL_Q, 'بنفيكا', 'هارتس', '2026-08-06T19:00:00+00:00'],             // 22:00 Cairo
  [ECL_Q, 'دينامو كييف', 'كاراباج', '2026-08-06T17:00:00+00:00'],     // 20:00 Cairo
];

async function getOrCreateTeam(name) {
  const { data } = await sup.from('teams').select('id').eq('name', name).maybeSingle();
  if (data) return data.id;
  const t = newTeams.find(x => x.name === name);
  const { data: created, error } = await sup.from('teams')
    .insert(t || { name, short_name: name, logo_url: null })
    .select('id').maybeSingle();
  if (error) { console.log(`❌ create team ${name}: ${error.message}`); return null; }
  console.log(`➕ created team: ${name}`);
  return created.id;
}

(async () => {
  // 1. Fix Milan-Inter time
  const { data: milan } = await sup.from('teams').select('id').eq('name', 'ميلان').maybeSingle();
  const { data: inter } = await sup.from('teams').select('id').eq('name', 'إنتر ميلان').maybeSingle();
  if (milan && inter) {
    const { data: m } = await sup.from('matches').select('id')
      .eq('home_team_id', milan.id).eq('away_team_id', inter.id)
      .eq('match_date', '2026-08-05T10:00:00+00:00').maybeSingle();
    if (m) {
      const { error } = await sup.from('matches').update({ match_date: '2026-08-05T11:00:00+00:00' }).eq('id', m.id);
      console.log(error ? `❌ Milan-Inter time: ${error.message}` : '✅ Milan-Inter time fixed to 11:00 UTC (14:00 Cairo)');
    } else {
      console.log('⚠️ Milan-Inter match not found at 10:00 UTC');
    }
  }

  // 2+3. Add matches
  for (const [leagueId, home, away, date] of matches) {
    const homeId = await getOrCreateTeam(home);
    const awayId = await getOrCreateTeam(away);
    if (!homeId || !awayId) { console.log(`❌ skip ${home} vs ${away}`); continue; }
    // avoid duplicates
    const { data: existing } = await sup.from('matches').select('id')
      .eq('home_team_id', homeId).eq('away_team_id', awayId)
      .gte('match_date', '2026-08-06T00:00:00Z').lte('match_date', '2026-08-06T23:59:59Z')
      .maybeSingle();
    if (existing) { console.log(`⏭️ already exists: ${home} vs ${away}`); continue; }
    const slug = `مباراة-${home}-ضد-${away}-2026-08-06-${Math.random().toString(36).substring(2, 6)}`;
    const { error } = await sup.from('matches').insert({
      league_id: leagueId, home_team_id: homeId, away_team_id: awayId,
      match_date: date, status: 'SCHEDULED', slug,
    });
    console.log(error ? `❌ add ${home} vs ${away}: ${error.message}` : `✅ added: ${home} vs ${away} @ ${date}`);
  }
})();
