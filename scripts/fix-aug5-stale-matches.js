/**
 * Fix stale SCHEDULED matches (Aug 4) -> FINISHED with real scores from Kooora
 * Also fix broken Milan/Inter logos
 */
const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const i = l.indexOf('='); if (i > 0) process.env[l.slice(0, i)] = l.slice(i + 1); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// (homeName, awayName, homeScore, awayScore) — from Kooora Aug 4, 2026 (yesterday)
const results = [
  ['بايرن ميونخ', 'جيجو يونايتد', 2, 1],
  ['بورنموث', 'جنوى', 10, 1],
  ['بانكوك جلاس باثوم يونايتد', 'أستون فيلا', 1, 3],
  ['ميالبي', 'سلوفان براتيسلافا', 1, 2],
  ['إيلفيرسبيرج', 'ستراسبورج', 5, 2],
  ['أرارات أرمينيا', 'سيليي', 2, 1],
  ['هابويل بير شيفا', 'النجم الأحمر بلجراد', 1, 0],
  ['ليفيسكي صوفيا', 'كايرات ألماتي', 1, 0],
  ['يونيون سانت جيلواز', 'بودو جليمت', 3, 3],
  ['أولمبياكوس', 'إن إي سي نيميجين', 0, 0],
  ['دينامو زغرب', 'كاونو زالغيريس', 5, 0],
  ['سبارتا براج', 'ليون', 2, 1],
  ['نيوبورت', 'روما', 1, 4],
  ['إبسويتش تاون', 'لو هافر', 1, 0],
];

(async () => {
  for (const [home, away, hs, as] of results) {
    const { data: homeTeam } = await sup.from('teams').select('id').eq('name', home).maybeSingle();
    const { data: awayTeam } = await sup.from('teams').select('id').eq('name', away).maybeSingle();
    if (!homeTeam || !awayTeam) {
      console.log(`❌ team not found: ${home} / ${away}`);
      continue;
    }
    const { data: match } = await sup.from('matches')
      .select('id, status, match_date')
      .eq('home_team_id', homeTeam.id)
      .eq('away_team_id', awayTeam.id)
      .gte('match_date', '2026-08-03T00:00:00Z')
      .lte('match_date', '2026-08-05T00:00:00Z')
      .maybeSingle();
    if (!match) {
      console.log(`⚠️ match not found: ${home} vs ${away}`);
      continue;
    }
    const { error } = await sup.from('matches')
      .update({ status: 'FINISHED', home_score: hs, away_score: as })
      .eq('id', match.id);
    console.log(error ? `❌ ${home} vs ${away}: ${error.message}` : `✅ ${home} ${hs}-${as} ${away} (was ${match.status})`);
  }

  // Fix broken logos (Wikimedia 404s) -> use TheSportsDB badge URLs
  const logoFixes = [
    ['ميلان', 'https://r2.thesportsdb.com/images/media/team/badge/wvspur1448806617.png'],
    ['إنتر ميلان', 'https://r2.thesportsdb.com/images/media/team/badge/ryhu6d1617113103.png'],
  ];
  for (const [name, url] of logoFixes) {
    const { data: team } = await sup.from('teams').select('id').eq('name', name).maybeSingle();
    if (!team) { console.log(`❌ team not found: ${name}`); continue; }
    const { error } = await sup.from('teams').update({ logo_url: url }).eq('id', team.id);
    console.log(error ? `❌ logo ${name}: ${error.message}` : `✅ logo fixed: ${name}`);
  }
})();
