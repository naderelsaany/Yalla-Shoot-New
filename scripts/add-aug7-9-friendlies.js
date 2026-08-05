/**
 * Aug 7-9 friendly matches (from Kooora, Cairo time = UTC+3)
 * Self-monitoring cron auto-add — important club friendlies only
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

const FRIENDLY_LEAGUE = '1bf4314d-c7f2-4580-a493-a103c90d316c'; // وديات الأندية

const newTeams = [
  { name: 'باير ليفركوزن', short_name: 'ليفركوزن', logo_url: 'https://r2.thesportsdb.com/images/media/team/badge/3x9k851726760113.png' },
  { name: 'خيتافي', short_name: 'خيتافي', logo_url: 'https://r2.thesportsdb.com/images/media/team/badge/eyh2891655594452.png' },
  { name: 'برايتون', short_name: 'برايتون', logo_url: 'https://r2.thesportsdb.com/images/media/team/badge/ywypts1448810904.png' },
  { name: 'جوهور دار التعظيم', short_name: 'جوهور', logo_url: 'https://r2.thesportsdb.com/images/media/team/badge/8cq3lk1752771555.png' },
  { name: 'مارسيليا', short_name: 'مارسيليا', logo_url: 'https://r2.thesportsdb.com/images/media/team/badge/c6bazh1779212287.png' },
  { name: 'أتلتيك بيلباو', short_name: 'بيلباو', logo_url: 'https://r2.thesportsdb.com/images/media/team/badge/68w7fe1639408210.png' },
];

// (home, away, UTC ISO) — Kooora Cairo time minus 3h
const matches = [
  // Aug 7 (Friday)
  ['بايرن ميونخ', 'أستون فيلا', '2026-08-07T12:00:00+00:00'],      // 15:00 Cairo
  // Aug 8 (Saturday)
  ['يوفنتوس', 'إنتر ميلان', '2026-08-08T11:00:00+00:00'],          // 14:00 Cairo
  ['تشيلسي', 'ميلان', '2026-08-08T12:00:00+00:00'],                // 15:00 Cairo
  ['ليدز يونايتد', 'لايبزيج', '2026-08-08T13:00:00+00:00'],        // 16:00 Cairo
  ['باير ليفركوزن', 'إشبيلية', '2026-08-08T13:30:00+00:00'],       // 16:30 Cairo
  ['توتنهام هوتسبير', 'خيتافي', '2026-08-08T14:00:00+00:00'],      // 17:00 Cairo
  ['برايتون', 'روما', '2026-08-08T14:00:00+00:00'],                // 17:00 Cairo
  // Aug 9 (Sunday)
  ['جوهور دار التعظيم', 'تشيلسي', '2026-08-09T11:00:00+00:00'],    // 14:00 Cairo
  ['مانشستر سيتي', 'أتلتيكو مدريد', '2026-08-09T11:00:00+00:00'],  // 14:00 Cairo
  ['آرسنال', 'بوروسيا دورتموند', '2026-08-09T13:00:00+00:00'],     // 16:00 Cairo
  ['ليفربول', 'موناكو', '2026-08-09T13:30:00+00:00'],              // 16:30 Cairo
  ['مارسيليا', 'أتلتيك بيلباو', '2026-08-09T15:30:00+00:00'],      // 18:30 Cairo
];

async function getOrCreateTeam(name) {
  const { data } = await sup.from('teams').select('id').eq('name', name).maybeSingle();
  if (data) return data.id;
  const t = newTeams.find(x => x.name === name);
  const { data: created, error } = await sup.from('teams')
    .insert(t || { name, short_name: name, logo_url: null })
    .select('id').maybeSingle();
  if (error) { console.log(`❌ create team ${name}: ${error.message}`); return null; }
  console.log(`➕ team: ${name}`);
  return created.id;
}

(async () => {
  let added = 0, skipped = 0, failed = 0;
  for (const [home, away, date] of matches) {
    const homeId = await getOrCreateTeam(home);
    const awayId = await getOrCreateTeam(away);
    if (!homeId || !awayId) { failed++; console.log(`❌ skip ${home} vs ${away}`); continue; }
    const day = date.substring(0, 10);
    const { data: existing } = await sup.from('matches').select('id')
      .eq('home_team_id', homeId).eq('away_team_id', awayId)
      .gte('match_date', day + 'T00:00:00Z').lte('match_date', day + 'T23:59:59Z')
      .maybeSingle();
    if (existing) { skipped++; console.log(`⏭️ exists: ${home} vs ${away}`); continue; }
    const slug = `مباراة-${home}-ضد-${away}-${day}-${Math.random().toString(36).substring(2, 6)}`;
    const { error } = await sup.from('matches').insert({
      league_id: FRIENDLY_LEAGUE, home_team_id: homeId, away_team_id: awayId,
      match_date: date, status: 'SCHEDULED', slug,
    });
    if (error) { failed++; console.log(`❌ add ${home} vs ${away}: ${error.message}`); }
    else { added++; console.log(`✅ ${home} vs ${away} @ ${date}`); }
  }
  console.log(`\n📊 added=${added} skipped=${skipped} failed=${failed}`);
})();
