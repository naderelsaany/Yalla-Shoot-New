/**
 * Self-monitoring maintenance (2026-08-02):
 * 1. Fetch Wikipedia logos for major clubs missing logo_url
 * 2. Add new teams (UCL QR3 + friendlies)
 * 3. Add upcoming matches (Aug 4-5) verified from Kooora
 * Times verified from Kooora (Cairo UTC+3) → converted to UTC
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PROJECT_DIR = process.cwd();
const env = fs.readFileSync(path.join(PROJECT_DIR, '.env.local'), 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

// ---- teams to add (new) ----
const NEW_TEAMS = [
  { name: 'جيجو يونايتد', wiki: 'Jeju United FC' },
  { name: 'بانكوك جلاس باثوم يونايتد', wiki: 'BG Pathum United F.C.' },
  { name: 'أستون فيلا', wiki: 'Aston Villa F.C.' },
  { name: 'هابويل بير شيفا', wiki: 'Hapoel Be\'er Sheva F.C.' },
  { name: 'أولمبياكوس', wiki: 'Olympiacos F.C.' },
  { name: 'كاونو زالغيريس', wiki: 'FK Kauno Žalgiris' },
  { name: 'سبارتا براج', wiki: 'AC Sparta Prague' },
  { name: 'ليون', wiki: 'Olympique Lyonnais' },
  { name: 'نيوبورت', wiki: 'Newport County A.F.C.' },
  { name: 'مايوركا', wiki: 'RCD Mallorca' },
  { name: 'ريال بيتيس', wiki: 'Real Betis' },
  { name: 'نجوم الدوري الكوري', wiki: 'K League' },
];

// ---- existing teams to get logos for (Arabic name -> wiki title) ----
const LOGO_TARGETS = {
  'الأهلي': 'Al Ahly SC',
  'الزمالك': 'Zamalek SC',
  'الهلال': 'Al Hilal SFC',
  'النصر': 'Al Nassr FC',
  'الاتحاد': 'Al-Ittihad Club (Jeddah)',
  'ريال مدريد': 'Real Madrid CF',
  'برشلونة': 'FC Barcelona',
  'ليفربول': 'Liverpool F.C.',
  'مانشستر يونايتد': 'Manchester United F.C.',
  'مانشستر سيتي': 'Manchester City F.C.',
  'بايرن ميونخ': 'FC Bayern Munich',
  'روما': 'AS Roma',
  'نابولي': 'SSC Napoli',
  'أياكس': 'AFC Ajax',
  'آرسنال': 'Arsenal F.C.',
  'ميلان': 'A.C. Milan',
  'إنتر ميلان': 'Inter Milan',
  'تشيلسي': 'Chelsea F.C.',
  'يوفنتوس': 'Juventus F.C.',
  'باريس سان جيرمان': 'Paris Saint-Germain F.C.',
  'فنربخشة': 'Fenerbahçe S.K.',
  'بنفيكا': 'S.L. Benfica',
  'بيشكتاش': 'Beşiktaş J.K.',
  'أندرلخت': 'R.S.C. Anderlecht',
  'مرسيليا': 'Olympique de Marseille',
  'الترجي': 'Espérance Sportive de Tunis',
  'الرجاء': 'Raja CA',
  'النجم الساحلي': 'Étoile Sportive du Sahel',
  'الوداد': 'Wydad AC',
  'بيراميدز': 'Pyramids FC',
  'المصري': 'Al Masry SC',
  'سموحة': 'Smouha SC',
  'إنبي': 'ENPPI SC',
  'الاتحاد السكندري': 'Al Ittihad Alexandria Club',
  'بيرنلي': 'Burnley F.C.',
  'تولوز': 'Toulouse FC',
  'ريال سوسييداد': 'Real Sociedad',
  'فينورد': 'Feyenoord',
  'أتالانتا': 'Atalanta BC',
  'إشبيلية': 'Sevilla FC',
  'جلطة سراي': 'Galatasaray S.K.',
  'سندرلاند': 'Sunderland A.F.C.',
  'ليدز يونايتد': 'Leeds United F.C.',
  'ريكسهام': 'Wrexham A.F.C.',
  'أوتريخت': 'FC Utrecht',
  'فوليندام': 'FC Volendam',
  'سبورتنج لشبونة': 'Sporting CP',
  'نوتنجهام فوريست': 'Nottingham Forest F.C.',
  'توتنهام هوتسبير': 'Tottenham Hotspur F.C.',
  'فيرينتسفاروشي': 'Ferencvárosi TC',
  'جورنيك زابرزي': 'Górnik Zabrze',
  'شتورم جراتس': 'SK Sturm Graz',
  'دينامو زغرب': 'GNK Dinamo Zagreb',
  'النجم الأحمر بلجراد': 'Red Star Belgrade',
  'إن إي سي نيميجين': 'NEC Nijmegen',
  'فولفسبورج': 'VfL Wolfsburg',
  'بوروسيا دورتموند': 'Borussia Dortmund',
  'لايبزيج': 'RB Leipzig',
};

async function fetchWikiLogos() {
  // build title -> arName map
  const titleToAr = {};
  Object.entries(LOGO_TARGETS).forEach(([ar, title]) => { titleToAr[title] = ar; });
  NEW_TEAMS.forEach(t => { titleToAr[t.wiki] = t.name; });

  const titles = Object.keys(titleToAr);
  const logos = {}; // arName -> url
  // batch in chunks of 45
  for (let i = 0; i < titles.length; i += 45) {
    const chunk = titles.slice(i, i + 45);
    const url = 'https://en.wikipedia.org/w/api.php?action=query&titles=' +
      encodeURIComponent(chunk.join('|')) + '&prop=pageimages&format=json&pithumbsize=200&redirects=1';
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const json = await res.json();
    const pages = json.query?.pages || {};
    Object.values(pages).forEach(p => {
      const ar = titleToAr[p.title];
      if (ar && p.thumbnail?.source) logos[ar] = p.thumbnail.source;
    });
  }
  return logos;
}

async function main() {
  console.log('📡 Fetching Wikipedia logos...');
  const logos = await fetchWikiLogos();
  console.log('✅ Got logos for', Object.keys(logos).length, 'teams');

  // ---- 1. Update existing teams' logos ----
  let updated = 0;
  for (const [ar, wikiTitle] of Object.entries(LOGO_TARGETS)) {
    const url = logos[ar];
    if (!url) { console.log('  ⏭️ no wiki logo for:', ar); continue; }
    const { data: existing } = await supabase.from('teams').select('id,logo_url').eq('name', ar).limit(1);
    if (!existing || !existing.length) { console.log('  ⚠️ team not in DB:', ar); continue; }
    if (existing[0].logo_url) { console.log('  ⏭️ already has logo:', ar); continue; }
    const { error } = await supabase.from('teams').update({ logo_url: url }).eq('id', existing[0].id);
    if (error) console.log('  ❌ update failed:', ar, error.message);
    else { updated++; console.log('  ✅ logo added:', ar); }
  }
  console.log('🖼️  Logos updated for', updated, 'teams');

  // ---- 2. Insert new teams ----
  const teamIds = {}; // arName -> id
  for (const t of NEW_TEAMS) {
    // check exists
    const { data: ex } = await supabase.from('teams').select('id').eq('name', t.name).limit(1);
    if (ex && ex.length) { teamIds[t.name] = ex[0].id; console.log('  ⏭️ team exists:', t.name); continue; }
    const { data, error } = await supabase.from('teams').insert({
      name: t.name,
      short_name: t.name,
      logo_url: logos[t.name] || null,
    }).select('id').single();
    if (error) { console.log('  ❌ insert failed:', t.name, error.message); continue; }
    teamIds[t.name] = data.id;
    console.log('  ✅ team added:', t.name, logos[t.name] ? '[logo]' : '[no logo]');
  }

  // ---- 3. Insert matches ----
  const leagueFriendly = '1bf4314d-c7f2-4580-a493-a103c90d316c'; // وديات الأندية
  const leagueUCLQ = '73da951b-5985-4e5b-be2a-0ae1c1c1255b'; // تصفيات دوري أبطال أوروبا

  // resolve ids for existing teams
  async function getTeamId(name) {
    if (teamIds[name]) return teamIds[name];
    const { data } = await supabase.from('teams').select('id').eq('name', name).limit(1);
    return data && data.length ? data[0].id : null;
  }

  const MATCHES = [
    // Aug 4 (Tue) — Kooora Cairo times: 14:00→11:00, 15:30→12:30, 20:30→17:30, 21:00→18:00
    { league: leagueFriendly, home: 'بايرن ميونخ', away: 'جيجو يونايتد', date: '2026-08-04T11:00:00+00:00' },
    { league: leagueFriendly, home: 'نجوم الدوري الكوري', away: 'مانشستر سيتي', date: '2026-08-04T11:00:00+00:00' },
    { league: leagueFriendly, home: 'بانكوك جلاس باثوم يونايتد', away: 'أستون فيلا', date: '2026-08-04T12:30:00+00:00' },
    { league: leagueUCLQ, home: 'هابويل بير شيفا', away: 'النجم الأحمر بلجراد', date: '2026-08-04T17:30:00+00:00' },
    { league: leagueUCLQ, home: 'أولمبياكوس', away: 'إن إي سي نيميجين', date: '2026-08-04T18:00:00+00:00' },
    { league: leagueUCLQ, home: 'دينامو زغرب', away: 'كاونو زالغيريس', date: '2026-08-04T18:00:00+00:00' },
    { league: leagueUCLQ, home: 'سبارتا براج', away: 'ليون', date: '2026-08-04T18:00:00+00:00' },
    { league: leagueFriendly, home: 'نيوبورت', away: 'روما', date: '2026-08-04T18:00:00+00:00' },
    // Aug 5 (Wed) — 13:00→10:00, 14:30→11:30, 21:00→18:00, 21:30→18:30
    { league: leagueFriendly, home: 'ميلان', away: 'إنتر ميلان', date: '2026-08-05T10:00:00+00:00' },
    { league: leagueFriendly, home: 'تشيلسي', away: 'يوفنتوس', date: '2026-08-05T11:30:00+00:00' },
    { league: leagueUCLQ, home: 'فنربخشة', away: 'شتورم جراتس', date: '2026-08-05T18:00:00+00:00' },
    { league: leagueFriendly, home: 'مايوركا', away: 'باريس سان جيرمان', date: '2026-08-05T18:00:00+00:00' },
    { league: leagueFriendly, home: 'آرسنال', away: 'ريال بيتيس', date: '2026-08-05T18:30:00+00:00' },
  ];

  let added = 0;
  for (const m of MATCHES) {
    const homeId = await getTeamId(m.home);
    const awayId = await getTeamId(m.away);
    if (!homeId || !awayId) {
      console.log('  ❌ cannot add:', m.home, 'vs', m.away, '(missing team:', !homeId ? m.home : m.away, ')');
      continue;
    }
    const slug = 'مباراة-' + m.home.replace(/\s+/g, '-') + '-ضد-' + m.away.replace(/\s+/g, '-') + '-2026-' +
      m.date.slice(0, 10).split('-').slice(1).join('-') + '-' + Math.random().toString(36).slice(2, 6);
    const { error } = await supabase.from('matches').insert({
      league_id: m.league,
      home_team_id: homeId,
      away_team_id: awayId,
      match_date: m.date,
      status: 'SCHEDULED',
      slug,
    });
    if (error) console.log('  ❌ insert failed:', m.home, 'vs', m.away, error.message);
    else { added++; console.log('  ✅ match added:', m.home, 'vs', m.away, '—', m.date); }
  }
  console.log(`\n📊 ===== تقرير الصيانة =====\n🖼️  شعارات محدثة: ${updated}\n🆕 فرق جديدة: ${NEW_TEAMS.length}\n⚽ مباريات مضافة: ${added}/${MATCHES.length}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
