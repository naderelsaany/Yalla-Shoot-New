/**
 * Fix Aug 5 stale matches — mark FINISHED with verified scores from Kooora
 * Results verified from kooora.com (أمس tab) on 2026-08-06:
 *  نجوم الدوري الكوري 1-3 مانشستر سيتي | ميلان 1-1 إنتر ميلان | تشيلسي 0-1 يوفنتوس
 *  نابولي 2-1 أوساسونا | أي جي إف 2-1 صباح | فنربخشة 2-0 شتورم جراتس
 *  آرسنال 1-3 ريال بيتيس | مايوركا 3-0 باريس سان جيرمان
 */
const path = require('path');
const fs = require('fs');
const PROJECT_DIR = process.env.CRON_WORKDIR || process.cwd();
try { process.chdir(PROJECT_DIR); } catch (e) {}
const nm = path.join(PROJECT_DIR, 'node_modules');
if (fs.existsSync(nm)) module.paths.unshift(nm);
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync(path.join(PROJECT_DIR, '.env.local'), 'utf-8');
const sup = createClient(
  env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim(),
  env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
);

// (home, away, home_score, away_score)
const results = [
  ['نجوم الدوري الكوري', 'مانشستر سيتي', 1, 3],
  ['ميلان', 'إنتر ميلان', 1, 1],
  ['تشيلسي', 'يوفنتوس', 0, 1],
  ['نابولي', 'أوساسونا', 2, 1],
  ['أي جي إف', 'صباح', 2, 1],
  ['فنربخشة', 'شتورم جراتس', 2, 0],
  ['آرسنال', 'ريال بيتيس', 1, 3],
  ['مايوركا', 'باريس سان جيرمان', 3, 0],
];

(async () => {
  const { data: teams } = await sup.from('teams').select('id,name');
  const tn = {}; (teams || []).forEach(t => tn[t.name] = t.id);
  let done = 0, missing = 0;
  for (const [home, away, hs, as] of results) {
    const homeId = tn[home], awayId = tn[away];
    if (!homeId || !awayId) { console.log(`❌ team missing: ${home} or ${away}`); missing++; continue; }
    const { data: match } = await sup.from('matches').select('id')
      .eq('home_team_id', homeId).eq('away_team_id', awayId)
      .gte('match_date', '2026-08-05T00:00:00Z').lte('match_date', '2026-08-05T23:59:59Z')
      .maybeSingle();
    if (!match) { console.log(`⚠️ no match found: ${home} vs ${away}`); missing++; continue; }
    const { error } = await sup.from('matches').update({
      status: 'FINISHED', home_score: hs, away_score: as,
    }).eq('id', match.id);
    if (error) { console.log(`❌ ${home} vs ${away}: ${error.message}`); }
    else { console.log(`✅ ${home} ${hs}-${as} ${away} → FINISHED`); done++; }
  }
  console.log(`\n📊 updated=${done} missing=${missing}`);
})();
