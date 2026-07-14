'use client';

import { useState } from 'react';

export default function TeamImage({ src, name }: { src: string | null; name: string }) {
  const [erred, setErred] = useState(false);

  return (
    <div className="w-12 h-12 mx-auto mb-2 relative">
      {src && !erred ? (
        <img
          src={src}
          alt={name}
          className="w-12 h-12 object-contain mx-auto"
          onError={() => setErred(true)}
        />
      ) : (
        <div className="w-12 h-12 bg-[var(--color-bg-elevated)] rounded-full flex items-center justify-center text-lg font-bold text-[var(--color-text-muted)]">
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}
