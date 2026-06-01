"use client";

import type { PublicGameState, PublicPlayer } from "../lib/types";
import clsx from "./clsx";

interface Props {
  state: PublicGameState;
  onCatchUno: (id: string) => void;
}

export function PlayersBar({ state, onCatchUno }: Props) {
  const me = state.players.find(p => p.id === state.yourId);
  const others = state.players.filter(p => p.id !== state.yourId);

  return (
    <div className="w-full overflow-x-auto no-scrollbar px-3 pt-3">
      <div className="flex items-stretch gap-2 min-w-max">
        {others.map((p) => {
          const idx = state.players.findIndex(x => x.id === p.id);
          const isTurn = idx === state.turnIndex;
          const canCatch = p.handCount === 1 && !p.saidUno;
          return (
            <div
              key={p.id}
              className={clsx(
                "relative rounded-2xl px-3 py-2 min-w-[112px]",
                "bg-white/5 border border-white/10 backdrop-blur-sm",
                isTurn && "activeGlow uno-border-yellow",
                !p.connected && "opacity-50",
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    "w-7 h-7 rounded-full grid place-items-center font-bold text-sm",
                    "uno-bg-cream uno-text-ink",
                  )}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-sm font-bold truncate max-w-[80px]">
                  {p.name}
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs uno-text-cream/80">
                <span>🃏 {p.handCount}</span>
                {p.saidUno && (
                  <span className="uno-font-display italic uno-text-yellow">
                    UNO!
                  </span>
                )}
                {!p.connected && <span>📵</span>}
              </div>
              {canCatch && (
                <button
                  type="button"
                  onClick={() => onCatchUno(p.id)}
                  className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uno-bg-red text-white shadow-md uno-anim-pulse-ring"
                >
                  抓他
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 自己的徽标位 */}
      <div className="mt-2 flex items-center justify-center gap-2 text-xs uno-text-cream/70">
        <span>方向</span>
        <span className="uno-font-display uno-text-yellow text-base">
          {state.direction === 1 ? "↻" : "↺"}
        </span>
        {me && state.players[state.turnIndex]?.id === me.id && (
          <span className="ml-2 px-2 py-0.5 rounded-full uno-bg-yellow uno-text-ink font-bold">
            你的回合
          </span>
        )}
      </div>
    </div>
  );
}
