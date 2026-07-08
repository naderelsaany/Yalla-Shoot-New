import { Metadata } from 'next';
import { TournamentBracket } from '@/components/TournamentBracket/TournamentBracket';
import { BracketMatch } from '@/components/TournamentBracket/types';

export const metadata: Metadata = {
  title: 'شجرة خروج المغلوب | يلا شوت نيو',
  description: 'تابع مسار مباريات خروج المغلوب للبطولات الكبرى.',
};

// Mock data generator for 4 rounds (Final, Semi, Quarter, R16)
// This perfectly simulates a bracket array passed from a real DB with nextMatchId
function generateMockMatches(): BracketMatch[] {
  const matches: BracketMatch[] = [];
  
  // 1. Final (1 match)
  const finalMatch: BracketMatch = {
    id: 'm-final',
    roundName: 'النهائي',
    homeTeam: { id: 't1', name: 'الأرجنتين', logoUrl: 'https://media.api-sports.io/football/teams/26.png' },
    awayTeam: { id: 't2', name: 'فرنسا', logoUrl: 'https://media.api-sports.io/football/teams/17.png' },
    homeScore: 3,
    awayScore: 3,
    status: 'FINISHED',
    matchDate: new Date('2022-12-18T15:00:00Z').toISOString(),
    nextMatchId: null, // Root
  };
  matches.push(finalMatch);

  // 2. Semi Finals (2 matches)
  const semi1: BracketMatch = {
    id: 'm-semi-1',
    roundName: 'نصف النهائي',
    homeTeam: { id: 't1', name: 'الأرجنتين', logoUrl: 'https://media.api-sports.io/football/teams/26.png' },
    awayTeam: { id: 't3', name: 'كرواتيا', logoUrl: 'https://media.api-sports.io/football/teams/9.png' },
    homeScore: 3,
    awayScore: 0,
    status: 'FINISHED',
    matchDate: new Date('2022-12-13T19:00:00Z').toISOString(),
    nextMatchId: 'm-final',
  };
  const semi2: BracketMatch = {
    id: 'm-semi-2',
    roundName: 'نصف النهائي',
    homeTeam: { id: 't2', name: 'فرنسا', logoUrl: 'https://media.api-sports.io/football/teams/17.png' },
    awayTeam: { id: 't4', name: 'المغرب', logoUrl: 'https://media.api-sports.io/football/teams/31.png' },
    homeScore: 2,
    awayScore: 0,
    status: 'FINISHED',
    matchDate: new Date('2022-12-14T19:00:00Z').toISOString(),
    nextMatchId: 'm-final',
  };
  matches.push(semi1, semi2);

  // 3. Quarter Finals (4 matches)
  const qf1: BracketMatch = {
    id: 'm-qf-1', roundName: 'ربع النهائي',
    homeTeam: { id: 't3', name: 'كرواتيا', logoUrl: 'https://media.api-sports.io/football/teams/9.png' },
    awayTeam: { id: 't5', name: 'البرازيل', logoUrl: 'https://media.api-sports.io/football/teams/6.png' },
    homeScore: 1, awayScore: 1, status: 'FINISHED', matchDate: new Date('2022-12-09T15:00:00Z').toISOString(),
    nextMatchId: 'm-semi-1',
  };
  const qf2: BracketMatch = {
    id: 'm-qf-2', roundName: 'ربع النهائي',
    homeTeam: { id: 't1', name: 'الأرجنتين', logoUrl: 'https://media.api-sports.io/football/teams/26.png' },
    awayTeam: { id: 't6', name: 'هولندا', logoUrl: 'https://media.api-sports.io/football/teams/1118.png' },
    homeScore: 2, awayScore: 2, status: 'FINISHED', matchDate: new Date('2022-12-09T19:00:00Z').toISOString(),
    nextMatchId: 'm-semi-1',
  };
  const qf3: BracketMatch = {
    id: 'm-qf-3', roundName: 'ربع النهائي',
    homeTeam: { id: 't4', name: 'المغرب', logoUrl: 'https://media.api-sports.io/football/teams/31.png' },
    awayTeam: { id: 't7', name: 'البرتغال', logoUrl: 'https://media.api-sports.io/football/teams/27.png' },
    homeScore: 1, awayScore: 0, status: 'FINISHED', matchDate: new Date('2022-12-10T15:00:00Z').toISOString(),
    nextMatchId: 'm-semi-2',
  };
  const qf4: BracketMatch = {
    id: 'm-qf-4', roundName: 'ربع النهائي',
    homeTeam: { id: 't2', name: 'فرنسا', logoUrl: 'https://media.api-sports.io/football/teams/17.png' },
    awayTeam: { id: 't8', name: 'إنجلترا', logoUrl: 'https://media.api-sports.io/football/teams/10.png' },
    homeScore: 2, awayScore: 1, status: 'FINISHED', matchDate: new Date('2022-12-10T19:00:00Z').toISOString(),
    nextMatchId: 'm-semi-2',
  };
  matches.push(qf1, qf2, qf3, qf4);

  // 4. Round of 16 (8 matches) - Some Scheduled/Live to test UI
  const createR16 = (id: string, h: string, a: string, nextId: string, status: any = 'FINISHED'): BracketMatch => ({
    id, roundName: 'دور الـ 16',
    homeTeam: { id: `t_${h}`, name: h, logoUrl: 'https://media.api-sports.io/football/teams/6.png' },
    awayTeam: { id: `t_${a}`, name: a, logoUrl: 'https://media.api-sports.io/football/teams/9.png' },
    homeScore: status === 'FINISHED' ? 2 : 0, awayScore: status === 'FINISHED' ? 1 : 0,
    status, matchDate: new Date('2022-12-05T15:00:00Z').toISOString(),
    nextMatchId: nextId
  });

  matches.push(
    createR16('m-r16-1', 'اليابان', 'كرواتيا', 'm-qf-1'),
    createR16('m-r16-2', 'البرازيل', 'كوريا ج', 'm-qf-1'),
    createR16('m-r16-3', 'الأرجنتين', 'أستراليا', 'm-qf-2'),
    createR16('m-r16-4', 'هولندا', 'أمريكا', 'm-qf-2'),
    createR16('m-r16-5', 'المغرب', 'إسبانيا', 'm-qf-3', 'FINISHED'),
    createR16('m-r16-6', 'البرتغال', 'سويسرا', 'm-qf-3', 'FINISHED'),
    createR16('m-r16-7', 'فرنسا', 'بولندا', 'm-qf-4', 'FINISHED'),
    createR16('m-r16-8', 'إنجلترا', 'السنغال', 'm-qf-4', 'SCHEDULED'), // Test scheduled state
  );

  return matches;
}

export default function BracketDemoPage() {
  const matches = generateMockMatches();

  return (
    <div className="container mx-auto px-4 py-12 flex-1">
      <TournamentBracket matches={matches} tournamentName="كأس العالم 2022" />
    </div>
  );
}
