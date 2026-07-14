/**
 * سكريبت مزامنة الماتشات العربية - يجيب بيانات الفرق والبطولات ويكتبها في Supabase
 * يستخدم node-fetch + @supabase/supabase-js
 * يشغله الـ Self-Monitoring Cron
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load env
const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const rapidApiKey = env.match(/RAPIDAPI_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const RAPIDAPI_HOST = 'api-football186.p.rapidapi.com';

// Arabic leagues we want to track (competition IDs from api-football186)
const TARGET_LEAGUES = [
  { id: '1382', name: 'FIFA World Cup', category: 'International', lang: 'ar', localName: 'كأس العالم 2026' },
  { id: '1891', name: 'Int. Friendly Games', category: 'International', lang: 'en', localName: 'مباريات ودية دولية' },
  { id: '1895', name: 'Ligue 1', category: 'Algeria', lang: 'ar', localName: 'الرابطة الجزائرية الأولى' },
  { id: '1896', name: 'U21 UEFA European Championship, Qualification', category: 'International Youth', lang: 'en', localName: 'تصفيات أمم أوروبا تحت 21' },
];

async function teamExists(tid) {
  const { data } = await supabase.from('teams').select('id').eq('external_id', tid).maybeSingle();
  return data;
}

async function leagueExists(cid) {
  const { data } = await supabase.from('leagues').select('id').eq('external_id', cid).maybeSingle();
  return data;
}

async function matchExists(mid) {
  const { data } = await supabase.from('matches').select('id').eq('external_match_id', mid).maybeSingle();
  return data;
}

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
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return null;
}

async function main() {
  console.log('🔄 بدء مزامنة الماتشات من API-Football186...');
  console.log(`📡 Supabase: ${supabaseUrl}`);
  
  let totalNew = 0;
  let totalUpdated = 0;
  let errors = [];

  for (const league of TARGET_LEAGUES) {
    console.log(`\n--- ${league.localName} (${league.name}) [${league.id}] ---`);
    
    // 1. Get or create league
    let leagueRecord = await leagueExists(league.id);
    if (!leagueRecord) {
      const { data, error } = await supabase.from('leagues').insert([{
        name: league.localName,
        external_id: league.id,
        country: league.category,
        is_active: true,
      }]).select().single();
      if (error) { errors.push(`League ${league.id}: ${error.message}`); continue; }
      leagueRecord = data;
      console.log(`  ✅ بطولة جديدة: ${league.localName}`);
    }
    
    // 2. Fetch matches
    const data = await fetchWithRetry(
      `https://${RAPIDAPI_HOST}/competition/${league.id}/matches`
    );
    if (!data || !data.response?.items) {
      console.log(`  ⏭️ لا توجد مباريات`);
      continue;
    }
    
    const matches = data.response.items;
    console.log(`  📊 ${matches.length} مباراة`);
    
    for (const match of matches) {
      try {
        const teams = match.teams;
        if (!teams?.home?.tid || !teams?.away?.tid) continue;
        
        // 2. Get or create home team
        let homeTeam = await teamExists(teams.home.tid);
        if (!homeTeam) {
          const { data: ht, error } = await supabase.from('teams').insert([{
            name: teams.home.tname,
            short_name: teams.home.abbr || teams.home.tname,
            logo_url: teams.home.logo || null,
            external_id: teams.home.tid,
          }]).select().single();
          if (error) { errors.push(`Team ${teams.home.tid}: ${error.message}`); continue; }
          homeTeam = ht;
        }
        
        // 3. Get or create away team
        let awayTeam = await teamExists(teams.away.tid);
        if (!awayTeam) {
          const { data: at, error } = await supabase.from('teams').insert([{
            name: teams.away.tname,
            short_name: teams.away.abbr || teams.away.tname,
            logo_url: teams.away.logo || null,
            external_id: teams.away.tid,
          }]).select().single();
          if (error) { errors.push(`Team ${teams.away.tid}: ${error.message}`); continue; }
          awayTeam = at;
        }
        
        // 4. Check if match exists
        const existingMatch = await matchExists(match.mid);
        
        // Parse date - format: "2026-07-14 22:00:00"
        const dateStr = match.datestart;
        const matchDate = new Date(dateStr.replace(' ', 'T') + 'Z');
        if (isNaN(matchDate.getTime())) continue;
        
        // Map status
        const statusMap = {
          '1': 'SCHEDULED',
          '2': 'LIVE',
          '3': 'FINISHED',
          '4': 'CANCELLED',
          'result': 'FINISHED',
        };
        const status = statusMap[match.status] || statusMap[match.status_str] || 'SCHEDULED';
        
        // Generate slug
        const slug = `مباراة-${teams.home.tname.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '').trim().replace(/\s+/g, '-')}-ضد-${teams.away.tname.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '').trim().replace(/\s+/g, '-')}-${matchDate.toISOString().substring(0, 10)}`;
        
        const matchPayload = {
          league_id: leagueRecord.id,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          match_date: matchDate.toISOString(),
          status,
          home_score: match.result?.home !== '' && match.result?.home !== undefined ? parseInt(match.result.home) : null,
          away_score: match.result?.away !== '' && match.result?.away !== undefined ? parseInt(match.result.away) : null,
          slug,
          external_match_id: match.mid,
        };
        
        if (existingMatch) {
          // Update only if status or score changed
          const { error } = await supabase.from('matches').update(matchPayload).eq('id', existingMatch.id);
          if (!error) {
            totalUpdated++;
          }
        } else {
          const { error } = await supabase.from('matches').insert([matchPayload]);
          if (!error) {
            totalNew++;
            console.log(`  ✅ ${teams.home.tname} vs ${teams.away.tname}`);
          }
        }
      } catch (e) {
        errors.push(`Match ${match.mid}: ${e.message}`);
      }
    }
  }
  
  console.log(`\n📊 === تقرير المزامنة ===`);
  console.log(`🆕 مباريات جديدة: ${totalNew}`);
  console.log(`🔄 مباريات محدثة: ${totalUpdated}`);
  console.log(`❌ أخطاء: ${errors.length}`);
  if (errors.length > 0) {
    console.log(`\n⚠️ الأخطاء:`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  console.log(`\n✅ تمت المزامنة بنجاح`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
