"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  league_id: string | null;
}

interface Player {
  id: string;
  name: string;
  club: string | null;
  national_team: string | null;
  goals: number | null;
  assists: number | null;
}

interface Standing {
  position: number;
  played: number;
  points: number;
}

export default function TeamProfileClient({ params }: Props) {
  const { id } = use(params);

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [standing, setStanding] = useState<Standing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchTeamData() {
      setLoading(true);
      try {
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("*")
          .eq("id", id)
          .single();

        if (!active) return;

        if (teamError || !teamData) {
          setIsNotFound(true);
          return;
        }

        const resolvedTeam = Array.isArray(teamData) ? teamData[0] : teamData;
        if (!resolvedTeam) {
          setIsNotFound(true);
          return;
        }

        const currentTeam = resolvedTeam as Team;
        setTeam(currentTeam);

        // Fetch players and standings concurrently
        const fetches: PromiseLike<void>[] = [];

        // Fetch players
        fetches.push(
          supabase
            .from("players")
            .select("*")
            .or(`club.eq."${currentTeam.name}",national_team.eq."${currentTeam.name}"`)
            .then(async ({ data: playersData }) => {
              let fetchedPlayers = (playersData || []) as Player[];
              if (fetchedPlayers.length === 0) {
                // Try fallback matching by club directly
                const { data: fallbackData } = await supabase
                  .from("players")
                  .select("*")
                  .eq("club", currentTeam.name);
                fetchedPlayers = (fallbackData || []) as Player[];
              }
              if (active) {
                setPlayers(fetchedPlayers);
              }
            })
        );

        // Fetch standing if league_id exists
        if (currentTeam.league_id) {
          fetches.push(
            supabase
              .from("standings")
              .select("position, played, points")
              .eq("team_id", currentTeam.id)
              .maybeSingle()
              .then(({ data: standingData }) => {
                if (active && standingData) {
                  setStanding(standingData as Standing);
                }
              })
          );
        }

        await Promise.all(fetches);
      } catch {
        if (active) {
          setIsNotFound(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchTeamData();
    return () => {
      active = false;
    };
  }, [id]);

  if (isNotFound) {
    return (
      <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl text-center font-tajawal">
        <h1 className="text-6xl font-bold text-[var(--color-accent)] mb-4">404</h1>
        <p className="text-xl text-[var(--color-text-secondary)]">لم يتم العثور على النادي</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl text-center font-tajawal">
        جاري التحميل...
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl text-center font-tajawal">
        <h1 className="text-6xl font-bold text-[var(--color-accent)] mb-4">404</h1>
        <p className="text-xl text-[var(--color-text-secondary)]">لم يتم العثور على النادي</p>
      </div>
    );
  }

  const sportsTeamSchema = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    "name": team.name,
    "image": team.logo_url,
    "member": players.map(p => ({
      "@type": "OrganizationRole",
      "athlete": {
        "@type": "Athlete",
        "name": p.name,
        "url": `https://yallashootnew.com/players/${p.id}`
      }
    }))
  };

  return (
    <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl font-tajawal">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsTeamSchema) }}
      />

      {/* Header */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-6 md:p-10 shadow-sm flex flex-col md:flex-row items-center gap-6 mb-8 relative overflow-hidden">
        <div className="relative w-24 h-24 flex-shrink-0 bg-[var(--color-bg-primary)] rounded-full border border-[var(--color-border-subtle)] flex items-center justify-center overflow-hidden">
          {team.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.logo_url}
              alt={`شعار ${team.name}`}
              className="w-16 h-16 object-contain"
            />
          ) : (
            <span className="text-sm font-bold text-[var(--color-text-secondary)] text-center px-2">
              {team.name}
            </span>
          )}
        </div>

        <div className="text-center md:text-right flex-1">
          <h1 className="text-3xl font-bold font-arabic text-[var(--color-text-primary)] mb-2">
            {team.name}
          </h1>
          <div className="text-sm text-[var(--color-text-secondary)]">
            <span className="font-bold">الترتيب: </span>
            {team.league_id ? (
              <span>
                المركز {standing?.position || "غير متوفر حالياً"} في البطولة الرسمية ({standing?.points || 0} نقطة)
              </span>
            ) : (
              <span>لا يشارك في بطولة رسمية</span>
            )}
          </div>
        </div>
      </div>

      {/* Squad list */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-bold font-arabic text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border-subtle)]">
          قائمة اللاعبين
        </h2>

        {players.length === 0 ? (
          <p className="text-center py-10 text-[var(--color-text-secondary)]">لا يوجد لاعبين مسجلين حالياً</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                data-testid="player-link"
                className="flex items-center justify-between p-4 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-2xl hover:border-[var(--color-accent)] transition-all"
              >
                <div>
                  <span className="font-bold text-[var(--color-text-primary)] block">
                    {player.name}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {player.national_team || "لاعب"}
                  </span>
                </div>
                <div className="text-left text-xs text-[var(--color-text-secondary)]">
                  <span className="font-bold text-[var(--color-accent)]">{player.goals || 0} أهداف</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
