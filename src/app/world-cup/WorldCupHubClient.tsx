"use client";

import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import { translateName } from "@/lib/translations";
import { TournamentBracket } from "@/components/TournamentBracket/TournamentBracket";
import { generateMockMatches } from "@/components/TournamentBracket/utils/mockData";

interface StandingRow {
  id: string;
  position: number;
  played: number;
  points: number;
  teams: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  team_id?: string;
  team_name?: string;
}

interface Match {
  id: string;
  match_date: string;
  status: string;
  home_score: number;
  away_score: number;
  home_team: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  away_team: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  league: {
    name: string;
  } | null;
}

interface Scorer {
  id: string;
  name: string;
  club: string | null;
  national_team: string | null;
  goals: number | null;
  assists: number | null;
}

function WorldCupHubContent() {
  const searchParams = useSearchParams();
  const group = searchParams.get('group');

  const validGroups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const currentGroup = group ? group.toUpperCase() : 'A';
  const isValidGroup = validGroups.includes(currentGroup);

  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [standingsRes, matchesRes, scorersRes] = await Promise.all([
          supabase
            .from('standings')
            .select('id, position, played, points, teams(id, name, logo_url)')
            .order('position', { ascending: true }),
          supabase
            .from('matches')
            .select('id, match_date, status, home_score, away_score, home_team:teams!matches_home_team_id_fkey(id, name, logo_url), away_team:teams!matches_away_team_id_fkey(id, name, logo_url), league:leagues(name)')
            .limit(10),
          supabase
            .from('players')
            .select('id, name, club, national_team, goals, assists')
            .order('goals', { ascending: false })
            .limit(5)
        ]);

        if (!active) return;

        if (standingsRes.data) {
          setStandings(standingsRes.data as unknown as StandingRow[]);
        }
        if (matchesRes.data) {
          setMatches(matchesRes.data as unknown as Match[]);
        }
        if (scorersRes.data) {
          setScorers(scorersRes.data as unknown as Scorer[]);
        }
      } catch (err) {
        console.error("Error fetching world cup data:", err);
      }
    }

    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const displayedStandings = isValidGroup ? standings : [];

  return (
    <div className="container mx-auto px-4 py-8 flex-1 max-w-6xl font-tajawal">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="text-sm text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)]">الرئيسية</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">كأس العالم</span>
      </nav>

      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-3xl md:text-5xl font-bold font-arabic text-[var(--color-text-primary)] mb-2">
          كأس العالم
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm md:text-base">
          تغطية حصرية وحية لبطولة كأس العالم - ترتيب المجموعات، الهدافين، والمباريات المباشرة
        </p>
      </header>

      {/* Group Selector */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {validGroups.map(g => (
          <Link
            key={g}
            href={`/world-cup?group=${g}`}
            className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${
              currentGroup === g
                ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]'
            }`}
          >
            المجموعة {g}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Standings Section */}
        <section className="lg:col-span-2 bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold font-arabic text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border-subtle)]">
            جدول الترتيب
          </h2>

          {!isValidGroup || displayedStandings.length === 0 ? (
            <p className="text-center py-10 text-[var(--color-text-secondary)]">لا يوجد ترتيب متاح حالياً</p>
          ) : (
            <div className="overflow-x-auto">
              <table data-testid="standings-table" className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] text-sm">
                    <th className="pb-3 w-12 text-center">#</th>
                    <th className="pb-3">الفريق</th>
                    <th className="pb-3 text-center">لعب</th>
                    <th className="pb-3 text-center">النقاط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {displayedStandings.map((row: StandingRow, idx: number) => (
                    <tr key={row.id || idx} className="text-sm hover:bg-[var(--color-bg-primary)]/50 transition-colors">
                      <td className="py-4 text-center font-bold text-[var(--color-text-secondary)]">{row.position || idx + 1}</td>
                      <td className="py-4 font-bold flex items-center gap-2">
                        <Link href={`/teams/${row.teams?.id || row.team_id || 'ahly'}`} className="hover:text-[var(--color-accent)] transition-colors">
                          {row.teams?.name || row.team_name || 'فريق تجريبي'}
                        </Link>
                      </td>
                      <td className="py-4 text-center">{row.played}</td>
                      <td className="py-4 text-center font-bold text-[var(--color-accent)]">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Top Scorers Section */}
        <section className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold font-arabic text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border-subtle)]">
            الهدافين
          </h2>
          <ul data-testid="scorers-list" className="divide-y divide-[var(--color-border-subtle)]">
            {scorers.map((scorer, index) => (
              <li key={scorer.id} className="py-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[var(--color-text-secondary)] w-5 text-center">{index + 1}</span>
                  <div>
                    <Link href={`/players/${scorer.id}`} className="font-bold hover:text-[var(--color-accent)] transition-colors">
                      {scorer.name}
                    </Link>
                    <p className="text-xs text-[var(--color-text-muted)]">{scorer.club || 'لاعب حر'}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="font-bold text-[var(--color-accent)]">{scorer.goals || 0} أهداف</span>
                  <p className="text-xs text-[var(--color-text-muted)]">{scorer.assists || 0} تمريرة حاسمة</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Tournament Bracket Section (Knockout) */}
      <section className="mt-12 bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-6 shadow-sm overflow-hidden">
        <TournamentBracket matches={generateMockMatches()} tournamentName="كأس العالم" />
      </section>

      {/* Matches Section */}
      <section className="mt-12 bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold font-arabic text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border-subtle)]">
          المباريات
        </h2>
        {matches.length === 0 ? (
          <p className="text-center py-10 text-[var(--color-text-secondary)]">لا توجد مباريات جارية حالياً</p>
        ) : (
          <div className="flex flex-col gap-4">
            {[...matches]
              .sort((a, b) => {
                // Sorting logic: FINISHED matches first, then IN_PLAY/TIMED, then SCHEDULED
                const getStatusWeight = (status: string) => {
                  if (status === 'FINISHED' || status === 'AWARDED') return 0;
                  if (status === 'IN_PLAY' || status === 'PAUSED') return 1;
                  return 2; // SCHEDULED, POSTPONED, etc.
                };
                const weightA = getStatusWeight(a.status);
                const weightB = getStatusWeight(b.status);
                
                if (weightA !== weightB) return weightA - weightB;
                
                // If same status, sort by date (newest first for finished, oldest first for scheduled)
                const dateA = new Date(a.match_date).getTime();
                const dateB = new Date(b.match_date).getTime();
                
                if (weightA === 0) return dateB - dateA; // Finished: newest first
                return dateA - dateB; // Upcoming: closest first
              })
              .map((match) => {
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
                    status={match.status as any}
                    league={translateName(match.league?.name || 'كأس العالم')}
                  />
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function WorldCupHubClient() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">جاري التحميل...</div>}>
      <WorldCupHubContent />
    </Suspense>
  );
}
