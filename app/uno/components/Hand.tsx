"use client";

import type { Card, PublicGameState } from "../lib/types";
import { UnoCard } from "./UnoCard";
import { canPlay } from "../lib/engine";

interface Props {
  state: PublicGameState;
  onPlay: (card: Card) => void;
  isMyTurn: boolean;
}

export function Hand({ state, onPlay, isMyTurn }: Props) {
  const top = state.discardPile[state.discardPile.length - 1];
  const cards = state.yourHand;

  return (
    <div className="w-full">
      <div className="px-3 pb-1 flex items-baseline justify-between">
        <span className="text-xs uno-text-cream/60">
          手牌 · {cards.length} 张
        </span>
        {cards.length === 1 && (
          <span className="text-xs font-bold uno-text-yellow uno-anim-pulse">
            还剩一张！记得喊 UNO
          </span>
        )}
      </div>
      <div className="overflow-x-auto no-scrollbar px-3 pb-4">
        <div className="flex gap-1.5 min-w-max items-end">
          {cards.length === 0 && (
            <div className="uno-text-cream/50 text-sm py-6">没有手牌</div>
          )}
          {cards.map((c, i) => {
            const playable = isMyTurn && top
              ? canPlay(c, top, state.currentColor)
              : false;
            return (
              <UnoCard
                key={c.id}
                card={c}
                size="hand"
                playable={playable}
                onClick={playable ? () => onPlay(c) : undefined}
                style={{ animationDelay: `${i * 25}ms` }}
                className="uno-anim-deal"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
