// تحديث نتائج مباريات 31 يوليو 2026 — تم التحقق من كووورة + Vavel
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

// النتائج: [فريق البيت، فريق الضيف، نتيجة البيت، نتيجة الضيف]
// المصدر: كووورة (مباريات أمس) + Vavel (سبورتنج-نوتنجهام)
const RESULTS = [
  ['موناكو', 'سيركل بروج', 2, 2],
  ['فولفسبورج', 'تيلستار', 3, 1],
  ['يوفنتوس', 'نيس', 2, 0],
  ['ريال سوسييداد', 'تولوز', 1, 2],
  ['إشبيلية', 'إن إي سي نيميجين', 2, 1],
  ['برمنجهام سيتي', 'برشلونة', 2, 2],
  ['سبورتنج لشبونة', 'نوتنجهام فوريست', 4, 1],
];

async function main() {
  for (const [homeName, awayName, hs, as] of RESULTS) {
    const { data: home } = await supabase.from('teams').select('id').ilike('name', homeName).maybeSingle();
    const { data: away } = await supabase.from('teams').select('id').ilike('name', awayName).maybeSingle();
    if (!home || !away) { console.log(`❌ فريق غير موجود: ${homeName} (${home?'✓':'✗'}) / ${awayName} (${away?'✓':'✗'})`); continue; }
    const { data: match } = await supabase.from('matches').select('id, status, home_score, away_score')
      .eq('home_team_id', home.id).eq('away_team_id', away.id)
      .gte('match_date', '2026-07-30T00:00:00Z').lte('match_date', '2026-08-01T00:00:00Z')
      .maybeSingle();
    if (!match) { console.log(`❌ ماتش غير موجود: ${homeName} vs ${awayName}`); continue; }
    const { error } = await supabase.from('matches').update({
      status: 'FINISHED', home_score: hs, away_score: as, updated_at: new Date().toISOString()
    }).eq('id', match.id);
    console.log(error ? `❌ ${homeName} vs ${awayName}: ${error.message}` : `✅ ${homeName} ${hs}-${as} ${awayName} (كان ${match.status} ${match.home_score}-${match.away_score})`);
  }
}
main();
