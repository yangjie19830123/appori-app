"use client";

import type { PublicGameState, Color } from "../lib/types";
import { UnoCard } from "./UnoCard";
import clsx from "./clsx";

const colorClass: Record<Color, string> = {
  red: "uno-bg-red",
  yellow: "uno-bg-yellow",
  green: "uno-bg-green",
  blue: "uno-bg-blue",
  wild: "uno-bg-wild-gradient",
};

const colorLabel: Record<Color, string> = {
  red: "红",
  yellow: "黄",
  green: "绿",
  blue: "蓝",
  wild: "—",
};

interface Props {
  state: PublicGameState;
  onDraw: () => void;
  canDraw: boolean;
}

export function Table({ state, onDraw, canDraw }: Props) {
  const top = state.discardPile[state.discardPile.length - 1];

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-4 relative">
      {/* 当前颜色指示 */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-xs font-bold">
        <span className="uno-text-cream/60">当前色</span>
        <span
          className={clsx(
            "w-4 h-4 rounded-full ring-2 ring-white/40",
            colorClass[state.currentColor],
          )}
        />
        <span>{colorLabel[state.currentColor]}</span>
      </div>

      <div className="flex items-center gap-6">
        {/* 抽牌堆 */}
        <button
          type="button"
          onClick={onDraw}
          disabled={!canDraw}
          className={clsx(
            "relative",
            canDraw && "active:scale-95 transition-transform",
            !canDraw && "opacity-60",
          )}
        >
          {/* 三层叠牌制造厚度 */}
          <div className="absolute -top-1 -left-1 w-20 h-[120px] rounded-[14px] uno-bg-ink/70 border border-white/10" />
          <div className="absolute -top-0.5 -left-0.5 w-20 h-[120px] rounded-[14px] uno-bg-ink/85 border border-white/10" />
          <UnoCard
            card={{ id: "back", color: "wild", value: "wild" }}
            faceDown
            size="md"
          />
          <div className="mt-1 text-center text-xs uno-text-cream/70 font-bold">
            {state.drawPileCount} 张
          </div>
          {canDraw && (
            <div className="absolute inset-0 -m-1 rounded-2xl ring-2 uno-ring-yellow/60 uno-anim-pulse-ring" />
          )}
        </button>

        {/* 弃牌堆 */}
        <div className="relative">
          {/* 底层透露之前的牌 */}
          {state.discardPile.length > 1 && (
            <div className="absolute -top-1 -left-2 rotate-[-8deg]">
              <UnoCard
                card={state.discardPile[state.discardPile.length - 2]}
                size="md"
                playable={false}
              />
            </div>
          )}
          <div className="relative uno-anim-flip-in" key={top?.id}>
            {top && <UnoCard card={top} size="md" playable={false} />}
          </div>
        </div>
      </div>
    </div>
  );
}
