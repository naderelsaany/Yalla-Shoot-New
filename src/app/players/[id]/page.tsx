import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import PlayerProfileClient from "./PlayerProfileClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const { data: player } = await supabase
      .from("players")
      .select("name")
      .eq("id", id)
      .single();

    if (!player) {
      return {
        title: "لاعب غير موجود | يلا شوت نيو",
        description: "تفاصيل وإحصائيات",
      };
    }

    return {
      title: `${player.name} - تفاصيل وإحصائيات | يلا شوت نيو`,
      description: `تفاصيل وإحصائيات اللاعب ${player.name}. الأهداف والتمريرات الحاسمة ومسيرته الاحترافية مع النادي والمنتخب.`,
    };
  } catch {
    return {
      title: "لاعب غير موجود | يلا شوت نيو",
      description: "تفاصيل وإحصائيات",
    };
  }
}

export default async function PlayerProfilePage({ params }: Props) {
  return <PlayerProfileClient params={params} />;
}
