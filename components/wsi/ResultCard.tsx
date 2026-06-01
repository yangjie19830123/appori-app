"use client";

import { forwardRef } from "react";
import type { WSIResult, CountryConfig } from "@/lib/wsi/types";
import { GRADE_META } from "@/lib/wsi/calc";
import { formatWage, formatBigAmount } from "@/lib/wsi/countries";
import { localToCny, formatCny, type FXRates } from "@/lib/wsi/rates";

type Props = {
  result: WSIResult;
  country: CountryConfig;
  hourlyWage: number;
  weeklyHours: number;
  rates: FXRates;
};

const ResultCard = forwardRef<HTMLDivElement, Props>(function ResultCard(
  { result, country, hourlyWage, weeklyHours, rates },
  ref,
) {
  const meta = GRADE_META[result.grade];
  const monthlyCny = localToCny(result.monthlyIncome, country.code, rates);

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-3xl border-[3px] border-ink shadow-stamp-xl animate-pop-in"
      style={{
        aspectRatio: "9 / 14",
        background: country.bgColor,
      }}
    >
      <div className="absolute inset-0 bg-dots-light" />
      <div className="absolute inset-0 bg-grain opacity-60" />

      {/* 装饰：右上角彩色泡泡 */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full border-[3px] border-ink"
        style={{ background: country.accentColor }}
      />
      <div className="absolute top-6 right-8 w-3 h-3 rounded-full bg-ink" />
      <div className="absolute top-14 right-4 w-2 h-2 rounded-full bg-ink" />

      <div className="relative h-full flex flex-col p-5">
        {/* 顶部 brand bar */}
        <div className="flex items-center justify-between text-[10px] font-bold tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-ink text-cream-100 font-display flex items-center justify-center text-[10px]">A</div>
            <span>APPORI · WSI</span>
          </div>
          <span className="text-ink-mute">打工生存指数</span>
        </div>

        {/* 国家大标题 */}
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-5xl leading-none">{country.emoji}</span>
          <div>
            <div className="font-display text-3xl leading-none">{country.name}</div>
            <div className="text-xs font-bold text-ink-mute">{country.nickname}</div>
          </div>
        </div>

        {/* WSI 巨型分数 */}
        <div className="mt-5 relative">
          <div className="text-[11px] uppercase tracking-[0.3em] font-bold text-ink-mute mb-1">YOUR WSI</div>
          <div className="flex items-end gap-2">
            <span className="font-display text-[120px] leading-[0.85] tracking-tight text-ink">
              {result.score}
            </span>
            <span className="font-display text-3xl text-ink-mute mb-3">/100</span>
          </div>
        </div>

        {/* 等级 sticker */}
        <div className="-mt-1 flex items-center gap-3">
          <div
            className="px-4 py-2 rounded-2xl border-[3px] border-ink shadow-stamp-sm font-display flex items-center gap-1.5 -rotate-2"
            style={{ background: meta.bg }}
          >
            <span className="text-2xl leading-none">{meta.label}</span>
            <span className="text-sm">{meta.tagline}</span>
          </div>
          <div className="font-bold text-xs text-ink-mute leading-tight">
            击败<br />
            <span className="font-display text-2xl text-ink">{result.beatPercent}%</span>
            <br />打工人
          </div>
        </div>

        {/* 数据贴纸 */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="时薪" value={formatWage(hourlyWage, country)} bg="#fff" tilt={-1.5} />
          <Stat label="周工时" value={`${weeklyHours}h`} bg="#fff" tilt={1} />
          <Stat
            label="月收入"
            value={formatBigAmount(result.monthlyIncome, country)}
            sub={`≈ ${formatCny(monthlyCny, { compact: true })}`}
            bg="#fff"
            tilt={-0.5}
          />
        </div>

        {/* 风险 / 建议 */}
        <div className="mt-4 space-y-2 flex-1 overflow-hidden">
          {result.risks.length > 0 ? (
            result.risks.slice(0, 2).map((r, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-xl bg-pop-coral border-[2px] border-ink shadow-stamp-sm px-3 py-2"
              >
                <span className="text-base leading-none mt-0.5">⚠️</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold leading-tight">{r.title}</div>
                  <div className="text-[11px] leading-snug mt-0.5">{r.desc}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-start gap-2 rounded-xl bg-pop-mint border-[2px] border-ink shadow-stamp-sm px-3 py-2">
              <span className="text-base leading-none mt-0.5">✅</span>
              <div className="flex-1">
                <div className="text-sm font-bold">合规无风险</div>
                <div className="text-[11px] leading-snug mt-0.5">工时 / 收入均在安全范围。</div>
              </div>
            </div>
          )}

          {result.suggestions[0] && (
            <div className="flex items-start gap-2 rounded-xl bg-pop-yellow border-[2px] border-ink shadow-stamp-sm px-3 py-2">
              <span className="text-base leading-none mt-0.5">💡</span>
              <div className="text-[12px] leading-snug font-medium flex-1">{result.suggestions[0]}</div>
            </div>
          )}
        </div>

        {/* 底部 stamp */}
        <div className="mt-3 pt-3 border-t-2 border-dashed border-ink/30 flex items-center justify-between text-[10px] font-bold">
          <span>appori.app/wsi</span>
          <span className="bg-ink text-cream-100 px-2 py-0.5 rounded-full">测你的 →</span>
        </div>
      </div>
    </div>
  );
});

function Stat({ label, value, sub, bg, tilt }: { label: string; value: string; sub?: string; bg: string; tilt: number }) {
  return (
    <div
      className="rounded-xl border-[2px] border-ink shadow-stamp-sm px-2 py-2 text-center min-w-0"
      style={{ background: bg, transform: `rotate(${tilt}deg)` }}
    >
      <div className="text-[9px] font-bold tracking-wider text-ink-mute mb-0.5">{label}</div>
      <div className="font-display text-sm leading-none truncate">{value}</div>
      {sub && <div className="text-[9px] text-ink-mute mt-0.5 leading-none">{sub}</div>}
    </div>
  );
}

export default ResultCard;
