'use client';

import Image from "next/image";
import { useState } from "react";

interface TeamLogoProps {
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  priority?: boolean;
}

export default function TeamLogo({ src, alt, size = "md", priority = false }: TeamLogoProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const pixelSizes = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  const isPlaceholder = !src || imgError;

  return (
    <div
      className={`${sizeClasses[size]} shrink-0 bg-white/5 rounded-full flex items-center justify-center border border-white/10 overflow-hidden shadow-sm relative`}
    >
      {isPlaceholder ? (
        <svg
          className="w-[60%] h-[60%] text-[var(--color-text-muted)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12" />
          <path d="M6 12h12" />
        </svg>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={pixelSizes[size]}
          height={pixelSizes[size]}
          className="w-[85%] h-[85%] object-contain"
          priority={priority}
          onError={() => setImgError(true)}
          unoptimized
        />
      )}
    </div>
  );
}
