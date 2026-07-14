import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { translateName } from '@/lib/translations';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'api-football186.p.rapidapi.com';
const COMPETITION_ID = '1382'; // FIFA World Cup

interface ApiTeam {
  tid: string;
  tname: string;
  logo: string;
  fullname: string;
  abbr: string;
}

interface ApiMatch {
  mid: string;
  round: string;
  group: string;
  match_number: string;
  result: {
    home: string;
    away: string;
    winner: string;
  };
  teams: {
    home: ApiTeam;
    away: ApiTeam;
  };
  periods?: {
    ft?: { home: number; away: number };
    p1?: { home: number; away: number };
    p2?: { home: number; away: number };
  };
  datestart: string;
  dateend: string;
  timestampstart: number;
  status_str: string; // "result", "upcoming", "live"
  status: string;
  venue: {
    venueid: string;
    name: string;
    location: string;
  };
  competition: {
    cid: string;
    cname: string;
    logo: string;
    category: string;
    category_flag: string;
  };
}

interface ApiResponse {
  status: string;
  response: {
    items: ApiMatch[];
    total_items: number;
    total_pages: number;
  };
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!RAPIDAPI_KEY) {
      return NextResponse.json({ error: 'RAPIDAPI_KEY not configured' }, { status: 500 });
    }

    // 1. Fetch matches from yesterday to tomorrow (date range for filtering)
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

    // Fetch all World Cup matches from api-football186 (sorted by newest first)
    const url = `https://${RAPIDAPI_HOST}/competition/${COMPETITION_ID}/matches?order=desc`;

    const res = await fetch(url, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('api-football186 error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch from api-football186' }, { status: res.status });
    }

    const data: ApiResponse = await res.json();
    if (data.status !== 'ok') {
      return NextResponse.json({ error: 'API returned non-ok status' }, { status: 500 });
    }

    const allMatches = data.response.items || [];
    const supabase = getServiceSupabase();

    // Filter matches within our date range (yesterday to tomorrow)
    const relevantMatches = allMatches.filter((match) => {
      const matchDate = match.datestart.substring(0, 10);
      return matchDate >= yesterday && matchDate <= tomorrow;
    });

    // If no matches in the date range, try to fetch more pages
    // For now, process what we have since the most recent matches are in the first page with order=desc

    let processedMatches = 0;
    let insertedMatches = 0;

    for (const match of relevantMatches) {
      // Source of truth from the API
      const competitionName = match.competition?.cname || 'FIFA World Cup';
      const homeTeamInfo = match.teams.home;
      const awayTeamInfo = match.teams.away;

      // Map status from API format to our format
      let status: string;
      switch (match.status_str) {
        case 'result':
          status = 'FINISHED';
          break;
        case 'live':
          status = 'IN_PLAY';
          break;
        case 'upcoming':
          status = 'SCHEDULED';
          break;
        default:
          status = 'SCHEDULED';
      }

      // Map scores
      const homeScore = match.periods?.ft?.home ?? (match.result.home ? parseInt(match.result.home) : null);
      const awayScore = match.periods?.ft?.away ?? (match.result.away ? parseInt(match.result.away) : null);

      // 2. Find or create League (competition)
      let { data: league } = await supabase
        .from('leagues')
        .select('id')
        .eq('name', competitionName)
        .maybeSingle();

      if (!league) {
        const { data: newLeague, error } = await supabase
          .from('leagues')
          .insert({
            name: competitionName,
            logo_url: match.competition?.logo || null,
            country: match.competition?.category || null,
          })
          .select('id')
          .maybeSingle();
        if (error) console.error('League insert error:', error);
        league = newLeague;
      }

      if (!league) continue;

      // 3. Find or create Home Team
      let { data: homeTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('name', homeTeamInfo.tname)
        .maybeSingle();

      if (!homeTeam) {
        const { data: newTeam, error } = await supabase
          .from('teams')
          .insert({
            name: homeTeamInfo.tname,
            short_name: homeTeamInfo.abbr || null,
            logo_url: homeTeamInfo.logo || null,
          })
          .select('id')
          .maybeSingle();
        if (error) console.error('Home Team insert error:', error);
        homeTeam = newTeam;
      }

      // 4. Find or create Away Team
      let { data: awayTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('name', awayTeamInfo.tname)
        .maybeSingle();

      if (!awayTeam) {
        const { data: newTeam, error } = await supabase
          .from('teams')
          .insert({
            name: awayTeamInfo.tname,
            short_name: awayTeamInfo.abbr || null,
            logo_url: awayTeamInfo.logo || null,
          })
          .select('id')
          .maybeSingle();
        if (error) console.error('Away Team insert error:', error);
        awayTeam = newTeam;
      }

      if (!homeTeam || !awayTeam) continue;

      // Convert datestart to ISO format
      const matchDateISO = match.datestart.replace(' ', 'T') + 'Z';

      // 5. Upsert Match
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .eq('home_team_id', homeTeam.id)
        .eq('away_team_id', awayTeam.id)
        .gte('match_date', matchDateISO.substring(0, 10) + 'T00:00:00Z')
        .lte('match_date', matchDateISO.substring(0, 10) + 'T23:59:59Z')
        .maybeSingle();

      // Generate slug
      const rawHome = translateName(homeTeamInfo.tname);
      const rawAway = translateName(awayTeamInfo.tname);
      const safeHome = rawHome.replace(/[^\w\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
      const safeAway = rawAway.replace(/[^\w\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
      const dateStr = matchDateISO.substring(0, 10);
      const shortId = crypto.randomUUID().substring(0, 8);
      const slug = `مباراة-${safeHome}-ضد-${safeAway}-${dateStr}-${shortId}`;

      const matchPayload = {
        league_id: league.id,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        match_date: matchDateISO,
        status: status,
        home_score: homeScore,
        away_score: awayScore,
        slug: slug,
      };

      if (existingMatch) {
        await supabase.from('matches').update(matchPayload).eq('id', existingMatch.id);
      } else {
        await supabase.from('matches').insert(matchPayload);
        insertedMatches++;
      }
      processedMatches++;
    }

    return NextResponse.json({
      success: true,
      message: `Fetched ${allMatches.length} matches. Filtered ${relevantMatches.length} in date range. Inserted ${insertedMatches} new, processed ${processedMatches} total.`,
    });
  } catch (error) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
