import { supabase } from '@/lib/supabase';
import { translateName } from '@/lib/translations';
import TeamLogo from '@/components/TeamLogo';
import { Metadata } from 'next';
import Link from 'next/link';

import { League } from '@/types/database';

export const metadata: Metadata = {
  title: 'البطولات والدوريات | يلا شوت نيو',
  description: 'تعرف على كافة البطولات الرياضية المتاحة وتفاصيلها.',
};

export const revalidate = 86400; // ISR once a day

export default async function LeaguesPage() {
  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .order('name', { ascending: true });

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-tajawal mb-2 tracking-tight">
          البطولات <span className="text-[var(--color-accent)]">المحلية والعالمية</span>
        </h1>
        <p className="text-[var(--color-text-secondary)]">أهم الدوريات والبطولات التي نقوم بتغطيتها.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {leagues && leagues.length > 0 ? (
          leagues.map((league: League) => (
            <Link href={`/leagues/${league.id}`} key={league.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all hover:-translate-y-1 flex flex-col items-center gap-4 text-center group">
              <div className="group-hover:scale-110 transition-transform duration-300">
                <TeamLogo src={league.logo_url ?? undefined} alt={league.name} size="lg" />
              </div>
              <h3 className="font-bold font-arabic text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                {translateName(league.name)}
              </h3>
              {league.country && (
                <span className="text-xs text-[var(--color-text-muted)]">{translateName(league.country)}</span>
              )}
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)]">
            لا توجد بطولات مسجلة حالياً
          </div>
        )}
      </div>

      <div className="mt-12 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold font-arabic mb-3 text-[var(--color-text-primary)]">جداول الترتيب قريباً!</h3>
        <p className="text-[var(--color-text-secondary)]">نعمل حالياً على تجهيز عرض مفصل لترتيب الأندية في كل بطولة بالنقاط والأهداف.</p>
      </div>
    </div>
  );
}
