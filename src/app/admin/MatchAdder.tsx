'use client';

import { useState } from 'react';

interface MatchAdderProps {
  leagues: { id: string; name: string }[];
  teams: { id: string; name: string }[];
}

export default function MatchAdder({ leagues, teams }: MatchAdderProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    league_id: '',
    home_team_id: '',
    away_team_id: '',
    match_date: '',
    match_time: '',
    status: 'SCHEDULED',
    home_score: '',
    away_score: '',
    video_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.league_id || !formData.home_team_id || !formData.away_team_id || !formData.match_date || !formData.match_time) {
      alert('يرجى تعبئة جميع الحقول الأساسية (البطولة، الفرق، التاريخ، والوقت)');
      return;
    }
    if (formData.home_team_id === formData.away_team_id) {
      alert('لا يمكن اختيار نفس الفريق كخصم لنفسه!');
      return;
    }
    if (formData.video_url && !formData.video_url.startsWith('http')) {
      alert('يجب أن يبدأ رابط البث بـ http أو https');
      return;
    }

    setLoading(true);
    
    // Combine date and time to ISO
    const dateTimeString = `${formData.match_date}T${formData.match_time}:00`;

    try {
      const res = await fetch('/api/admin/add-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          match_date: dateTimeString
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'فشل الحفظ');
      
      alert('تم إضافة/تحديث المباراة بنجاح!');
      // Reset optional fields
      setFormData(prev => ({
        ...prev,
        status: 'SCHEDULED',
        home_score: '',
        away_score: '',
        video_url: ''
      }));
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] p-6 md:p-8 rounded-3xl shadow-[var(--shadow-elevated)] flex flex-col gap-6">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* League */}
        <div>
          <label className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">البطولة *</label>
          <select 
            value={formData.league_id} 
            onChange={(e) => setFormData({...formData, league_id: e.target.value})}
            className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--color-accent)]"
          >
            <option value="">-- اختر البطولة --</option>
            {leagues.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Home Team */}
        <div>
          <label className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">الفريق المضيف *</label>
          <select 
            value={formData.home_team_id} 
            onChange={(e) => setFormData({...formData, home_team_id: e.target.value})}
            className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--color-accent)]"
          >
            <option value="">-- اختر الفريق المضيف --</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Away Team */}
        <div>
          <label className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">الفريق الضيف *</label>
          <select 
            value={formData.away_team_id} 
            onChange={(e) => setFormData({...formData, away_team_id: e.target.value})}
            className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--color-accent)]"
          >
            <option value="">-- اختر الفريق الضيف --</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Date */}
        <div>
          <label className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">التاريخ *</label>
          <input 
            type="date" 
            value={formData.match_date}
            onChange={(e) => setFormData({...formData, match_date: e.target.value})}
            className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--color-accent)] text-left"
            dir="ltr"
          />
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">الوقت (بتوقيت المحلي) *</label>
          <input 
            type="time" 
            value={formData.match_time}
            onChange={(e) => setFormData({...formData, match_time: e.target.value})}
            className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--color-accent)] text-left"
            dir="ltr"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">حالة المباراة</label>
          <select 
            value={formData.status} 
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--color-accent)]"
          >
            <option value="SCHEDULED">لم تبدأ (SCHEDULED)</option>
            <option value="IN_PLAY">جارية الآن (IN_PLAY)</option>
            <option value="PAUSED">استراحة (PAUSED)</option>
            <option value="FINISHED">انتهت (FINISHED)</option>
            <option value="POSTPONED">مؤجلة (POSTPONED)</option>
            <option value="CANCELLED">ملغاة (CANCELLED)</option>
          </select>
        </div>

        {/* Video URL */}
        <div>
          <label className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">رابط البث (اختياري)</label>
          <input 
            type="url" 
            placeholder="https://youtube.com/..."
            value={formData.video_url}
            onChange={(e) => setFormData({...formData, video_url: e.target.value})}
            className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--color-accent)] text-left"
            dir="ltr"
          />
        </div>
      </div>

      {/* Scores (Only if not scheduled) */}
      {formData.status !== 'SCHEDULED' && formData.status !== 'POSTPONED' && formData.status !== 'CANCELLED' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div>
            <label className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">أهداف الفريق المضيف</label>
            <input 
              type="number" 
              min="0"
              value={formData.home_score}
              onChange={(e) => setFormData({...formData, home_score: e.target.value})}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--color-accent)] text-center"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">أهداف الفريق الضيف</label>
            <input 
              type="number" 
              min="0"
              value={formData.away_score}
              onChange={(e) => setFormData({...formData, away_score: e.target.value})}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--color-accent)] text-center"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
        >
          {loading ? 'جاري الحفظ...' : 'إضافة / حفظ المباراة'}
        </button>
      </div>

    </form>
  );
}
