export interface BracketTeam {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export type MatchStatus = 'SCHEDULED' | 'IN_PLAY' | 'FINISHED' | 'PAUSED' | 'AWARDED' | 'POSTPONED' | 'CANCELLED';

export interface BracketMatch {
  id: string;
  nextMatchId?: string | null; // ID of the match the winner advances to
  homeTeam: BracketTeam | null;
  awayTeam: BracketTeam | null;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  matchDate: string; // ISO date string
  roundName: string; // e.g., "النهائي", "نصف النهائي"
  leagueName?: string;
}

export interface BracketNodeData {
  match: BracketMatch;
  children: BracketNodeData[];
}
