import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BracketMatch } from './types';
import { translateName } from '@/lib/translations';
import { WinnerBadge } from './WinnerBadge';

interface MatchCardProps {
  match: BracketMatch;
}

export const MatchCard = React.memo(({ match }: MatchCardProps) => {
  const isFinished = match.status === 'FINISHED' || match.status === 'AWARDED';
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
  const isScheduled = match.status === 'SCHEDULED' || match.status === 'POSTPONED';

  const homeScore = match.homeScore ?? 0;
  const awayScore = match.awayScore ?? 0;
  
  const homeWins = isFinished && homeScore > awayScore;
  const awayWins = isFinished && awayScore > homeScore;

  const dateObj = new Date(match.matchDate);
  const timeString = dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' });
  const dateString = dateObj.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', timeZone: 'Africa/Cairo' });

  return (
    <Link 
      href={`/match/${match.id}`}
      className="flex flex-col w-[280px] sm:w-[320px] bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)] hover:border-[var(--color-accent)] hover:shadow-[var(--shadow-elevated)] transition-all shrink-0 font-tajawal group outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      aria-label={`مباراة ${match.roundName}: ${match.homeTeam?.name || 'مجهول'} ضد ${match.awayTeam?.name || 'مجهول'}`}
    >
      {/* Header: Date, Time, Status */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]">
        <span className="font-bold">{match.roundName}</span>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1 text-red-500 font-bold animate-pulse">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              مباشر
            </span>
          ) : (
            <span>{dateString} - {timeString}</span>
          )}
        </div>
      </div>

      {/* Teams and Scores */}
      <div className="p-4 flex flex-col gap-3">
        {/* Home Team */}
        <div className={`flex items-center justify-between ${isFinished && !homeWins && homeScore !== awayScore ? 'opacity-50' : 'opacity-100'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 relative shrink-0">
              {match.homeTeam?.logoUrl ? (
                <Image src={match.homeTeam.logoUrl} alt={match.homeTeam.name} fill className="object-contain" sizes="32px" />
              ) : (
                <div className="w-full h-full bg-[var(--color-bg-primary)] rounded-full border border-[var(--color-border-subtle)]"></div>
              )}
            </div>
            <span className="font-bold text-[var(--color-text-primary)] truncate max-w-[140px] sm:max-w-[180px]">
              {translateName(match.homeTeam?.name || 'فريق')}
            </span>
            {homeWins && <WinnerBadge />}
          </div>
          <span className={`font-bold text-lg ${homeWins ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
            {!isScheduled ? homeScore : '-'}
          </span>
        </div>

        {/* Away Team */}
        <div className={`flex items-center justify-between ${isFinished && !awayWins && homeScore !== awayScore ? 'opacity-50' : 'opacity-100'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 relative shrink-0">
              {match.awayTeam?.logoUrl ? (
                <Image src={match.awayTeam.logoUrl} alt={match.awayTeam.name} fill className="object-contain" sizes="32px" />
              ) : (
                <div className="w-full h-full bg-[var(--color-bg-primary)] rounded-full border border-[var(--color-border-subtle)]"></div>
              )}
            </div>
            <span className="font-bold text-[var(--color-text-primary)] truncate max-w-[140px] sm:max-w-[180px]">
              {translateName(match.awayTeam?.name || 'فريق')}
            </span>
            {awayWins && <WinnerBadge />}
          </div>
          <span className={`font-bold text-lg ${awayWins ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
            {!isScheduled ? awayScore : '-'}
          </span>
        </div>
      </div>
      
      {/* Action Footer (Appears on hover) */}
      <div className="h-0 group-hover:h-8 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-bold flex items-center justify-center transition-all overflow-hidden">
        تفاصيل المباراة
      </div>
    </Link>
  );
});

MatchCard.displayName = 'MatchCard';
