'use client';

import { useEffect, useState } from 'react';
import MatchCard, { MatchCardProps } from './MatchCard';
import { supabase } from '@/lib/supabase';
import { translateName } from '@/lib/translations';
import { MatchWithTeams } from '@/types/database';

export default function LiveMatchesList({ initialMatches }: { initialMatches: MatchWithTeams[] }) {
  const [matches, setMatches] = useState(initialMatches);

  useEffect(() => {
    const channel = supabase
      .channel('public:matches')
      .on<{ id: string }>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          console.log('Realtime update received!', payload);
          
          if (payload.eventType === 'DELETE') {
            const oldId = payload.old.id;
            if (oldId) {
              setMatches((current) => current.filter((m) => m.id !== oldId));
            }
          } else if (payload.eventType === 'INSERT') {
            const newId = payload.new.id;
            if (newId) {
              supabase
                .from('matches')
                .select(`
                  id,
                  match_date,
                  status,
                  home_score,
                  away_score,
                  home_team:teams!matches_home_team_id_fkey(name, logo_url),
                  away_team:teams!matches_away_team_id_fkey(name, logo_url),
                  league:leagues(name)
                `)
                .eq('id', newId)
                .single()
                .then((res) => {
                  const error = res.error;
                  const data = res.data as MatchWithTeams | null;
                  if (error) {
                    console.error('Error fetching full match data for realtime update:', error);
                    return;
                  }
                  if (data) {
                    setMatches((current) => {
                      const exists = current.some((m) => m.id === data.id);
                      if (exists) {
                        return current.map((m) => (m.id === data.id ? data : m));
                      } else {
                        return [...current, data];
                      }
                    });
                  }
                });
            }
          } else if (payload.eventType === 'UPDATE') {
            const newId = payload.new.id;
            if (newId) {
              supabase
                .from('matches')
                .select(`
                  id,
                  match_date,
                  status,
                  home_score,
                  away_score,
                  home_team:teams!matches_home_team_id_fkey(name, logo_url),
                  away_team:teams!matches_away_team_id_fkey(name, logo_url),
                  league:leagues(name)
                `)
                .eq('id', newId)
                .single()
                .then((res) => {
                  const error = res.error;
                  const data = res.data as MatchWithTeams | null;
                  if (error) {
                    console.error('Error fetching full match data for realtime update:', error);
                    return;
                  }
                  if (data) {
                    setMatches((current) => {
                      const exists = current.some((m) => m.id === data.id);
                      if (exists) {
                        return current.map((m) => (m.id === data.id ? data : m));
                      } else {
                        return [...current, data];
                      }
                    });
                  }
                });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {matches.map((match) => {
        const dateObj = new Date(match.match_date);
        const timeString = dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' });
        
        return (
          <MatchCard 
            key={match.id}
            id={match.id}
            homeTeam={translateName(match.home_team?.name || 'فريق')}
            awayTeam={translateName(match.away_team?.name || 'فريق')}
            homeLogo={match.home_team?.logo_url ?? undefined}
            awayLogo={match.away_team?.logo_url ?? undefined}
            homeScore={match.home_score}
            awayScore={match.away_score}
            time={timeString}
            status={match.status as MatchCardProps['status']}
            league={translateName(match.league?.name || 'بطولة')}
          />
        );
      })}
      {matches.length === 0 && (
        <div className="col-span-full text-center py-12 text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)]">
          لا توجد مباريات متاحة حالياً.
        </div>
      )}
    </div>
  );
}
