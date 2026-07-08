import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import TeamProfileClient from "./TeamProfileClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const { data: team } = await supabase
      .from("teams")
      .select("name")
      .eq("id", id)
      .single();

    if (!team) {
      return {
        title: "نادي غير موجود | يلا شوت نيو",
      };
    }

    return {
      title: `${team.name} - التفاصيل، القائمة والترتيب | يلا شوت نيو`,
      description: `صفحة نادي ${team.name}. تابع قائمة اللاعبين، الترتيب في الدوري، وآخر مباريات وأخبار الفريق.`,
    };
  } catch {
    return {
      title: "نادي غير موجود | يلا شوت نيو",
    };
  }
}

export default async function TeamProfilePage({ params }: Props) {
  return <TeamProfileClient params={params} />;
}
