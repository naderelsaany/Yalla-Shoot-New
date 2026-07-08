import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

// Mapping of football-data competition IDs to their names in our DB
const COMPETITIONS = [
  { id: 2021, name: 'Premier League' },
  { id: 2014, name: 'Primera Division' },
  { id: 2019, name: 'Serie A' },
  { id: 2002, name: 'Bundesliga' },
  { id: 2015, name: 'Ligue 1' },
  { id: 2001, name: 'UEFA Champions League' },
  { id: 2000, name: 'FIFA World Cup' },
  { id: 2018, name: 'European Championship' },
  { id: 2013, name: 'Campeonato Brasileiro Série A' },
];

export async function GET(request: Request) {
  try {
    if (!API_KEY) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const supabase = getServiceSupabase();
    let updatedStandings = 0;

    // To respect rate limits (10 requests / minute), we can fetch all in sequence with a small delay
    // but Vercel free tier times out after 10 seconds.
    // So we fetch as fast as possible. 9 requests should be fine for the limit if we don't trigger it twice.

    for (const comp of COMPETITIONS) {
      // Find league in our DB
      const { data: league } = await supabase
        .from('leagues')
        .select('id')
        .eq('name', comp.name)
        .maybeSingle();

      if (!league) continue; // League not active in our DB yet

      const url = `https://api.football-data.org/v4/competitions/${comp.id}/standings`;
      const res = await fetch(url, {
        headers: { 'X-Auth-Token': API_KEY },
        next: { revalidate: 0 }
      });

      if (!res.ok) {
        console.error(`Failed to fetch standings for ${comp.name}: ${res.status}`);
        continue; // Skip and continue
      }

      const data = await res.json();
      if (!data.standings || data.standings.length === 0) continue;

      // Generally, the first standing item is the TOTAL standing
      // For tournaments like World Cup, there are multiple groups (Group A, Group B, etc.)
      for (const standing of data.standings) {
        if (standing.type !== 'TOTAL') continue; // Only want total standings

        for (const row of standing.table) {
          // Find or create team
          let { data: team } = await supabase.from('teams').select('id').eq('name', row.team.name).maybeSingle();
          if (!team) {
            const { data: newTeam } = await supabase.from('teams').insert({
              name: row.team.name,
              short_name: row.team.shortName,
              logo_url: row.team.crest,
            }).select('id').maybeSingle();
            team = newTeam;
          }

          if (!team) continue;

          // Upsert standing
          const standingPayload = {
            league_id: league.id,
            team_id: team.id,
            position: row.position,
            played: row.playedGames,
            won: row.won,
            drawn: row.draw,
            lost: row.lost,
            points: row.points,
            goals_for: row.goalsFor,
            goals_against: row.goalsAgainst,
            goal_difference: row.goalDifference,
            // Add group if exists
            group_name: standing.group || null
          };

          // Check if exists
          const { data: existing } = await supabase.from('standings')
            .select('id')
            .eq('league_id', league.id)
            .eq('team_id', team.id)
            .maybeSingle();

          if (existing) {
            await supabase.from('standings').update(standingPayload).eq('id', existing.id);
          } else {
            await supabase.from('standings').insert(standingPayload);
          }
          updatedStandings++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed standings. Updated ${updatedStandings} team rows.` 
    });
  } catch (error: any) {
    console.error('Standings Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
