'use client';

import { useState } from 'react';

export default function NewsManager() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch('/api/admin/add-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, image_url: imageUrl })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add news');
      
      alert('تم إضافة الخبر بنجاح!');
      setTitle('');
      setContent('');
      setImageUrl('');
    } catch (err: any) {
      alert('حدث خطأ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] p-6 rounded-2xl">
      <h3 className="text-xl font-bold font-tajawal mb-4 text-[var(--color-accent)]">إضافة خبر جديد يدوياً</h3>
      <form onSubmit={handleAddNews} className="flex flex-col gap-4">
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-[var(--color-text-secondary)]">عنوان الخبر *</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-xl text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
            required
            placeholder="مثال: ريال مدريد يعلن تعاقده مع مبابي"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-[var(--color-text-secondary)]">رابط صورة الخبر (اختياري)</label>
          <input 
            type="text" 
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-xl text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] text-left"
            dir="ltr"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-[var(--color-text-secondary)]">تفاصيل الخبر *</label>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-4 py-3 rounded-xl text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] min-h-[150px]"
            required
            placeholder="اكتب تفاصيل الخبر هنا..."
          />
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="bg-[var(--color-accent)] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity mt-2 disabled:opacity-50"
        >
          {saving ? 'جاري النشر...' : 'نشر الخبر فوراً'}
        </button>
      </form>
    </div>
  );
}
