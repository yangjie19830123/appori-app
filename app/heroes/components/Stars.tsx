"use client";

interface Props {
  filled: number; // 0-3
  total?: number;
  size?: "sm" | "md" | "lg";
}

export function Stars({ filled, total = 3, size = "md" }: Props) {
  const sizeClass = size === "sm" ? "text-xs" : size === "lg" ? "text-2xl" : "";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`hr-star ${i < filled ? "on" : ""} ${sizeClass}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
