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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  try {
    // Accept either CRON_SECRET Bearer token OR Vercel Cron internal header
    const authHeader = request.headers.get('authorization');
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const isValidAuth = authHeader === `Bearer ${process.env.CRON_SECRET}` || isVercelCron;
    if (!isValidAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!RAPIDAPI_KEY) {
      return NextResponse.json({ error: 'RAPIDAPI_KEY not configured' }, { status: 500 });
    }

    // Fetch matches from the World Cup — only page 1
    // ⚠️ api-football186 has broken pagination: all pages return the same 10 matches
    // Fetching multiple pages wastes time and hits Vercel Hobby's 10s timeout
    // Page 1 contains all available upcoming/recent matches (the most important ones)
    const allMatches: ApiMatch[] = [];

    const url = `https://${RAPIDAPI_HOST}/competition/${COMPETITION_ID}/matches?order=desc&page=1`;
    
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY!,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`api-football186 page 1 error:`, errorText);
      return NextResponse.json({ error: `API error: ${res.status} ${errorText}` }, { status: 502 });
    }

    const data: ApiResponse = await res.json();
    if (data.status === 'ok') {
      allMatches.push(...(data.response?.items || []));
    }

    const supabase = getServiceSupabase();
    let processedMatches = 0;
    let insertedMatches = 0;
    let updatedMatches = 0;
    let errors = 0;

    for (const match of allMatches) {
      try {
        const competitionName = match.competition?.cname || 'FIFA World Cup';
        const homeTeamInfo = match.teams.home;
        const awayTeamInfo = match.teams.away;

        // Map status
        let status: string;
        switch (match.status_str) {
          case 'result': status = 'FINISHED'; break;
          case 'live':    status = 'IN_PLAY'; break;
          case 'upcoming':status = 'SCHEDULED'; break;
          default:        status = 'SCHEDULED';
        }

        // Map scores
        const homeScore = match.periods?.ft?.home ?? (match.result.home ? parseInt(match.result.home) : null);
        const awayScore = match.periods?.ft?.away ?? (match.result.away ? parseInt(match.result.away) : null);

        // 1. League — Check Arabic name first, then English name
        const arabicName = competitionName === 'FIFA World Cup' ? 'كأس العالم 2026' : competitionName;
        let { data: league } = await supabase
          .from('leagues')
          .select('id')
          .eq('name', arabicName)
          .maybeSingle();

        if (!league && arabicName !== competitionName) {
          // Fallback: check English name too
          const { data: engLeague } = await supabase
            .from('leagues')
            .select('id')
            .eq('name', competitionName)
            .maybeSingle();
          league = engLeague;
        }

        if (!league) {
          // Create with Arabic name if available, otherwise English
          const createName = arabicName;
          const { data: newLeague } = await supabase
            .from('leagues')
            .insert({
              name: createName,
              logo_url: match.competition?.logo || null,
              country: match.competition?.category || null,
            })
            .select('id')
            .maybeSingle();
          league = newLeague;
        }
        if (!league) { errors++; continue; }

        // 2. Home Team
        let { data: homeTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('name', homeTeamInfo.tname)
          .maybeSingle();

        if (!homeTeam) {
          const { data: newTeam } = await supabase
            .from('teams')
            .insert({
              name: homeTeamInfo.tname,
              short_name: homeTeamInfo.abbr || null,
              logo_url: homeTeamInfo.logo || null,
            })
            .select('id')
            .maybeSingle();
          homeTeam = newTeam;
        }

        // 3. Away Team
        let { data: awayTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('name', awayTeamInfo.tname)
          .maybeSingle();

        if (!awayTeam) {
          const { data: newTeam } = await supabase
            .from('teams')
            .insert({
              name: awayTeamInfo.tname,
              short_name: awayTeamInfo.abbr || null,
              logo_url: awayTeamInfo.logo || null,
            })
            .select('id')
            .maybeSingle();
          awayTeam = newTeam;
        }

        if (!homeTeam || !awayTeam) { errors++; continue; }

        const matchDateISO = match.datestart.replace(' ', 'T') + 'Z';

        // Check if match exists
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
          updatedMatches++;
        } else {
          await supabase.from('matches').insert(matchPayload);
          insertedMatches++;
        }
        processedMatches++;
      } catch (matchError) {
        console.error('Error processing match:', matchError);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: [
        `Fetched ${allMatches.length} matches (${Math.ceil(allMatches.length / 10)} pages).`,
        `Processed ${processedMatches} total.`,
        `Inserted ${insertedMatches} new, updated ${updatedMatches} existing.`,
        errors ? `Errors: ${errors}.` : '',
      ].filter(Boolean).join(' '),
    });
  } catch (error) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
