"use client";

import { formatYen } from "@/lib/kakeibo/constants";
import { CatTotal } from "@/lib/kakeibo/types";

interface RingChartProps {
  segments: CatTotal[];
  total: number;
  size?: number;
  label?: string;
}

export default function RingChart({ segments, total, size = 140, label = "支出合計" }: RingChartProps) {
  const r = 50;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#E2E8F0" strokeWidth="13" />
      {segments.map((s, i) => {
        const dash = total ? (s.amount / total) * circ : 0;
        const o = offset;
        offset += dash;
        return (
          <circle
            key={i}
            cx="60" cy="60" r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="13"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-o}
            transform="rotate(-90 60 60)"
            className="transition-all duration-500"
          />
        );
      })}
      <text x="60" y="54" textAnchor="middle" className="fill-slate-400 text-[9px]">
        {label}
      </text>
      <text x="60" y="70" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
        {formatYen(total)}
      </text>
    </svg>
  );
}
