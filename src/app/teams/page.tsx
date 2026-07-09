import { supabase } from '@/lib/supabase';
import { Metadata } from 'next';
import Link from 'next/link';
import TeamLogo from '@/components/TeamLogo';
import { translateName } from '@/lib/translations';

export const metadata: Metadata = {
  title: 'الفرق والأندية',
  description: 'قائمة الفرق والأندية المشاركة في البطولات.',
};

export default async function TeamsPage() {
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, logo_url')
    .order('name');

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <h1 className="text-3xl font-bold font-tajawal mb-6">الفرق والأندية</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {teams?.map(team => (
          <Link href={`/teams/${team.id}`} key={team.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-4 text-center hover:shadow-[var(--shadow-elevated)] transition-all">
            <div className="flex justify-center mb-3">
              <TeamLogo src={team.logo_url || undefined} alt={team.name} size="lg" />
            </div>
            <span className="block mt-2 font-bold text-sm">{translateName(team.name)}</span>
          </Link>
        ))}
      </div>
      {(!teams || teams.length === 0) && (
        <div className="text-center py-20 text-[var(--color-text-secondary)]">
          لا توجد فرق مسجلة حالياً
        </div>
      )}
    </div>
  );
}
