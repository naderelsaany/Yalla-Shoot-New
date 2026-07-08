import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase';
import MatchesManager from './MatchesManager';
import NewsManager from './NewsManager';
import MatchAdder from './MatchAdder';

export const revalidate = 0; // Don't cache the admin dashboard

export default async function AdminDashboard() {
  // Fetch matches that are NOT FINISHED or are scheduled for today/future
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const supabaseAdmin = getServiceSupabase();

  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(name, logo_url),
      away_team:teams!matches_away_team_id_fkey(name, logo_url),
      league:leagues(name)
    `)
    .neq('status', 'FINISHED')
    .gte('match_date', todayStart.toISOString())
    .order('match_date', { ascending: true })
    .limit(50);

  // Fetch leagues and teams for the Match Adder
  const { data: leagues } = await supabaseAdmin.from('leagues').select('id, name').order('name');
  const { data: teams } = await supabaseAdmin.from('teams').select('id, name').order('name');

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="text-2xl font-bold font-tajawal mb-6">إضافة مباراة يدوياً</h2>
        <MatchAdder leagues={leagues || []} teams={teams || []} />
      </section>

      <section>
        <h2 className="text-2xl font-bold font-tajawal mb-6">إدارة المباريات الحالية (إضافة بث وتحديث)</h2>
        <MatchesManager initialMatches={matches || []} />
      </section>

      <section>
        <h2 className="text-2xl font-bold font-tajawal mb-6">إدارة الأخبار</h2>
        <NewsManager />
      </section>
    </div>
  );
}
