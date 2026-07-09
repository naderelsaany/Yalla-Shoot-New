import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { translateName } from '@/lib/translations';

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    // 1. Fetch matches from yesterday to tomorrow
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];
    
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

    // Fetch any available matches
    const url = `https://api.football-data.org/v4/matches?dateFrom=${yesterday}&dateTo=${tomorrow}`;

    const res = await fetch(url, {
      headers: {
        'X-Auth-Token': API_KEY,
      },
      next: { revalidate: 0 } // Always fresh
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Football-data error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch from football-data' }, { status: res.status });
    }

    const data = await res.json();
    const supabase = getServiceSupabase();
    let insertedMatches = 0;

    // 2. Process and Upsert Matches
    for (const match of data.matches) {
      // Find or create League
      let { data: league } = await supabase.from('leagues').select('id').eq('name', match.competition.name).maybeSingle();
      if (!league) {
        const { data: newLeague, error } = await supabase.from('leagues').insert({
          name: match.competition.name,
          logo_url: match.competition.emblem,
          country: match.area?.name,
        }).select('id').maybeSingle();
        if (error) console.error('League insert error:', error);
        league = newLeague;
      }

      if (!league) continue;

      // Find or create Home Team
      let { data: homeTeam } = await supabase.from('teams').select('id').eq('name', match.homeTeam.name).maybeSingle();
      if (!homeTeam) {
        const { data: newTeam, error } = await supabase.from('teams').insert({
          name: match.homeTeam.name,
          short_name: match.homeTeam.shortName,
          logo_url: match.homeTeam.crest,
        }).select('id').maybeSingle();
        if (error) console.error('Home Team insert error:', error);
        homeTeam = newTeam;
      }

      // Find or create Away Team
      let { data: awayTeam } = await supabase.from('teams').select('id').eq('name', match.awayTeam.name).maybeSingle();
      if (!awayTeam) {
        const { data: newTeam, error } = await supabase.from('teams').insert({
          name: match.awayTeam.name,
          short_name: match.awayTeam.shortName,
          logo_url: match.awayTeam.crest,
        }).select('id').maybeSingle();
        if (error) console.error('Away Team insert error:', error);
        awayTeam = newTeam;
      }

      if (!homeTeam || !awayTeam) continue;

      // Upsert Match (Check if exists by home, away, and date)
      // Since we didn't use external_id, we check by date & teams
      const { data: existingMatch } = await supabase.from('matches')
        .select('id')
        .eq('home_team_id', homeTeam.id)
        .eq('away_team_id', awayTeam.id)
        .gte('match_date', match.utcDate.substring(0, 10) + 'T00:00:00Z') // Same day
        .lte('match_date', match.utcDate.substring(0, 10) + 'T23:59:59Z')
        .maybeSingle();

      const rawHome = translateName(match.homeTeam.name);
      const rawAway = translateName(match.awayTeam.name);
      const safeHome = rawHome.replace(/\s+/g, '-');
      const safeAway = rawAway.replace(/\s+/g, '-');
      const dateStr = match.utcDate.substring(0, 10);
      const slug = `مباراة-${safeHome}-ضد-${safeAway}-${dateStr}`;

      const matchPayload = {
        league_id: league.id,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        match_date: match.utcDate,
        status: match.status,
        home_score: match.score?.fullTime?.home ?? null,
        away_score: match.score?.fullTime?.away ?? null,
        slug: slug,
      };

      if (existingMatch) {
        // Update
        await supabase.from('matches').update(matchPayload).eq('id', existingMatch.id);
      } else {
        // Insert
        await supabase.from('matches').insert(matchPayload);
        insertedMatches++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${data.matches.length} matches. Inserted ${insertedMatches} new matches.` 
    });
  } catch (error) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
