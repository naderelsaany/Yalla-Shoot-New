import Image from "next/image";

interface TeamLogoProps {
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  priority?: boolean;
}

export default function TeamLogo({ src, alt, size = "md", priority = false }: TeamLogoProps) {
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

  return (
    <div
      className={`${sizeClasses[size]} shrink-0 bg-white/5 rounded-full flex items-center justify-center border border-white/10 overflow-hidden shadow-sm relative`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={pixelSizes[size]}
          height={pixelSizes[size]}
          className="w-[85%] h-[85%] object-contain"
          priority={priority}
        />
      ) : (
        <span className="text-[var(--color-text-muted)] text-[0.6rem] font-tajawal">شعار</span>
      )}
    </div>
  );
}
