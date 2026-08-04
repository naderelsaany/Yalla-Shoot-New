const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // 1) Add Osasuna team
  const { data: osasuna, error: osErr } = await sup.from('teams')
    .insert({ name: 'أوساسونا', short_name: 'أوساسونا', logo_url: 'https://r2.thesportsdb.com/images/media/team/badge/rvspvt1473502960.png' })
    .select('id');
  if (osErr) { console.log('Osasuna insert ERR:', osErr.message); return; }
  const osasunaId = osasuna[0].id;
  console.log('✅ Osasuna added:', osasunaId);

  // 2) Fix Man City vs K League date (Wikipedia: 5 Aug 2026, 20:00 KST = 11:00 UTC)
  const { data: mci, error: mciErr } = await sup.from('matches')
    .update({ match_date: '2026-08-05T11:00:00+00:00', slug: 'مباراة-نجوم-الدوري-الكوري-ضد-مانشستر-سيتي-2026-08-05-qbm5' })
    .eq('slug', 'مباراة-نجوم-الدوري-الكوري-ضد-مانشستر-سيتي-2026-08-04-qbm5')
    .select('id, match_date, slug');
  if (mciErr) { console.log('ManCity fix ERR:', mciErr.message); } else {
    console.log('✅ Man City match fixed:', JSON.stringify(mci));
  }

  // 3) Add Napoli vs Osasuna (Kooora: 19:30 Cairo = 16:30 UTC, Aug 5)
  const { data: napoli } = await sup.from('teams').select('id').ilike('name', '%نابولي%');
  const napoliId = napoli[0].id;
  const { data: friendLeague } = await sup.from('leagues').select('id').ilike('name', '%وديات الأندية%');

  // Avoid duplicate
  const { data: dup } = await sup.from('matches').select('id')
    .eq('home_team_id', napoliId).eq('away_team_id', osasunaId)
    .gte('match_date', '2026-08-04T00:00:00+00:00');
  if (dup && dup.length) { console.log('⚠️ Napoli-Osasuna already exists'); }
  else {
    const { data: nm, error: nmErr } = await sup.from('matches').insert({
      league_id: friendLeague[0].id,
      home_team_id: napoliId,
      away_team_id: osasunaId,
      match_date: '2026-08-05T16:30:00+00:00',
      status: 'SCHEDULED',
      slug: 'مباراة-نابولي-ضد-أوساسونا-2026-08-05-nap1'
    }).select('id, slug');
    if (nmErr) { console.log('Napoli-Osasuna insert ERR:', nmErr.message); } else {
      console.log('✅ Napoli vs Osasuna added:', nm[0].slug);
    }
  }
})();