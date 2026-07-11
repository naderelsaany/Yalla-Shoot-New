import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';
import { translateName } from '@/lib/translations';
import { MatchWithTeams } from '@/types/database';

export const alt = 'يلا شوت نيو - تفاصيل المباراة';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug);

  let query = supabase
    .from("matches")
    .select(`
      home_score,
      away_score,
      status,
      match_date,
      home_team:teams!matches_home_team_id_fkey(name, logo_url),
      away_team:teams!matches_away_team_id_fkey(name, logo_url),
      league:leagues(name)
    `);

  if (isUUID) {
    query = query.or(`slug.eq.${decodedSlug},id.eq.${decodedSlug}`);
  } else {
    query = query.eq("slug", decodedSlug);
  }

  const { data: matchData } = await query.single();
  const match = matchData as unknown as MatchWithTeams | null;

  if (!match) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0e17' }}>
          <h1 style={{ color: 'white', fontSize: 60 }}>يلا شوت نيو</h1>
        </div>
      ),
      { ...size }
    );
  }

  const homeName = translateName(match.home_team?.name || "");
  const awayName = translateName(match.away_team?.name || "");
  const leagueName = translateName(match.league?.name || "");
  const homeLogo = match.home_team?.logo_url || 'https://yalla-shoot-new.vercel.app/icon-192.png';
  const awayLogo = match.away_team?.logo_url || 'https://yalla-shoot-new.vercel.app/icon-192.png';

  const isFinished = match.status === 'FINISHED';
  
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0e17',
          color: 'white',
          padding: '60px',
          fontFamily: 'sans-serif',
          backgroundImage: 'linear-gradient(135deg, #0a0e17 0%, #1a2235 100%)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px 40px', borderRadius: '30px', fontSize: 36, color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}>
            {leagueName}
          </div>
        </div>

        {/* Teams Area */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
          
          {/* Home Team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%' }}>
            {homeLogo ? (
              <img src={homeLogo} width={220} height={220} style={{ objectFit: 'contain' }} />
            ) : null}
            <h2 style={{ fontSize: 52, marginTop: '30px', textAlign: 'center', fontWeight: 'bold' }}>{homeName}</h2>
          </div>

          {/* VS / Score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
             {isFinished ? (
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 90, fontWeight: 'bold', background: 'rgba(0,0,0,0.3)', padding: '20px 40px', borderRadius: '30px' }}>
                   <span style={{ color: '#fff' }}>{match.home_score}</span>
                   <span style={{ margin: '0 30px', color: '#64748b' }}>-</span>
                   <span style={{ color: '#fff' }}>{match.away_score}</span>
                </div>
             ) : (
                <div style={{ fontSize: 70, color: '#64748b', fontWeight: 'bold', letterSpacing: '4px' }}>VS</div>
             )}
          </div>

          {/* Away Team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%' }}>
            {awayLogo ? (
              <img src={awayLogo} width={220} height={220} style={{ objectFit: 'contain' }} />
            ) : null}
            <h2 style={{ fontSize: 52, marginTop: '30px', textAlign: 'center', fontWeight: 'bold' }}>{awayName}</h2>
          </div>

        </div>

        {/* Footer Branding */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
          <div style={{ fontSize: 28, color: '#00e676', fontWeight: 'bold', letterSpacing: '2px', background: 'rgba(0, 230, 118, 0.1)', padding: '10px 30px', borderRadius: '20px' }}>
            YALLA SHOOT NEW
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
