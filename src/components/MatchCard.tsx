import Link from 'next/link';
import TeamLogo from './TeamLogo';

export interface MatchCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  time: string;
  date?: string;
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED' | 'AWARDED';
  league: string;
}

const statusLabels: Record<string, { label: string; color: string; live?: boolean }> = {
  SCHEDULED: { label: 'مجدولة', color: 'text-[var(--color-text-muted)]' },
  TIMED: { label: 'موقوتة', color: 'text-[var(--color-text-muted)]' },
  IN_PLAY: { label: 'مباشر', color: 'text-[var(--color-live)]', live: true },
  PAUSED: { label: 'استراحة', color: 'text-yellow-500' },
  FINISHED: { label: 'انتهت', color: 'text-[var(--color-text-primary)]' },
  SUSPENDED: { label: 'معلقة', color: 'text-red-400' },
  POSTPONED: { label: 'مؤجلة', color: 'text-orange-400' },
  CANCELLED: { label: 'ملغاة', color: 'text-red-500' },
  AWARDED: { label: 'محتسبة', color: 'text-[var(--color-accent)]' },
};

export default function MatchCard({
  id,
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
  homeScore,
  awayScore,
  time,
  date,
  status,
  league,
}: MatchCardProps) {
  const statusInfo = statusLabels[status] || statusLabels.SCHEDULED;

  return (
    <Link href={`/match/${id}`} className="group relative block overflow-hidden rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-accent)] opacity-5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--color-border-subtle)]">
        <span className="text-xs font-tajawal text-[var(--color-text-secondary)]">{league}</span>
        {statusInfo.live ? (
          <span className={`flex items-center gap-1.5 text-xs font-bold ${statusInfo.color} animate-pulse`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-live)]"></span>
            {statusInfo.label}
          </span>
        ) : (
          <span className={`text-xs font-bold font-tajawal ${statusInfo.color} bg-[var(--color-bg-primary)] px-2 py-1 rounded-md shadow-inner border border-[var(--color-border-subtle)]`}>
            {statusInfo.label}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-2 flex-1">
          <TeamLogo src={homeLogo} alt={homeTeam} size="md" />
          <span className="text-sm font-bold text-center text-[var(--color-text-primary)]">{homeTeam}</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-2">
          {status === 'SCHEDULED' || status === 'TIMED' || status === 'POSTPONED' || status === 'CANCELLED' ? (
            <div className="flex flex-col items-center gap-1 bg-[var(--color-bg-elevated)] py-2 px-3 rounded-xl border border-[var(--color-border-subtle)]">
              <span className="text-sm md:text-base font-bold font-tajawal text-[var(--color-text-primary)] whitespace-nowrap">{time}</span>
              {date && <span className="text-[10px] md:text-xs font-tajawal text-[var(--color-text-muted)] whitespace-nowrap">{date}</span>}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-2xl font-bold font-tajawal text-[var(--color-text-primary)]">
              <span>{homeScore ?? '-'}</span>
              <span className="text-[var(--color-text-muted)]">-</span>
              <span>{awayScore ?? '-'}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 flex-1">
          <TeamLogo src={awayLogo} alt={awayTeam} size="md" />
          <span className="text-sm font-bold text-center text-[var(--color-text-primary)]">{awayTeam}</span>
        </div>
      </div>
      
      
      <div className="mt-3 text-center">
        <span className="text-xs text-[var(--color-accent)] font-tajawal font-medium group-hover:underline">عرض التفاصيل</span>
      </div>
    </Link>
  );
}
