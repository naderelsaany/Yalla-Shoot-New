'use client';

import { useEffect, useState } from 'react';
import MatchCard from './MatchCard';
import { supabase } from '@/lib/supabase';
import { translateName } from '@/lib/translations';

export default function LiveMatchesList({ initialMatches }: { initialMatches: any[] }) {
  const [matches, setMatches] = useState(initialMatches);

  useEffect(() => {
    const channel = supabase
      .channel('public:matches')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          console.log('Realtime update received!', payload);
          
          if (payload.eventType === 'UPDATE') {
            setMatches((current) =>
              current.map((m) =>
                m.id === payload.new.id ? { ...m, ...payload.new } : m
              )
            );
          } else if (payload.eventType === 'INSERT') {
            // ✅ إصلاح: إضافة المباريات الجديدة
            setMatches((current) => {
              // التحقق من عدم التكرار
              if (current.some(m => m.id === payload.new.id)) return current;
              return [...current, payload.new];
            });
          } else if (payload.eventType === 'DELETE') {
            // ✅ إصلاح: إزالة المباريات المحذوفة
            setMatches((current) => current.filter(m => m.id !== payload.old.id));
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
            homeLogo={match.home_team?.logo_url}
            awayLogo={match.away_team?.logo_url}
            homeScore={match.home_score}
            awayScore={match.away_score}
            time={timeString}
            status={match.status as any}
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
