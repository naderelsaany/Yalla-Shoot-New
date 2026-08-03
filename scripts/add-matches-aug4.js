/**
 * Self-monitoring (2026-08-03): add missing UCL Q3 qualifier matches + friendlies
 * for Aug 4 from Kooora schedule (verified times, Cairo local -> UTC).
 * Creates missing teams (with Wikipedia logo attempt) then inserts matches.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PROJECT_DIR = process.cwd();
const env = fs.readFileSync(path.join(PROJECT_DIR, '.env.local'), 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

const rnd = () => Math.random().toString(36).substring(2, 6);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Teams to create: [name, wikipediaTitle]
const NEW_TEAMS = [
  ['أرارات أرمينيا', 'Ararat-Armenia'],
  ['سيليي', 'NK Celje'],
  ['ميالبي', 'Mjällby AIF'],
  ['سلوفان براتيسلافا', 'ŠK Slovan Bratislava'],
  ['ليفيسكي صوفيا', 'PFC Levski Sofia'],
  ['كايرات ألماتي', 'FC Kairat'],
  ['إبسويتش تاون', 'Ipswich Town F.C.'],
  ['لو هافر', 'Le Havre AC'],
  ['إيلفيرسبيرج', 'SV Elversberg'],
  ['ستراسبورج', 'RC Strasbourg Alsace'],
  ['بورنموث', 'AFC Bournemouth'],
  ['جنوى', 'Genoa CFC'],
];

async function getLogo(wikiTitle) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&format=json&pithumbsize=200&redirects=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (YallaShootNew maintenance)' } });
    if (!res.ok) return null;
    const j = await res.json();
    const pages = j?.query?.pages || {};
    const page = Object.values(pages)[0];
    return page?.thumbnail?.source || null;
  } catch { return null; }
}

async function main() {
  // league ids
  const { data: leagues } = await supabase.from('leagues').select('id, name');
  const uclQ = (leagues || []).find((l) => l.name.includes('دوري أبطال أوروبا'));
  const friendlies = (leagues || []).find((l) => l.name.includes('وديات'));
  console.log('leagues:', uclQ?.name, '|', friendlies?.name);

  // existing teams
  const { data: teams } = await supabase.from('teams').select('id, name');
  const tmap = {};
  (teams || []).forEach((t) => { tmap[t.name] = t.id; });

  // create missing teams with logo
  const created = {};
  for (const [name, wiki] of NEW_TEAMS) {
    if (tmap[name]) { created[name] = tmap[name]; console.log('exists:', name); continue; }
    const logo = await getLogo(wiki);
    const { data, error } = await supabase.from('teams').insert({
      name, short_name: name, logo_url: logo,
    }).select('id').single();
    if (error) { console.log('⚠️ create failed:', name, error.message); continue; }
    created[name] = data.id;
    console.log('✅ created:', name, logo ? 'with logo' : '(no logo)');
    await sleep(400); // avoid Wikipedia 429
  }

  // matches to add: [league, home, away, UTC ISO]
  const MATCHES = [
    [uclQ?.id, 'أرارات أرمينيا', 'سيليي', '2026-08-04T16:00:00+00:00'],
    [uclQ?.id, 'ميالبي', 'سلوفان براتيسلافا', '2026-08-04T16:00:00+00:00'],
    [uclQ?.id, 'ليفيسكي صوفيا', 'كايرات ألماتي', '2026-08-04T17:30:00+00:00'],
    [friendlies?.id, 'بورنموث', 'جنوى', '2026-08-04T12:00:00+00:00'],
    [friendlies?.id, 'إيلفيرسبيرج', 'ستراسبورج', '2026-08-04T16:00:00+00:00'],
    [friendlies?.id, 'إبسويتش تاون', 'لو هافر', '2026-08-04T18:45:00+00:00'],
  ];

  // check existing matches to avoid duplicates
  const { data: existing } = await supabase.from('matches').select('home_team_id, away_team_id, match_date');
  const dupKey = new Set((existing || []).map((m) => `${m.home_team_id}|${m.away_team_id}|${m.match_date}`));

  let added = 0;
  for (const [lid, home, away, date] of MATCHES) {
    if (!lid || !created[home] || !created[away]) { console.log('⏭️ skip (missing ref):', home, 'vs', away); continue; }
    const key = `${created[home]}|${created[away]}|${date}`;
    if (dupKey.has(key)) { console.log('⏭️ duplicate:', home, 'vs', away); continue; }
    const slug = `مباراة-${home}-ضد-${away}-2026-08-04-${rnd()}`;
    const { error } = await supabase.from('matches').insert({
      league_id: lid, home_team_id: created[home], away_team_id: created[away],
      match_date: date, status: 'SCHEDULED', slug,
    });
    if (error) console.log('⚠️ match failed:', home, 'vs', away, error.message);
    else { added++; console.log('✅ added:', home, 'vs', away, date); }
  }
  console.log('done. matches added:', added);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
