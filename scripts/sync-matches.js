/**
 * سكريبت مزامنة الماتشات من API-Football186
 * يستخدم node-fetch + @supabase/supabase-js
 * يشغله الـ Self-Monitoring Cron أو الـ Script Cron
 */
const path = require('path');
const fs = require('fs');

// The workdir should be the project root (set in cron config)
const PROJECT_DIR = process.env.CRON_WORKDIR || process.cwd();

// Change to project dir
try {
  process.chdir(PROJECT_DIR);
} catch (e) {
  console.error('❌ Cannot change to project directory:', PROJECT_DIR);
  process.exit(1);
}

// Add project's node_modules to module resolution path
const nodeModulesPath = require('path').join(PROJECT_DIR, 'node_modules');
if (require('fs').existsSync(nodeModulesPath)) {
  module.paths.unshift(nodeModulesPath);
}

const { createClient } = require('@supabase/supabase-js');

// Load env from project .env.local
const envPath = path.join(PROJECT_DIR, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found at', envPath);
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const rapidApiKey = env.match(/RAPIDAPI_KEY=(.+)/)?.[1]?.trim();
if (!supabaseUrl || !supabaseKey || !rapidApiKey) {
  console.error('❌ Missing credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const RAPIDAPI_HOST = 'api-football186.p.rapidapi.com';

// Arabic leagues we want to track (competition IDs from api-football186)
const TARGET_LEAGUES = [
  { id: '1382', name: 'FIFA World Cup', category: 'International', localName: 'كأس العالم 2026' },
  { id: '1891', name: 'Int. Friendly Games', category: 'International', localName: 'مباريات ودية دولية' },
  { id: '1895', name: 'Ligue 1', category: 'Algeria', localName: 'الرابطة الجزائرية الأولى' },
  { id: '1896', name: 'U21 UEFA European Championship', category: 'International Youth', localName: 'تصفيات أمم أوروبا تحت 21' },
  { id: '1898', name: 'MLS Next Pro', category: 'USA', localName: 'MLS Next Pro' },
];

// Status mapping from API to our DB
const STATUS_MAP = {
  '1': 'SCHEDULED',
  '2': 'LIVE',
  '3': 'FINISHED',
  '4': 'CANCELLED',
  'result': 'FINISHED',
  'scheduled': 'SCHEDULED',
  'live': 'LIVE',
  'completed': 'FINISHED',
  'cancelled': 'CANCELLED',
};

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) return response.json();
      if (response.status === 404) return null;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
  return null;
}

async function getOrCreateTeam(name, shortName, logoUrl) {
  if (!name) return null;
  
  const { data: existing } = await supabase
    .from('teams').select('id')
    .ilike('name', name)
    .maybeSingle();
  
  if (existing) return existing;
  
  const { data, error } = await supabase.from('teams').insert([{
    name: name,
    short_name: shortName || name.substring(0, 3).toUpperCase(),
    logo_url: logoUrl || null,
  }]).select().single();
  
  if (error) {
    console.error(`  ⚠️ فشل إنشاء فريق ${name}: ${error.message}`);
    return null;
  }
  console.log(`  ✅ فريق جديد: ${name}`);
  return data;
}

async function getOrCreateLeague(name, category) {
  const { data: existing } = await supabase
    .from('leagues').select('id')
    .ilike('name', name)
    .maybeSingle();
  
  if (existing) return existing;
  
  const { data, error } = await supabase.from('leagues').insert([{
    name: name,
    country: category || null,
    is_active: true,
  }]).select().single();
  
  if (error) {
    console.error(`  ⚠️ فشل إنشاء بطولة ${name}: ${error.message}`);
    return null;
  }
  console.log(`  ✅ بطولة جديدة: ${name}`);
  return data;
}

function generateSlug(homeName, awayName, dateStr) {
  const safe = (s) => s.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '').trim().replace(/\s+/g, '-');
  return `مباراة-${safe(homeName)}-ضد-${safe(awayName)}-${dateStr.substring(0, 10)}-${Math.random().toString(36).substring(2, 6)}`;
}

