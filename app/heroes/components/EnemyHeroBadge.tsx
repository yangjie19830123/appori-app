"use client";

import type { BattleState } from "../lib/types";

interface Props {
  state: BattleState;
}

export function EnemyHeroBadge({ state }: Props) {
  if (!state.enemyHero || !state.enemyHeroState) return null;
  if (state.phase !== "playing") return null;

  const eh = state.enemyHero;
  const turnsLeft = Math.max(0, state.enemyHeroState.nextTriggerRound - state.round);
  const ready = turnsLeft === 0;

  return (
    <div
      className={`hr-panel-soft px-2 py-1 flex items-center gap-2 text-[10px] ${
        ready ? "border-red-500" : ""
      }`}
      style={{
        background: ready
          ? "linear-gradient(135deg, rgba(200,50,50,0.4), rgba(200,50,50,0.15))"
          : undefined,
      }}
    >
      <span className="text-xl leading-none">{eh.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="hr-display font-bold leading-tight" style={{ color: "#ff9090" }}>
          {eh.name}
        </div>
        <div className="opacity-80 leading-tight">
          {ready ? (
            <span style={{ color: "#ffcc66" }}>本回合释放：{eh.ability.name}</span>
          ) : (
            <span>
              <span className="hr-text-gold">{turnsLeft}</span> 回合后：{eh.ability.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
