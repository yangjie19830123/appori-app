"use client";

import Image from "next/image";

interface ApporiLogoProps {
  size?: number;
  showText?: boolean;
}

export default function ApporiLogo({ size = 28, showText = true }: ApporiLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="Appori"
        width={size}
        height={size}
        className="rounded-lg"
        style={{ boxShadow: "0 2px 8px rgba(59,130,246,0.25)" }}
      />
      {showText && (
        <span
          className="font-bold text-slate-900 tracking-tight"
          style={{ fontSize: size * 0.5 }}
        >
          Appori
        </span>
      )}
    </div>
  );
}
