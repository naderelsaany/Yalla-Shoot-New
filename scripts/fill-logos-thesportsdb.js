/**
 * Fill missing team logos from TheSportsDB (free, verified working)
 * Maps Arabic DB names -> TheSportsDB search terms
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const supabase = createClient(
  env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim(),
  env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
);

// Arabic name -> TheSportsDB search term
const SEARCH = {
  'الأهلي': 'Al_Ahly',
  'الزمالك': 'Zamalek',
  'النصر': 'Al_Nassr',
  'الاتحاد': 'Ittihad',
  'ريال مدريد': 'Real_Madrid',
  'ليفربول': 'Liverpool',
  'مانشستر يونايتد': 'Manchester_United',
  'مانشستر سيتي': 'Manchester_City',
  'روما': 'AS_Roma',
  'آرسنال': 'Arsenal',
  'ميلان': 'AC_Milan',
  'تشيلسي': 'Chelsea',
  'يوفنتوس': 'Juventus',
  'باريس سان جيرمان': 'PSG',
  'فنربخشة': 'Fenerbahce',
  'بنفيكا': 'Benfica',
  'أندرلخت': 'Anderlecht',
  'الترجي': 'Esperance',
  'الرجاء': 'Raja',
  'النجم الساحلي': 'Etoile_Sportive_Sahel',
  'الوداد': 'Wydad',
  'بيراميدز': 'Pyramids',
  'المصري': 'Al_Masry',
  'سموحة': 'Smouha',
  'إنبي': 'ENPPI',
  'الاتحاد السكندري': 'Al_Ittihad_Alexandria',
  'بيرنلي': 'Burnley',
  'تولوز': 'Toulouse',
  'ريال سوسييداد': 'Real_Sociedad',
  'أتالانتا': 'Atalanta',
  'إشبيلية': 'Sevilla',
  'سندرلاند': 'Sunderland',
  'ليدز يونايتد': 'Leeds_United',
  'ريكسهام': 'Wrexham',
  'نوتنجهام فوريست': 'Nottingham_Forest',
  'توتنهام هوتسبير': 'Tottenham',
  'جورنيك زابرزي': 'Gornik_Zabrze',
  'إن إي سي نيميجين': 'NEC_Nijmegen',
  'لايبزيج': 'RB_Leipzig',
  'أستون فيلا': 'Aston_Villa',
  'ليون': 'Lyon',
  'أولمبياكوس': 'Olympiacos',
  'مايوركا': 'Mallorca',
  'ريال بيتيس': 'Real_Betis',
  'نيوبورت': 'Newport_County',
  'هابويل بير شيفا': 'Hapoel_Beer_Sheva',
  'جيجو يونايتد': 'Jeju_United',
  'بانكوك جلاس باثوم يونايتد': 'BG_Pathum_United',
};

async function getBadge(term) {
  try {
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${term}`, {
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json();
    if (!json.teams || !json.teams.length) return null;
    // prefer badge, fall back to any team in list
    const t = json.teams.find(x => x.strTeamBadge) || json.teams[0];
    return t.strTeamBadge || null;
  } catch (e) {
    return null;
  }
}

async function main() {
  const { data } = await supabase.from('teams').select('id,name,logo_url');
  const noLogo = (data || []).filter(t => !t.logo_url);
  console.log('Teams without logo:', noLogo.length);

  let updated = 0;
  for (const team of noLogo) {
    const term = SEARCH[team.name];
    if (!term) { console.log('  ⏭️ no mapping for:', team.name); continue; }
    const badge = await getBadge(term);
    if (!badge) { console.log('  ❌ no badge found:', team.name); continue; }
    const { error } = await supabase.from('teams').update({ logo_url: badge }).eq('id', team.id);
    if (error) { console.log('  ❌ update failed:', team.name, error.message); continue; }
    updated++;
    console.log('  ✅', team.name, '<-', badge.slice(0, 60));
  }
  console.log('\n🖼️  Total badges added:', updated, '/', noLogo.length);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
