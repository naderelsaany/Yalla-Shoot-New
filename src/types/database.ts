export interface League {
  id: string;
  name: string;
  country?: string | null;
  logo_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Team {
  id: string;
  name: string;
  logo_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Match {
  id: string;
  league_id?: string | null;
  home_team_id?: string | null;
  away_team_id?: string | null;
  home_score: number | null;
  away_score: number | null;
  status: 'SCHEDULED' | 'IN_PLAY' | 'FINISHED' | string;
  match_date: string;
  video_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Standing {
  id: string;
  league_id: string;
  team_id: string;
  position: number;
  played: number;
  points: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface News {
  id?: string;
  title: string;
  slug: string;
  content?: string | null;
  image_url?: string | null;
  source?: string | null;
  published_at: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StandingWithTeam extends Standing {
  teams: Pick<Team, 'name' | 'logo_url'> | null;
}

export interface MatchWithTeams extends Match {
  home_team?: Pick<Team, 'id' | 'name' | 'logo_url'> | null;
  away_team?: Pick<Team, 'id' | 'name' | 'logo_url'> | null;
  league?: Pick<League, 'name'> | null;
  video_url?: string | null;
}
