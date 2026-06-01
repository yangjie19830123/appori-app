"use client";

import { MonthData } from "@/lib/kakeibo/types";

interface BarChartProps {
  data: MonthData[];
  height?: number;
}

export default function BarChart({ data, height = 140 }: BarChartProps) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const bw = 16;
  const totalWidth = data.length * 50 + 20;

  return (
    <svg width="100%" viewBox={`0 0 ${totalWidth} ${height + 28}`} overflow="visible">
      {data.map((d, i) => {
        const x = 16 + i * 50;
        const ih = (d.income / max) * height;
        const eh = (d.expense / max) * height;
        return (
          <g key={i}>
            <rect
              x={x} y={height - ih} width={bw} height={ih}
              rx={4} fill="#3B82F6" opacity={0.8}
              className="transition-all duration-500"
            />
            <rect
              x={x + bw + 3} y={height - eh} width={bw} height={eh}
              rx={4} fill="#EF4444" opacity={0.55}
              className="transition-all duration-500"
            />
            <text
              x={x + bw + 1} y={height + 16}
              textAnchor="middle"
              className="fill-slate-400 text-[10px]"
            >
              {d.label}
            </text>
          </g>
        );
      })}
      <line x1="10" y1={height} x2={totalWidth - 10} y2={height} stroke="#E2E8F0" strokeWidth={1} />
    </svg>
  );
}
