'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin');
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] px-4">
      <div className="w-full max-w-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-3xl p-8 shadow-[var(--shadow-elevated)] text-center">
        <div className="flex justify-center mb-6">
          <Image src="/icon-192.png" alt="يلا شوت نيو" width={60} height={60} className="w-16 h-16 object-contain" />
        </div>
        <h1 className="text-2xl font-bold font-arabic mb-2 text-[var(--color-text-primary)]">لوحة تحكم يلا شوت</h1>
        <p className="text-[var(--color-text-secondary)] mb-8 font-tajawal">يرجى إدخال كلمة المرور للمتابعة</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input 
            type="password" 
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] text-center outline-none focus:border-[var(--color-accent)] transition-colors"
            dir="ltr"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[var(--color-accent)] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
