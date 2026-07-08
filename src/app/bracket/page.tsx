import { Metadata } from 'next';
import { TournamentBracket } from '@/components/TournamentBracket/TournamentBracket';
import { generateMockMatches } from '@/components/TournamentBracket/utils/mockData';

export const metadata: Metadata = {
  title: 'شجرة خروج المغلوب | يلا شوت نيو',
  description: 'تابع مسار مباريات خروج المغلوب للبطولات الكبرى.',
};

export default function BracketDemoPage() {
  const matches = generateMockMatches();

  return (
    <div className="container mx-auto px-4 py-12 flex-1">
      <TournamentBracket matches={matches} tournamentName="كأس العالم 2022" />
    </div>
  );
}
