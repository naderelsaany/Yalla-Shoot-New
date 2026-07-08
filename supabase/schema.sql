-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. leagues (البطولات)
CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country TEXT,
  season_start DATE,
  season_end DATE,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. teams (الفرق)
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  stadium TEXT,
  founded_year INTEGER,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. league_teams (رابط البطولات بالفرق)
CREATE TABLE public.league_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  season TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. matches (المباريات)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED', 'FINISHED', 'SUSPENDED', 'POSTPONED', 'CANCELLED', 'AWARDED')),
  home_score INTEGER,
  away_score INTEGER,
  half_time_home INTEGER,
  half_time_away INTEGER,
  round INTEGER,
  minute INTEGER,
  venue TEXT,
  referee TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. match_events (أحداث المباراة)
CREATE TABLE public.match_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  player_name TEXT,
  event_type TEXT CHECK (event_type IN ('GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'PENALTY')),
  minute INTEGER,
  extra_time INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. standings (ترتيب الدوري)
CREATE TABLE public.standings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  season TEXT,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  position INTEGER,
  form TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. news (الأخبار)
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  image_url TEXT,
  league_id UUID REFERENCES public.leagues(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  author TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  is_featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. users (المستخدمين)
-- (Assuming integration with auth.users later, but for now a simple profile table)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY, -- Should map to auth.users.id
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  favorite_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  favorite_league_id UUID REFERENCES public.leagues(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. user_bookmarks (المفضلة)
CREATE TABLE public.user_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  news_id UUID REFERENCES public.news(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. players (اللاعبين)
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  club TEXT,
  national_team TEXT,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- الفهارس الموصى بها (Indexes) لأداء أفضل
CREATE INDEX idx_matches_date ON public.matches(match_date);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_league ON public.matches(league_id);

CREATE INDEX idx_standings_league_season ON public.standings(league_id, season);
CREATE INDEX idx_standings_points ON public.standings(points DESC);

CREATE INDEX idx_news_published ON public.news(published_at DESC);
CREATE INDEX idx_news_team ON public.news(team_id);
CREATE INDEX idx_news_league ON public.news(league_id);

-- Enable RLS but allow public read access for the website
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to leagues" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "Allow public read access to teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access to matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Allow public read access to news" ON public.news FOR SELECT USING (true);
CREATE POLICY "Allow public read access to standings" ON public.standings FOR SELECT USING (true);
CREATE POLICY "Allow public read access to players" ON public.players FOR SELECT USING (true);

-- Enable Realtime for Matches table
alter publication supabase_realtime add table matches;
