"use client";

import { forwardRef } from "react";
import type { PKResult } from "@/lib/wsi/pk";

type Props = {
  pk: PKResult;
};

const BattleCard = forwardRef<HTMLDivElement, Props>(function BattleCard({ pk }, ref) {
  const { left, right, stats, winner, verdict } = pk;
  const leftWon = winner === "left";
  const rightWon = winner === "right";
  const draw = winner === "draw";

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-3xl border-[3px] border-ink shadow-stamp-xl bg-cream-100 animate-pop-in"
      style={{ aspectRatio: "9 / 14" }}
    >
      {/* 半分背景：左右两色 */}
      <div className="absolute inset-0 flex">
        <div className="flex-1" style={{ background: left.country.bgColor }} />
        <div className="flex-1" style={{ background: right.country.bgColor }} />
      </div>
      <div className="absolute inset-0 bg-dots-light" />
      <div className="absolute inset-0 bg-grain opacity-50" />

      {/* 中线 */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-ink" />

      <div className="relative h-full flex flex-col p-5">
        {/* 顶部 brand */}
        <div className="flex items-center justify-between text-[10px] font-bold tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-ink text-cream-100 font-display flex items-center justify-center text-[10px]">A</div>
            <span>APPORI · WSI</span>
          </div>
          <span className="text-ink-mute">国家 PK 战</span>
        </div>

        {/* 双国旗 + VS */}
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <CountryHero country={left.country} score={left.profile.score} won={leftWon} side="left" />
          <div className="relative px-1">
            <div className="font-display text-3xl text-ink bg-pop-yellow px-3 py-2 rounded-xl border-[3px] border-ink shadow-stamp-sm rotate-3">
              VS
            </div>
            <div className="absolute -top-2 -right-2 text-xl animate-wiggle">⚡</div>
          </div>
          <CountryHero country={right.country} score={right.profile.score} won={rightWon} side="right" />
        </div>

        {/* 6 项对比 */}
        <div className="mt-4 flex-1 space-y-1.5 overflow-hidden">
          {stats.map((s) => {
            const leftBetter = s.higherIsBetter ? s.leftValue > s.rightValue : s.leftValue < s.rightValue;
            const rightBetter = s.higherIsBetter ? s.rightValue > s.leftValue : s.rightValue < s.leftValue;
            const tie = Math.abs(s.leftValue - s.rightValue) < 0.01;
            return (
              <div key={s.key} className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 bg-white/80 backdrop-blur-sm border-[2px] border-ink rounded-xl px-2 py-1.5">
                <div className={`text-right font-display text-sm leading-tight ${leftBetter ? "text-ink" : "text-ink-mute"}`}>
                  {s.leftDisplay}
                  {leftBetter && !tie && <span className="ml-1">👑</span>}
                </div>
                <div className="text-center px-1">
                  <div className="text-base leading-none">{s.emoji}</div>
                  <div className="text-[9px] font-bold mt-0.5 leading-none">{s.label}</div>
                </div>
                <div className={`text-left font-display text-sm leading-tight ${rightBetter ? "text-ink" : "text-ink-mute"}`}>
                  {rightBetter && !tie && <span className="mr-1">👑</span>}
                  {s.rightDisplay}
                </div>
              </div>
            );
          })}
        </div>

        {/* 胜负判定 */}
        <div className="mt-3">
          <div
            className="px-3 py-2.5 rounded-xl border-[3px] border-ink shadow-stamp-sm -rotate-1"
            style={{
              background: draw ? "#FFE66D" : winner === "left" ? left.country.accentColor : right.country.accentColor,
            }}
          >
            <div className="text-[10px] font-bold tracking-widest mb-0.5">
              {draw ? "🤝 平 局" : "🏆 综 合 判 定"}
            </div>
            <div className="text-sm font-bold leading-snug">{verdict}</div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t-2 border-dashed border-ink/30 flex items-center justify-between text-[10px] font-bold">
          <span>appori.app/wsi/pk</span>
          <span className="bg-ink text-cream-100 px-2 py-0.5 rounded-full">来 PK 你的 →</span>
        </div>
      </div>
    </div>
  );
});

function CountryHero({
  country,
  score,
  won,
  side,
}: {
  country: any;
  score: number;
  won: boolean;
  side: "left" | "right";
}) {
  const align = side === "left" ? "items-start text-left" : "items-end text-right";
  return (
    <div className={`flex flex-col ${align}`}>
      {won && (
        <div className="text-2xl mb-0.5 animate-bounce-soft">🏆</div>
      )}
      <div className="text-5xl leading-none">{country.emoji}</div>
      <div className="font-display text-xl mt-1 leading-none">{country.name}</div>
      <div className="text-[10px] font-bold text-ink-mute mt-0.5 leading-tight">{country.nickname}</div>
      <div className="mt-2 px-2 py-1 rounded-lg border-[2px] border-ink bg-white shadow-stamp-sm">
        <div className="text-[9px] font-bold leading-none">WSI</div>
        <div className="font-display text-xl leading-none">{score}</div>
      </div>
    </div>
  );
}

export default BattleCard;
