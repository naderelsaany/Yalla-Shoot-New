export function register() {
  console.log("instrumentation.ts register() called! NEXT_RUNTIME:", process.env.NEXT_RUNTIME, "PLAYWRIGHT_TEST:", process.env.PLAYWRIGHT_TEST);
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.PLAYWRIGHT_TEST === 'true') {
    const originalFetch = global.fetch;

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      if (urlStr.includes('/rest/v1/')) {
        const url = new URL(urlStr);
        const segments = url.pathname.split('/');
        const table = segments[segments.length - 1];

        const acceptHeader = init?.headers
          ? typeof (init.headers as unknown as Headers).get === 'function'
            ? (init.headers as unknown as Headers).get('accept') || (init.headers as unknown as Headers).get('Accept')
            : Array.isArray(init.headers)
              ? (init.headers as [string, string][]).find(([k]) => k.toLowerCase() === 'accept')?.[1]
              : (init.headers as Record<string, string>)['Accept'] || (init.headers as Record<string, string>)['accept']
          : undefined;
        const isSingle = acceptHeader === 'application/vnd.pgrst.object+json';

        const rangeHeader = init?.headers
          ? typeof (init.headers as unknown as Headers).get === 'function'
            ? (init.headers as unknown as Headers).get('range') || (init.headers as unknown as Headers).get('Range')
            : Array.isArray(init.headers)
              ? (init.headers as [string, string][]).find(([k]) => k.toLowerCase() === 'range')?.[1]
              : (init.headers as Record<string, string>)['Range'] || (init.headers as Record<string, string>)['range']
          : undefined;
        let rangeStart = 0;
        if (rangeHeader) {
          const match = rangeHeader.match(/(\d+)-/);
          if (match) {
            rangeStart = parseInt(match[1]);
          }
        } else {
          try {
            const urlObj = new URL(urlStr);
            const offsetParam = urlObj.searchParams.get('offset');
            if (offsetParam) {
              rangeStart = parseInt(offsetParam);
            }
          } catch {}
        }
        console.log('Server mockFetch matches rangeHeader:', rangeHeader, 'rangeStart:', rangeStart);

        // Mock data
        const mockMatches = [
          {
            id: '1',
            match_date: new Date().toISOString(),
            status: 'IN_PLAY',
            home_score: 2,
            away_score: 1,
            home_team: { id: 'ahly', name: 'Liverpool FC', logo_url: 'https://example.com/liverpool.png' },
            away_team: { id: 'no-players', name: 'Arsenal FC', logo_url: 'https://example.com/arsenal.png' },
            league: { name: 'UEFA Champions League' }
          },
          {
            id: '2',
            match_date: new Date(Date.now() + 3600000).toISOString(),
            status: 'SCHEDULED',
            home_score: 0,
            away_score: 0,
            home_team: { id: 'no-league', name: 'Real Madrid CF', logo_url: 'https://example.com/madrid.png' },
            away_team: { id: 'no-logo', name: 'FC Barcelona', logo_url: 'https://example.com/barca.png' },
            league: { name: 'Primera Division' }
          }
        ];

        const mockLeagues = [
          { id: '1', name: 'UEFA Champions League', country: 'England', logo_url: 'https://example.com/ucl.png' },
          { id: '2', name: 'Primera Division', country: 'Spain', logo_url: 'https://example.com/laliga.png' }
        ];

        const mockStandings = [
          { id: '1', position: 1, team_id: 1, played: 10, points: 25, teams: { name: 'Liverpool FC', logo_url: 'https://example.com/liverpool.png' } },
          { id: '2', position: 2, team_id: 2, played: 10, points: 22, teams: { name: 'Arsenal FC', logo_url: 'https://example.com/arsenal.png' } }
        ];

        const mockNews = [
          {
            title: 'تفاصيل مباراة ليفربول وأرسنال',
            slug: 'liverpool-arsenal',
            content: 'محتوى الخبر التجريبي للشرح.',
            published_at: new Date().toISOString()
          }
        ];



        // Check tables
        if (table === 'matches') {
          if (urlStr.includes('2026-12-31') || rangeStart >= 2) {
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { 'content-type': 'application/json', 'content-range': '0-0/0' }
            });
          }

          if (isSingle) {
            if (urlStr.includes('999999') || urlStr.includes('non-existent')) {
              return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { 'content-type': 'application/json' }
              });
            }
            const matchId = urlStr.includes('id=eq.2') ? '2' : '1';
            const matched = mockMatches.find(m => m.id === matchId) || mockMatches[0];
            return new Response(JSON.stringify(matched), {
              status: 200,
              headers: { 'content-type': 'application/json' }
            });
          } else {
            if (urlStr.includes('999999') || urlStr.includes('non-existent')) {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'content-type': 'application/json' }
              });
            }
            if (urlStr.includes('id=eq.1')) {
              return new Response(JSON.stringify([mockMatches[0]]), {
                status: 200,
                headers: { 'content-type': 'application/json' }
              });
            }
            if (urlStr.includes('id=eq.2')) {
              return new Response(JSON.stringify([mockMatches[1]]), {
                status: 200,
                headers: { 'content-type': 'application/json' }
              });
            }
            return new Response(JSON.stringify(mockMatches), {
              status: 200,
              headers: { 'content-type': 'application/json', 'content-range': '0-1/2' }
            });
          }
        }

        if (table === 'leagues') {
          if (isSingle) {
            if (urlStr.includes('invalid-league-id')) {
              return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { 'content-type': 'application/json' }
              });
            }
            const leagueId = urlStr.includes('id=eq.2') ? '2' : '1';
            const matched = mockLeagues.find(l => l.id === leagueId) || mockLeagues[0];
            return new Response(JSON.stringify(matched), {
              status: 200,
              headers: { 'content-type': 'application/json' }
            });
          } else {
            if (urlStr.includes('invalid-league-id')) {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'content-type': 'application/json' }
              });
            }
            return new Response(JSON.stringify(mockLeagues), {
              status: 200,
              headers: { 'content-type': 'application/json' }
            });
          }
        }

        if (table === 'standings') {
          return new Response(JSON.stringify(mockStandings), {
            status: 200,
            headers: { 'content-type': 'application/json' }
          });
        }

        if (table === 'news') {
          if (isSingle) {
            return new Response(JSON.stringify(mockNews[0]), {
              status: 200,
              headers: { 'content-type': 'application/json' }
            });
          } else {
            return new Response(JSON.stringify(mockNews), {
              status: 200,
              headers: { 'content-type': 'application/json' }
            });
          }
        }

        if (table === 'players') {
          const decodedUrl = decodeURIComponent(urlStr).replace(/\+/g, ' ');
          if (
            urlStr.includes('no-players') ||
            urlStr.includes('No%20Players%20Club') ||
            decodedUrl.includes('no-players') ||
            decodedUrl.includes('No Players Club') ||
            urlStr.includes('team_id=eq.no-players')
          ) {
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { 'content-type': 'application/json' }
            });
          }

          const id = urlStr.includes('id=eq.messi') ? 'messi' :
                     urlStr.includes('id=eq.no-stats') ? 'no-stats' :
                     urlStr.includes('id=eq.free-agent') ? 'free-agent' :
                     urlStr.includes('id=eq.long-name') ? 'long-name' :
                     urlStr.includes('id=eq.999999') ? '999999' : null;

          if (id === '999999' || (!id && (urlStr.includes('999999') || urlStr.includes('non-existent')))) {
            return new Response(JSON.stringify({ error: 'Not found' }), {
              status: 404,
              headers: { 'content-type': 'application/json' }
            });
          }

          const mockPlayersList = [
            { id: 'messi', name: 'ليونيل ميسي', club: 'إنتر ميامي', national_team: 'الأرجنتين', goals: 800, assists: 350 },
            { id: 'no-stats', name: 'لاعب بدون إحصائيات', club: 'نادي تجريبي', national_team: null, goals: null, assists: null },
            { id: 'free-agent', name: 'لاعب حر', club: null, national_team: 'البرتغال', goals: 5, assists: 2 },
            { id: 'long-name', name: 'أ'.repeat(100), club: 'نادي', national_team: 'بلد', goals: 0, assists: 0 }
          ];

          // Parse target club or national team from query to customize mock data
          const clubMatch = decodedUrl.match(/club\.eq\."([^"]+)"/) || decodedUrl.match(/club\.eq\.([^&,)]+)/);
          const ntMatch = decodedUrl.match(/national_team\.eq\."([^"]+)"/) || decodedUrl.match(/national_team\.eq\.([^&,)]+)/);
          const targetClub = clubMatch ? clubMatch[1] : null;
          const targetNationalTeam = ntMatch ? ntMatch[1] : null;

          const adaptedPlayers = mockPlayersList.map(p => {
            const copy = { ...p };
            if (targetClub) {
              copy.club = targetClub;
            }
            if (targetNationalTeam) {
              copy.national_team = targetNationalTeam;
            }
            return copy;
          });

          if (isSingle) {
            const player = adaptedPlayers.find(p => p.id === id);
            if (!player) {
              return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { 'content-type': 'application/json' }
              });
            }
            return new Response(JSON.stringify(player), {
              status: 200,
              headers: { 'content-type': 'application/json' }
            });
          } else {
            const player = id ? adaptedPlayers.find(p => p.id === id) : null;
            if (id && !player) {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'content-type': 'application/json' }
              });
            }
            return new Response(JSON.stringify(player ? [player] : adaptedPlayers), {
              status: 200,
              headers: { 'content-type': 'application/json' }
            });
          }
        }

        if (table === 'teams') {
          const id = urlStr.includes('id=eq.ahly') ? 'ahly' :
                     urlStr.includes('id=eq.no-players') ? 'no-players' :
                     urlStr.includes('id=eq.no-league') ? 'no-league' :
                     urlStr.includes('id=eq.no-logo') ? 'no-logo' :
                     urlStr.includes('id=eq.999999') ? '999999' : null;

          if (id === '999999' || (!id && (urlStr.includes('999999') || urlStr.includes('non-existent')))) {
            return new Response(JSON.stringify({ error: 'Not found' }), {
              status: 404,
              headers: { 'content-type': 'application/json' }
            });
          }

          const mockTeamsList = [
            { id: 'ahly', name: 'الأهلي المصري', logo_url: 'https://example.com/ahly.png', league_id: '1' },
            { id: 'no-players', name: 'نادي بدون لاعبين', logo_url: 'https://example.com/logo.png', league_id: '1' },
            { id: 'no-league', name: 'نادي ودّي', logo_url: 'https://example.com/logo.png', league_id: null },
            { id: 'no-logo', name: 'نادي بدون شعار', logo_url: null, league_id: '1' }
          ];

          if (isSingle) {
            const team = mockTeamsList.find(t => t.id === id);
            if (!team) {
              return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { 'content-type': 'application/json' }
              });
            }
            return new Response(JSON.stringify(team), {
              status: 200,
              headers: { 'content-type': 'application/json' }
            });
          } else {
            const team = id ? mockTeamsList.find(t => t.id === id) : null;
            if (id && !team) {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'content-type': 'application/json' }
              });
            }
            return new Response(JSON.stringify(team ? [team] : mockTeamsList), {
              status: 200,
              headers: { 'content-type': 'application/json' }
            });
          }
        }
      }

      return originalFetch(input, init);
    };
  }
}