async function main() {
  console.log('🔄 بدء مزامنة الماتشات من API-Football186...');
  console.log(`📡 المشروع: ${PROJECT_DIR}\n`);
  
  let totalNew = 0;
  let totalUpdated = 0;
  let errors = [];

  for (const league of TARGET_LEAGUES) {
    console.log(`── ${league.localName} (${league.name}) [${league.id}] ──`);
    
    const leagueRecord = await getOrCreateLeague(league.localName, league.category);
    if (!leagueRecord) { errors.push(`League ${league.id}: failed`); continue; }
    
    const data = await fetchWithRetry(
      `https://${RAPIDAPI_HOST}/competition/${league.id}/matches`
    );
    if (!data || !data.response?.items) {
      console.log(`  ⏭️ لا توجد مباريات\n`);
      continue;
    }
    
    const matches = data.response.items;
    console.log(`  📊 ${matches.length} مباراة`);
    
    for (const match of matches) {
      try {
        const teams = match.teams;
        if (!teams?.home?.tid || !teams?.away?.tid) {
          continue;
        }
        
        const homeTeam = await getOrCreateTeam(teams.home.tname, teams.home.abbr, teams.home.logo);
        const awayTeam = await getOrCreateTeam(teams.away.tname, teams.away.abbr, teams.away.logo);
        if (!homeTeam || !awayTeam) {
          errors.push(`Match ${match.mid}: could not create teams`);
          continue;
        }
        
        const dateStr = match.datestart || match.date;
        if (!dateStr) { errors.push(`Match ${match.mid}: no date`); continue; }
        const matchDate = new Date(dateStr.replace(' ', 'T') + 'Z');
        if (isNaN(matchDate.getTime())) { errors.push(`Match ${match.mid}: invalid date ${dateStr}`); continue; }
        
        const apiStatus = match.status_str || match.status || 'scheduled';
        const status = STATUS_MAP[apiStatus.toLowerCase()] || 'SCHEDULED';
        const slug = generateSlug(teams.home.tname, teams.away.tname, matchDate.toISOString());
        
        const { data: existingMatch } = await supabase
          .from('matches').select('id, status, home_score, away_score')
          .eq('external_id', match.mid)
          .maybeSingle();
        
        const matchPayload = {
          league_id: leagueRecord.id,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          match_date: matchDate.toISOString(),
          status,
          home_score: match.result?.home !== '' && match.result?.home !== undefined ? parseInt(match.result.home) : null,
          away_score: match.result?.away !== '' && match.result?.away !== undefined ? parseInt(match.result.away) : null,
          slug: existingMatch?.slug || slug,
          external_id: match.mid,
          updated_at: new Date().toISOString(),
        };
        
        if (existingMatch) {
          const hasChanged = existingMatch.status !== status || 
            existingMatch.home_score !== matchPayload.home_score ||
            existingMatch.away_score !== matchPayload.away_score;
          
          if (hasChanged) {
            const { error } = await supabase.from('matches').update(matchPayload).eq('id', existingMatch.id);
            if (error) { errors.push(`Match ${match.mid}: ${error.message}`); continue; }
            totalUpdated++;
            console.log(`  🔄 ${teams.home.tname} vs ${teams.away.tname} → ${status}`);
          }
        } else {
          // Check for duplicate by same teams + date
          const { data: dup } = await supabase
            .from('matches').select('id')
            .eq('home_team_id', homeTeam.id)
            .eq('away_team_id', awayTeam.id)
            .gte('match_date', new Date(matchDate.getTime() - 86400000).toISOString())
            .lte('match_date', new Date(matchDate.getTime() + 86400000).toISOString())
            .maybeSingle();
          
          if (dup) {
            await supabase.from('matches').update({ external_id: match.mid }).eq('id', dup.id);
            continue;
          }
          
          const { error } = await supabase.from('matches').insert([matchPayload]);
          if (error) { errors.push(`Match ${match.mid}: ${error.message}`); continue; }
          totalNew++;
          console.log(`  ✅ ${teams.home.tname} vs ${teams.away.tname} | ${matchDate.toISOString().substring(0, 10)}`);
        }
      } catch (e) {
        errors.push(`Match ${match.mid || '?'}: ${e.message}`);
      }
    }
    console.log();
  }
  
  console.log(`📊 ===== تقرير المزامنة =====`);
  console.log(`🆕 مباريات جديدة: ${totalNew}`);
  console.log(`🔄 مباريات محدثة: ${totalUpdated}`);
  console.log(`❌ أخطاء: ${errors.length}`);
  if (errors.length > 0) {
    console.log(`\n⚠️ تفاصيل الأخطاء:`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  console.log(`\n✅ تمت المزامنة`);
}

main().catch(err => {
  console.error('❌ خطأ جسيم:', err.message);
  process.exit(1);
});
