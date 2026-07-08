'use client';

import { useState } from 'react';
import { MatchWithTeams } from '@/types/database';

export default function MatchesManager({ initialMatches }: { initialMatches: MatchWithTeams[] }) {
  const [matches, setMatches] = useState(initialMatches);
  const [saving, setSaving] = useState<string | null>(null);

  const handleUpdate = async (id: string) => {
    const match = matches.find(m => m.id === id);
    if (!match) return;
    
    if (match.video_url && !match.video_url.startsWith('http')) {
      alert('يجب أن يبدأ رابط البث بـ http أو https');
      return;
    }

    setSaving(id);
    try {
      const res = await fetch('/api/admin/update-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          video_url: match.video_url,
          status: match.status,
          home_score: match.home_score,
          away_score: match.away_score
        })
      });
      if (!res.ok) throw new Error('Failed to update');
      alert('تم التحديث بنجاح!');
      // If status is FINISHED, we might want to hide it locally, but a page refresh is safer.
      if (match.status === 'FINISHED') {
         setMatches(matches.filter(m => m.id !== id));
      }
    } catch {
      alert('حدث خطأ أثناء التحديث.');
    } finally {
      setSaving(null);
    }
  };

  const updateMatchState = (id: string, field: keyof MatchWithTeams, value: unknown) => {
    const newMatches = [...matches];
    const m = newMatches.find(x => x.id === id);
    if (m) {
      (m as unknown as Record<string, unknown>)[field as string] = value;
    }
    setMatches(newMatches);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {matches.map((match) => (
        <div key={match.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] p-6 rounded-2xl flex flex-col xl:flex-row gap-6 items-center justify-between">
          
          <div className="flex flex-col md:flex-row items-center gap-4 flex-1 text-center md:text-right">
            {/* Home Score */}
            <input 
              type="number" 
              min="0"
              value={match.home_score ?? ''}
              onChange={(e) => updateMatchState(match.id, 'home_score', e.target.value)}
              className="w-16 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-2 py-1 rounded text-center"
            />
            <span className="font-bold text-lg w-24 truncate" title={match.home_team?.name}>{match.home_team?.name}</span>
            
            <span className="text-[var(--color-text-muted)]">ضد</span>
            
            <span className="font-bold text-lg w-24 truncate" title={match.away_team?.name}>{match.away_team?.name}</span>
            {/* Away Score */}
            <input 
              type="number" 
              min="0"
              value={match.away_score ?? ''}
              onChange={(e) => updateMatchState(match.id, 'away_score', e.target.value)}
              className="w-16 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-2 py-1 rounded text-center"
            />
          </div>

          {/* Status */}
          <div className="flex-shrink-0">
             <select 
              value={match.status} 
              onChange={(e) => updateMatchState(match.id, 'status', e.target.value)}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-3 py-2 rounded-lg text-sm"
            >
              <option value="SCHEDULED">لم تبدأ</option>
              <option value="IN_PLAY">جارية</option>
              <option value="PAUSED">استراحة</option>
              <option value="FINISHED">انتهت</option>
              <option value="POSTPONED">مؤجلة</option>
              <option value="CANCELLED">ملغاة</option>
            </select>
          </div>
          
          <div className="flex-1 w-full xl:w-auto flex items-center gap-2">
            <input 
              type="text" 
              placeholder="رابط البث (مثال: يوتيوب)" 
              value={match.video_url || ''}
              onChange={(e) => updateMatchState(match.id, 'video_url', e.target.value)}
              className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-2 rounded-lg text-left"
              dir="ltr"
            />
            <button 
              onClick={() => handleUpdate(match.id)}
              disabled={saving === match.id}
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {saving === match.id ? 'جاري الحفظ...' : 'تحديث'}
            </button>
          </div>
        </div>
      ))}
      {matches.length === 0 && <p className="text-[var(--color-text-secondary)] text-center py-4">لا توجد مباريات جارية أو مجدولة اليوم.</p>}
    </div>
  );
}
