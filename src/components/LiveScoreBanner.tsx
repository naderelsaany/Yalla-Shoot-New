'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';


interface Match {
  id: string;
  home_team: { id?: string; name: string } | null;
  away_team: { id?: string; name: string } | null;
  home_score: number;
  away_score: number;
  status: string;
  slug?: string;
}

export default function LiveScoreBanner() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => setIsMounted(true), 0);
    if (localStorage.getItem('hide-live-banner') === 'true') {
      setTimeout(() => setIsClosed(true), 0);
    }
  }, []);

  useEffect(() => {
    if (isClosed) return;

    const fetchLiveMatches = async () => {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('id, slug, status, home_score, away_score, home_team:teams!matches_home_team_id_fkey(id, name), away_team:teams!matches_away_team_id_fkey(id, name)')
          .in('status', ['IN_PLAY', 'LIVE'])
          .not('home_team', 'is', null)
          .not('away_team', 'is', null);

        if (error) {
          console.error(error);
          setIsVisible(false);
          return;
        }

        if (data) {
          const formattedMatches = (data as unknown as Match[])
            .filter((item) => ['IN_PLAY', 'LIVE'].includes(item.status))
            .map((item) => ({
              id: item.id,
              status: item.status,
              home_score: item.home_score,
              away_score: item.away_score,
              home_team: item.home_team ? { id: item.home_team.id, name: item.home_team.name } : null,
              away_team: item.away_team ? { id: item.away_team.id, name: item.away_team.name } : null,
              slug: item.slug,
            }));
          setLiveMatches(formattedMatches);
          setIsVisible(formattedMatches.length > 0);
        } else {
          setIsVisible(false);
        }
      } catch {
        setIsVisible(false);
      }
    };

    fetchLiveMatches();

    const channel = supabase
      .channel('live-banner')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          fetchLiveMatches();
        }
      )
      .subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveMatches();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isClosed]);

  useEffect(() => {
    const hasBanner = !isClosed && isVisible && liveMatches.length > 0;
    if (hasBanner) {
      document.body.classList.add('has-live-banner');
    } else {
      document.body.classList.remove('has-live-banner');
    }
    return () => {
      document.body.classList.remove('has-live-banner');
    };
  }, [isClosed, isVisible, liveMatches]);

  const handleClose = () => {
    localStorage.setItem('hide-live-banner', 'true');
    setIsClosed(true);
  };

  if (!isMounted || isClosed || !isVisible || liveMatches.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="live-banner"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-elevated)] border-t border-[var(--color-border-subtle)] py-3 px-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar flex-1">
        <span className="flex items-center gap-1 bg-[var(--color-live)]/10 text-[var(--color-live)] text-xs font-bold px-2 py-1 rounded-full animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-live)]"></span>
          مباشر
        </span>
        <div className="flex items-center gap-6 divide-x divide-x-reverse divide-[var(--color-border-subtle)] overflow-x-auto no-scrollbar">
          {liveMatches.map((match) => (
            <Link
              key={match.id}
              href={`/match/${match.slug || match.id}`}
              className="flex items-center gap-3 hover:bg-[var(--color-bg-primary)] px-3 py-1 rounded-lg transition-colors text-sm font-tajawal text-[var(--color-text-primary)]"
            >
              <span>{match.home_team?.name}</span>
              <span className="font-bold bg-[var(--color-bg-primary)] px-2 py-0.5 rounded border border-[var(--color-border-subtle)] text-[var(--color-accent)]">
                {match.home_score} - {match.away_score}
              </span>
              <span>{match.away_team?.name}</span>
            </Link>
          ))}
        </div>
      </div>
      <button
        onClick={handleClose}
        data-testid="close-banner"
        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1.5 rounded-lg hover:bg-[var(--color-bg-primary)]"
        aria-label="إغلاق"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
