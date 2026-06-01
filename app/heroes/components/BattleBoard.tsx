"use client";

import { useEffect, useRef, useState } from "react";
import type { BattleState, Unit } from "../lib/types";
import { BOARD_H, BOARD_W } from "../lib/types";
import { unitTemplate } from "../lib/units";
import type { FloatText } from "../lib/engine";
import { isRangedPenalized } from "../lib/engine";

interface Props {
  state: BattleState;
  // 高亮可点击单位（攻击目标 / 法术目标 / 布阵阶段我方单位）
  targetableUnitIds: Set<string>;
  // 可放置 / 可移动到的格子 "x,y"
  placeableCells?: Set<string>;
  // 当前选中的单位 id
  selectedUnitId?: string | null;
  onUnitClick?: (unit: Unit) => void;
  onUnitLongPress?: (unit: Unit) => void;
  onCellClick?: (x: number, y: number) => void;
  floats: FloatText[];
}

interface ActiveFloat extends FloatText {
  key: number;
  unit: Unit;
}

export function BattleBoard({
  state,
  targetableUnitIds,
  placeableCells,
  selectedUnitId,
  onUnitClick,
  onUnitLongPress,
  onCellClick,
  floats,
}: Props) {
  const [activeFloats, setActiveFloats] = useState<ActiveFloat[]>([]);
  const seqRef = useRef(0);

  useEffect(() => {
    if (floats.length === 0) return;
    const news: ActiveFloat[] = [];
    for (const f of floats) {
      const u = state.units.find(x => x.id === f.unitId);
      if (!u) continue;
      news.push({ ...f, key: ++seqRef.current, unit: u });
    }
    setActiveFloats(prev => [...prev, ...news]);
    const t = setTimeout(() => {
      setActiveFloats(prev => prev.slice(news.length));
    }, 1000);
    return () => clearTimeout(t);
  }, [floats]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeId = state.turnOrder[state.nextActor];

  return (
    <div className="hr-board-wrap">
      <div className="hr-board">
        <div className="hr-board-grid">
          {Array.from({ length: BOARD_W * BOARD_H }).map((_, idx) => {
            const x = idx % BOARD_W;
            const y = Math.floor(idx / BOARD_W);
            const u = state.units.find(uu => !uu.dead && uu.x === x && uu.y === y);
            const isPlaceable = placeableCells?.has(`${x},${y}`) ?? false;
            const isSetupZone = state.phase === "setup" && y >= 6 && !u;
            const cellCls = [
              "hr-cell",
              isPlaceable ? "hr-cell-placeable" : "",
              isSetupZone && !isPlaceable ? "hr-cell-setup-zone" : "",
            ].join(" ");
            return (
              <div
                key={idx}
                className={cellCls}
                style={{
                  gridColumnStart: x + 1,
                  gridRowStart: y + 1,
                  cursor: isPlaceable ? "pointer" : undefined,
                }}
                onClick={isPlaceable ? () => onCellClick?.(x, y) : undefined}
              />
            );
          })}
        </div>

        <div className="hr-unit-layer">
          {state.units.map(u => {
            const t = unitTemplate(u.kind);
            const isPenalized =
              !u.dead &&
              t.attackRange >= 2 &&
              state.phase === "playing" &&
              isRangedPenalized(state, u);
            return (
              <UnitDot
                key={u.id}
                unit={u}
                isActive={u.id === activeId && !u.dead && state.phase === "playing"}
                isTargetable={targetableUnitIds.has(u.id)}
                isSelected={u.id === selectedUnitId}
                isPenalized={isPenalized}
                onClick={() => onUnitClick?.(u)}
                onLongPress={() => onUnitLongPress?.(u)}
              />
            );
          })}
          {activeFloats.map(f => (
            <div
              key={f.key}
              className={`hr-float hr-float-${f.kind}`}
              style={{
                left: `${((f.unit.x + 0.5) / BOARD_W) * 100}%`,
                top: `${(f.unit.y / BOARD_H) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              {f.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UnitDot({
  unit,
  isActive,
  isTargetable,
  isSelected,
  isPenalized,
  onClick,
  onLongPress,
}: {
  unit: Unit;
  isActive: boolean;
  isTargetable: boolean;
  isSelected: boolean;
  isPenalized: boolean;
  onClick: () => void;
  onLongPress: () => void;
}) {
  const t = unitTemplate(unit.kind);
  const hpPct = (unit.hp / unit.hpMax) * 100;
  const cellW = 100 / BOARD_W;
  const cellH = 100 / BOARD_H;

  // 长按检测：600ms 触发；触发后吃掉随后的 click
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressFiredRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    longPressFiredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      onLongPress();
    }, 600);
  };
  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };
  const handleClick = (e: React.MouseEvent) => {
    if (longPressFiredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (isTargetable) onClick();
  };

  return (
    <div
      className={[
        "hr-unit",
        unit.side === "ally" ? "hr-unit-ally" : "hr-unit-enemy",
        isActive ? "hr-unit-active" : "",
        unit.dead ? "hr-unit-dead" : "",
        isTargetable ? "hr-unit-targetable" : "",
        isSelected ? "hr-unit-selected" : "",
      ].join(" ")}
      style={{
        left: `${unit.x * cellW}%`,
        top: `${unit.y * cellH}%`,
        width: `${cellW}%`,
        height: `${cellH}%`,
        // 长按需要 pointer 事件，所以 dead 之外都可点
        pointerEvents: unit.dead ? "none" : "auto",
      }}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onContextMenu={e => e.preventDefault()}
    >
      {!unit.dead && (
        <>
          <div className="hr-unit-aura" />
          <div className="hr-hp-bar">
            <div
              className={`hr-hp-fill ${hpPct < 35 ? "low" : ""}`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <div className="hr-unit-emoji">
            {t.emoji}
          </div>
          {isPenalized && (
            <div className="hr-penalty-badge" title="远程伤害减半">⚠</div>
          )}
        </>
      )}
    </div>
  );
}
