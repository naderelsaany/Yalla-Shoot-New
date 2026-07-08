'use client';

import { useEffect, useState } from 'react';

interface LiveScoreTickerProps {
  news: string[];
}

export default function LiveScoreTicker({ news }: LiveScoreTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // If no news, provide a fallback
  const displayNews = news && news.length > 0 ? news : ["جاري تحميل أحدث الأخبار..."];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayNews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [displayNews.length]);

  return (
    <div className="w-full bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)] overflow-hidden">
      <div className="container mx-auto px-4 h-10 flex items-center gap-4">
        
        {/* Badge */}
        <div className="flex-shrink-0 flex items-center gap-2 bg-[var(--color-live)]/10 px-3 py-1 rounded-full border border-[var(--color-live)]/20">
          <span className="w-2 h-2 rounded-full bg-[var(--color-live)] animate-pulse"></span>
          <span className="text-xs font-bold text-[var(--color-live)]">عاجل</span>
        </div>

        {/* Ticker Content */}
        <div className="flex-1 relative h-full flex items-center overflow-hidden">
          {displayNews.map((msg, idx) => (
            <div
              key={msg + idx}
              className={`absolute w-full transition-all duration-500 ease-in-out text-sm text-[var(--color-text-primary)] font-tajawal font-medium ${
                idx === currentIndex
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-full opacity-0'
              }`}
            >
              {msg}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
