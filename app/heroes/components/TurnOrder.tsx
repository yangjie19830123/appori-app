"use client";

import type { BattleState } from "../lib/types";
import { unitTemplate } from "../lib/units";

interface Props {
  state: BattleState;
  count?: number;
}

export function TurnOrder({ state, count = 6 }: Props) {
  if (state.phase !== "playing") return null;

  // 从 nextActor 开始，跳过死亡单位，取 count 个
  const items: { unitId: string; isCurrent: boolean }[] = [];
  let i = state.nextActor;
  let safety = 0;
  while (items.length < count && safety++ < state.turnOrder.length * 2) {
    if (i >= state.turnOrder.length) {
      // 下一轮重新排序，但这里简化用当前 turnOrder 循环展示
      i = 0;
    }
    const id = state.turnOrder[i];
    const u = state.units.find(x => x.id === id);
    if (u && !u.dead) {
      items.push({ unitId: id, isCurrent: items.length === 0 });
    }
    i++;
  }

  return (
    <div className="flex items-center justify-center gap-1 py-1 px-2 hr-panel-soft text-[10px]">
      <span className="opacity-60 mr-1">行动:</span>
      {items.map((it, idx) => {
        const u = state.units.find(x => x.id === it.unitId);
        if (!u) return null;
        const t = unitTemplate(u.kind);
        return (
          <div
            key={`${it.unitId}-${idx}`}
            className={`relative flex flex-col items-center justify-center w-7 h-7 rounded-md text-base ${
              it.isCurrent ? "ring-2 ring-yellow-400" : ""
            }`}
            style={{
              background:
                u.side === "ally" ? "rgba(74, 127, 200, 0.3)" : "rgba(200, 50, 50, 0.3)",
            }}
            title={t.name}
          >
            <span>
              {t.emoji}
            </span>
          </div>
        );
      })}
    </div>
  );
}
