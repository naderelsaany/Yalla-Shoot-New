/**
 * Fill missing team logos from Wikipedia REST summary API (page/summary)
 * The /330px- thumbnail is the article lead image (club crest for most clubs)
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const supabase = createClient(
  env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim(),
  env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
);

const WIKI = {
  'الأهلي': 'Al_Ahly_SC', 'الزمالك': 'Zamalek_SC', 'النصر': 'Al_Nassr_FC',
  'الاتحاد': 'Al-Ittihad_Club_(Jeddah)', 'ريال مدريد': 'Real_Madrid_CF',
  'ليفربول': 'Liverpool_F.C.', 'مانشستر يونايتد': 'Manchester_United_F.C.',
  'مانشستر سيتي': 'Manchester_City_F.C.', 'روما': 'AS_Roma', 'آرسنال': 'Arsenal_F.C.',
  'ميلان': 'A.C._Milan', 'تشيلسي': 'Chelsea_F.C.', 'يوفنتوس': 'Juventus_FC',
  'باريس سان جيرمان': 'Paris_Saint-Germain_F.C.', 'فنربخشة': 'Fenerbahçe_S.K.',
  'بنفيكا': 'S.L._Benfica', 'أندرلخت': 'R.S.C._Anderlecht',
  'الترجي': 'Espérance_Sportive_de_Tunis', 'الرجاء': 'Raja_CA',
  'النجم الساحلي': 'Étoile_Sportive_du_Sahel', 'الوداد': 'Wydad_AC',
  'بيراميدز': 'Pyramids_FC', 'المصري': 'Al_Masry_SC', 'سموحة': 'Smouha_SC',
  'إنبي': 'ENPPI_SC', 'الاتحاد السكندري': 'Al_Ittihad_Alexandria_Club',
  'بيرنلي': 'Burnley_F.C.', 'تولوز': 'Toulouse_FC', 'ريال سوسييداد': 'Real_Sociedad',
  'أتالانتا': 'Atalanta_BC', 'إشبيلية': 'Sevilla_FC', 'سندرلاند': 'Sunderland_A.F.C.',
  'ليدز يونايتد': 'Leeds_United_F.C.', 'ريكسهام': 'Wrexham_A.F.C.',
  'نوتنجهام فوريست': 'Nottingham_Forest_F.C.', 'توتنهام هوتسبير': 'Tottenham_Hotspur_F.C.',
  'جورنيك زابرزي': 'Górnik_Zabrze', 'إن إي سي نيميجين': 'NEC_Nijmegen',
  'لايبزيج': 'RB_Leipzig', 'أستون فيلا': 'Aston_Villa_F.C.',
  'ليون': 'Olympique_Lyonnais', 'أولمبياكوس': 'Olympiacos_F.C.',
  'مايوركا': 'RCD_Mallorca', 'ريال بيتيس': 'Real_Betis',
  'نيوبورت': 'Newport_County_A.F.C.', 'هابويل بير شيفا': 'Hapoel_Be\'er_Sheva_F.C.',
  'جيجو يونايتد': 'Jeju_United_FC', 'بانكوك جلاس باثوم يونايتد': 'BG_Pathum_United_F.C.',
  'أتلتيكو مدريد': 'Atlético_Madrid', 'بورتو': 'FC_Porto', 'موناكو': 'AS_Monaco_FC',
  'نيس': 'OGC_Nice', 'نيوكاسل يونايتد': 'Newcastle_United_F.C.',
  'فيردر بريمن': 'SV_Werder_Bremen', 'ماينتس': '1._FSV_Mainz_05',
  'بي إس في': 'PSV_Eindhoven', 'دينامو كييف': 'FC_Dynamo_Kyiv',
  'باوك سالونيكا': 'PAOK_FC', 'هامبورج': 'Hamburger_SV', 'بوخوم': 'VfL_Bochum',
  'لانس': 'RC_Lens', 'مالاجا': 'Málaga_CF', 'ليفانتي': 'Levante_UD',
  'ستاندارد لييج': 'Standard_Liège', 'سيركل بروج': 'Cercle_Brugge_K.S.V.',
  'ميتييلاند': 'FC_Midtjylland', 'هايدوك سبليت': 'HNK_Hajduk_Split',
  'أوستريا فيينا': 'FK_Austria_Wien', 'سانت جالين': 'FC_St._Gallen',
  'سسكا صوفيا': 'PFC_CSKA_Sofia', 'تفينتي': 'FC_Twente', 'كاراباج': 'Qarabağ_FK',
  'فينيسيا': 'Venezia_FC', 'هارتس': 'Heart_of_Midlothian_F.C.',
  'اسطنبول باشاك شهير': 'İstanbul_Başakşehir_F.K.', 'سبورتنج براجا': 'S.C._Braga',
  'الشباب': 'Al_Shabab_FC_(Riyadh)', 'الرياض': 'Al_Riyadh_SC', 'الأخدود': 'Al-Okhdood_Club',
  'الفيحاء': 'Al_Fayha_FC', 'العروبة': 'Al_Orubah_FC', 'القادسية': 'Al_Qadsiah_FC',
  'الخليج': 'Al_Khaleej_FC', 'الفتح': 'Al_Fateh_SC', 'الصفاقسي': 'CS_Sfaxien',
  'شباب أهلي دبي': 'Shabab_Al_Ahli_Club', 'أوكلاند': 'Auckland_City_FC',
  'إف سي طوكيو': 'FC_Tokyo', 'إف سي إنتر توركو': 'FC_Inter_Turku',
  'تيلستار': 'SC_Telstar', 'برمنجهام سيتي': 'Birmingham_City_F.C.',
  'جيتسهيد': 'Gateshead_F.C.', 'فورتونا دوسيلدورف': 'Fortuna_Düsseldorf',
  'زليزنكار بانسيفو': 'FK_Železničar_Pančevo', 'هاميربي': 'Hammarby_IF',
  'بافوس': 'Pafos_FC', 'لارني': 'Larne_F.C.', 'ثون': 'FC_Thun',
  'أتلتيك بلباو': 'Athletic_Bilbao', 'روتاش إيجرن': 'Rot-Weiß_Oberhausen',
  'أودا': 'Odds_BK', 'ميلان': 'A.C._Milan',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getThumb(title) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title), {
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'YallaShootNewBot/1.0 (site maintenance)' },
      });
      if (r.status === 429) { await sleep(3000); continue; }
      if (!r.ok) return null;
      const j = await r.json();
      return j.thumbnail?.source || null;
    } catch (e) { await sleep(1500); }
  }
  return null;
}

async function main() {
  const { data } = await supabase.from('teams').select('id,name,logo_url');
  const noLogo = (data || []).filter(t => !t.logo_url);
  console.log('Teams without logo:', noLogo.length);

  let updated = 0, skipped = 0;
  for (const team of noLogo) {
    const title = WIKI[team.name];
    if (!title) { skipped++; continue; }
    const thumb = await getThumb(title);
    if (!thumb) { console.log('  ❌ no thumb:', team.name); continue; }
    const { error } = await supabase.from('teams').update({ logo_url: thumb }).eq('id', team.id);
    if (error) { console.log('  ❌ update failed:', team.name, error.message); continue; }
    updated++;
    console.log('  ✅', team.name);
    await sleep(250);
  }
  console.log(`\n🖼️  Logos added: ${updated} | unmapped (kept fallback): ${skipped}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
