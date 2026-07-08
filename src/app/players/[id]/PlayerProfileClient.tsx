"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  params: Promise<{ id: string }>;
}

interface Player {
  id: string;
  name: string;
  club: string | null;
  national_team: string | null;
  goals: number | null;
  assists: number | null;
}

export default function PlayerProfileClient({ params }: Props) {
  const { id } = use(params);

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchPlayer() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("players")
          .select("*")
          .eq("id", id)
          .single();

        if (!active) return;

        if (error || !data) {
          setIsNotFound(true);
        } else {
          const playerData = Array.isArray(data) ? data[0] : data;
          if (!playerData) {
            setIsNotFound(true);
          } else {
            setPlayer(playerData as Player);
          }
        }
      } catch {
        if (active) {
          setIsNotFound(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchPlayer();
    return () => {
      active = false;
    };
  }, [id]);

  if (isNotFound) {
    return (
      <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl text-center font-tajawal">
        <h1 className="text-6xl font-bold text-[var(--color-accent)] mb-4">404</h1>
        <p className="text-xl text-[var(--color-text-secondary)]">لم يتم العثور على اللاعب</p>
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

  if (!player) {
    return (
      <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl text-center font-tajawal">
        <h1 className="text-6xl font-bold text-[var(--color-accent)] mb-4">404</h1>
        <p className="text-xl text-[var(--color-text-secondary)]">لم يتم العثور على اللاعب</p>
      </div>
    );
  }

  const goals = player.goals ?? 0;
  const assists = player.assists ?? 0;

  const athleteSchema = {
    "@context": "https://schema.org",
    "@type": "Athlete",
    "name": player.name,
    "description": `تفاصيل وإحصائيات اللاعب ${player.name}`,
    "memberOf": [
      player.club ? {
        "@type": "SportsTeam",
        "name": player.club
      } : null,
      player.national_team ? {
        "@type": "SportsTeam",
        "name": player.national_team
      } : null
    ].filter(Boolean),
  };

  return (
    <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl font-tajawal">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(athleteSchema) }}
      />

      {/* Header */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-arabic text-[var(--color-text-primary)] mb-4">
          {player.name}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-6">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2">
            <span className="font-bold text-[var(--color-text-secondary)]">النادي</span>
            <span className="text-[var(--color-text-primary)]">{player.club || "لاعب حر"}</span>
          </div>
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2">
            <span className="font-bold text-[var(--color-text-secondary)]">المنتخب</span>
            <span className="text-[var(--color-text-primary)]">{player.national_team || "غير محدد"}</span>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-bold font-arabic text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border-subtle)]">
          الإحصائيات
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-2xl p-5 text-center">
            <span className="text-xs text-[var(--color-text-secondary)] block mb-1">الأهداف</span>
            <span className="text-2xl md:text-3xl font-bold font-tajawal text-[var(--color-accent)]">
              {goals}
            </span>
          </div>

          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-2xl p-5 text-center">
            <span className="text-xs text-[var(--color-text-secondary)] block mb-1">التمريرات الحاسمة</span>
            <span className="text-2xl md:text-3xl font-bold font-tajawal text-[var(--color-text-primary)]">
              {assists}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
