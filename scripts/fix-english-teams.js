/**
 * Self-monitoring maintenance (2026-08-03):
 * Translate English-named teams to Arabic (national teams + Algerian clubs),
 * delete irrelevant clutter (MLS Next Pro II, U21 teams) — all have 0 match refs.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PROJECT_DIR = process.cwd();
const env = fs.readFileSync(path.join(PROJECT_DIR, '.env.local'), 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

// ---- national teams + Algerian clubs -> Arabic ----
const TRANSLATE = {
  // national teams
  'Mexico': 'المكسيك', 'South Korea': 'كوريا الجنوبية', 'Canada': 'كندا', 'Qatar': 'قطر',
  'Morocco': 'المغرب', 'Haiti': 'هايتي', 'Australia': 'أستراليا', 'Turkey': 'تركيا',
  'Ivory Coast': 'ساحل العاج', 'Curaçao': 'كوراساو', 'Curacao': 'كوراساو', 'Japan': 'اليابان',
  'Tunisia': 'تونس', 'New Zealand': 'نيوزيلندا', 'Cape Verde Islands': 'الرأس الأخضر',
  'Saudi Arabia': 'السعودية', 'Norway': 'النرويج', 'Iraq': 'العراق', 'Algeria': 'الجزائر',
  'Portugal': 'البرتغال', 'Uzbekistan': 'أوزبكستان', 'Croatia': 'كرواتيا', 'Panama': 'بنما',
  'South Africa': 'جنوب أفريقيا', 'Czechia': 'التشيك', 'Czech Republic': 'التشيك',
  'Bosnia-Herzegovina': 'البوسنة والهرسك', 'Bosnia & Herzegovina': 'البوسنة والهرسك',
  'Brazil': 'البرازيل', 'Scotland': 'اسكتلندا', 'Paraguay': 'باراغواي', 'Germany': 'ألمانيا',
  'Ecuador': 'الإكوادور', 'Netherlands': 'هولندا', 'Sweden': 'السويد', 'Iran': 'إيران',
  'Spain': 'إسبانيا', 'Uruguay': 'أوروغواي', 'France': 'فرنسا', 'Senegal': 'السنغال',
  'Austria': 'النمسا', 'Jordan': 'الأردن', 'Congo DR': 'الكونغو الديمقراطية',
  'England': 'إنجلترا', 'Ghana': 'غانا', 'Korea Republic': 'كوريا الجنوبية',
  'USA': 'أمريكا', 'United States': 'الولايات المتحدة', 'Mozambique': 'موزمبيق',
  'Grenada': 'غرينادا', 'Jamaica': 'جامايكا', 'Iceland': 'آيسلندا',
  'Trinidad & Tobago': 'ترينيداد وتوباغو', 'Uganda': 'أوغندا', 'Gabon': 'الغابون',
  'Angola': 'أنغولا', 'Guatemala': 'غواتيمالا', 'Bolivia': 'بوليفيا', 'China': 'الصين',
  'Belgium': 'بلجيكا', 'Argentina': 'الأرجنتين', 'Egypt': 'مصر', 'Switzerland': 'سويسرا',
  'Colombia': 'كولومبيا',
  // Algerian clubs (Ligue 1 — covered by API sync)
  'Mc Alger': 'مولودية الجزائر', 'Usm Alger': 'اتحاد الجزائر', 'Js Kabylie': 'شبيبة القبائل',
  'Cr Belouizdad': 'شباب بلوزداد', 'Mc Oran': 'مولودية وهران', 'Cs Constantine': 'شباب قسنطينة',
  'Es Setif': 'وفاق سطيف', 'Paradou Ac': 'أتلتيك بارادو', 'Js Saoura': 'اتحاد الساورة',
  'Olympique Akbou': 'أولمبي أقبو', 'Es Mostaganem': 'اتحاد مستغانم',
  'Usm Khenchela': 'اتحاد خنشلة', 'Aso Chlef': 'أولمبي الشلف',
  'Es Ben Aknoun': 'اتحاد بن عكنون', 'Mc El Bayadh': 'مولودية البيض',
  'Mb Rouissat': 'مولودية الرويسات',
};

// ---- teams to DELETE (irrelevant clutter, 0 match refs) ----
const DELETE_PATTERNS = [
  / U21$/, / Ii$/, / II$/, / 2$/, / FC II$/, / City FC II$/, / Timbers II$/,
];
const DELETE_EXACT = ['Chattanooga', 'Connecticut United', 'Real Monarchs', 'Crown Legacy FC'];

async function main() {
  const { data: teams, error } = await supabase.from('teams').select('id, name');
  if (error) throw error;
  const eng = teams.filter((t) => /^[A-Za-z]/.test(t.name));
  console.log(`English-named teams: ${eng.length}`);

  // ---- 1. translate ----
  let translated = 0, missing = [];
  for (const t of eng) {
    const ar = TRANSLATE[t.name];
    if (!ar) { missing.push(t.name); continue; }
    const { error: ue } = await supabase.from('teams').update({ name: ar, short_name: ar }).eq('id', t.id);
    if (ue) console.log('  ❌ update fail:', t.name, ue.message);
    else translated++;
  }
  console.log(`✅ translated: ${translated}`);
  console.log(`⚠️  no mapping (will delete or keep): ${missing.length}`);
  missing.forEach((m) => console.log('   ', m));

  // ---- 2. delete clutter ----
  let deleted = 0;
  for (const t of eng) {
    const shouldDelete = DELETE_EXACT.includes(t.name) || DELETE_PATTERNS.some((p) => p.test(t.name));
    if (!shouldDelete) continue;
    // double-check no match refs
    const { data: refs } = await supabase.from('matches').select('id').or(`home_team_id.eq.${t.id},away_team_id.eq.${t.id}`).limit(1);
    if (refs && refs.length) { console.log('  ⚠️ SKIP (has matches):', t.name); continue; }
    const { error: de } = await supabase.from('teams').delete().eq('id', t.id);
    if (de) console.log('  ❌ delete fail:', t.name, de.message);
    else { deleted++; console.log('  🗑️  deleted:', t.name); }
  }
  console.log(`🗑️  deleted clutter: ${deleted}`);

  // ---- 3. report duplicates after translation ----
  const { data: after } = await supabase.from('teams').select('name');
  const seen = {}, dups = [];
  (after || []).forEach((t) => { seen[t.name] = (seen[t.name] || 0) + 1; });
  Object.entries(seen).forEach(([n, c]) => { if (c > 1) dups.push(`${n} x${c}`); });
  console.log(`🔁 duplicate names after fix: ${dups.length}`);
  dups.forEach((d) => console.log('   ', d));

  const [{ count: tc }] = await Promise.all([supabase.from('teams').select('id', { count: 'exact' })]);
  console.log(`📊 teams now: ${tc}`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
