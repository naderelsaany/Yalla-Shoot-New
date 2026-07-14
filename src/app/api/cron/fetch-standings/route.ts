import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'api-football186.p.rapidapi.com';
const COMPETITION_ID = '1382';

export async function GET(request: Request) {
  try {
    // Accept either CRON_SECRET Bearer token OR Vercel Cron internal header
    const authHeader = request.headers.get('authorization');
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const isValidAuth = authHeader === 'Bearer ' + process.env.CRON_SECRET || isVercelCron;
    if (!isValidAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!RAPIDAPI_KEY) {
      return NextResponse.json({ error: 'RAPIDAPI_KEY not configured' }, { status: 500 });
    }

    const supabase = getServiceSupabase();

    // Get the FIFA World Cup league
    const { data: league } = await supabase
      .from('leagues')
      .select('id')
      .eq('name', 'FIFA World Cup')
      .maybeSingle();

    if (!league) {
      return NextResponse.json({ 
        success: false, 
        message: 'FIFA World Cup league not found in database' 
      });
    }

    // Get all FINISHED matches for the World Cup
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('league_id', league.id)
      .eq('status', 'FINISHED')
      .order('match_date', { ascending: true });

    if (matchError) {
      return NextResponse.json({ 
        success: false, 
        error: matchError.message 
      }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No finished matches to calculate standings from yet',
        standings: [],
      });
    }

    // Calculate standings for each team
    // Points: win=3, draw=1, loss=0
    interface TeamStanding {
      team_id: string;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goals_for: number;
      goals_against: number;
      goal_difference: number;
      points: number;
    }

    const teamStats: Record<string, TeamStanding> = {};

    // Also get team names
    const { data: allTeams } = await supabase
      .from('teams')
      .select('id, name, logo_url');

    const teamNames: Record<string, string> = {};
    if (allTeams) {
      for (const t of allTeams) {
        teamNames[t.id] = t.name;
      }
    }

    for (const match of matches) {
      const homeId = match.home_team_id;
      const awayId = match.away_team_id;
      const homeScore = match.home_score;
      const awayScore = match.away_score;

      if (homeScore === null || awayScore === null) continue;

      // Initialize if not exists
      for (const [id, isHome] of [[homeId, true], [awayId, false]] as const) {
        if (!teamStats[id]) {
          teamStats[id] = {
            team_id: id,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goals_for: 0,
            goals_against: 0,
            goal_difference: 0,
            points: 0,
          };
        }
      }

      const home = teamStats[homeId];
      const away = teamStats[awayId];

      home.played++;
      away.played++;
      home.goals_for += homeScore;
      home.goals_against += awayScore;
      away.goals_for += awayScore;
      away.goals_against += homeScore;

      if (homeScore > awayScore) {
        // Home win
        home.won++;
        home.points += 3;
        away.lost++;
      } else if (homeScore < awayScore) {
        // Away win
        away.won++;
        away.points += 3;
        home.lost++;
      } else {
        // Draw
        home.drawn++;
        away.drawn++;
        home.points += 1;
        away.points += 1;
      }

      home.goal_difference = home.goals_for - home.goals_against;
      away.goal_difference = away.goals_for - away.goals_against;
    }

    // Sort: points desc, GD desc, goals_for desc
    const sorted = Object.values(teamStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });

    // Clear existing standings for this league
    await supabase.from('standings').delete().eq('league_id', league.id);

    // Insert new standings
    const standingsRows = sorted.map((team, index) => ({
      league_id: league.id,
      team_id: team.team_id,
      position: index + 1,
      played: team.played,
      won: team.won,
      drawn: team.drawn,
      lost: team.lost,
      goals_for: team.goals_for,
      goals_against: team.goals_against,
      goal_difference: team.goal_difference,
      points: team.points,
    }));

    const { error: insertError } = await supabase
      .from('standings')
      .insert(standingsRows);

    if (insertError) {
      return NextResponse.json({ 
        success: false, 
        error: insertError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Standings calculated from match data. ' + sorted.length + ' teams in standings.',
      teams: sorted.length,
    });
  } catch (error) {
    console.error('Standings Cron Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
