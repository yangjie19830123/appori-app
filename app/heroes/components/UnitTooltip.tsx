"use client";

import type { Unit, BattleState, HeroState } from "../lib/types";
import { unitTemplate } from "../lib/units";
import { computeAttackDamage, isRangedPenalized } from "../lib/engine";

interface UnitTooltipProps {
  unit: Unit;
  state: BattleState;
  hero: HeroState;
  onClose: () => void;
}

export function UnitTooltip({ unit, state, hero, onClose }: UnitTooltipProps) {
  const t = unitTemplate(unit.kind);

  // 实际攻防 = 基础 + 加成
  const heroAtk = unit.side === "ally" ? hero.attack : state.enemyBuff.attack;
  const heroDef = unit.side === "ally" ? hero.defense : state.enemyBuff.defense;
  const totalAtk = t.attack + heroAtk;
  const totalDef = t.defense + heroDef;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`hr-panel p-4 max-w-sm w-full hr-fade-in ${
          unit.side === "ally" ? "border-l-4" : "border-r-4"
        }`}
        onClick={e => e.stopPropagation()}
        style={{
          borderColor: unit.side === "ally" ? "#4a7fc8" : "#c83232",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="text-4xl">{t.emoji}</div>
          <div className="flex-1">
            <div className="hr-display font-bold text-lg">{t.name}</div>
            <div className="text-[10px] opacity-60">
              {unit.side === "ally" ? "我方" : "敌方"} · {t.desc}
            </div>
          </div>
        </div>

        <div className="hr-divider" />

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <Stat label="生命" value={`${unit.hp} / ${unit.hpMax}`} />
          <Stat label="速度" value={t.speed} />
          <Stat
            label="攻击"
            value={
              heroAtk > 0
                ? `${t.attack} + ${heroAtk} = ${totalAtk}`
                : `${t.attack}`
            }
          />
          <Stat
            label="防御"
            value={
              heroDef > 0
                ? `${t.defense} + ${heroDef} = ${totalDef}`
                : `${t.defense}`
            }
          />
          <Stat label="移动" value={`${t.moveRange} 格`} />
          <Stat
            label="射程"
            value={t.attackRange === 1 ? "近战" : `${t.attackRange} 格`}
          />
        </div>

        {/* 兵种相克 */}
        {Object.keys(t.counters).length > 0 && (
          <>
            <div className="hr-divider" />
            <div className="text-[11px]">
              <span className="opacity-60">克制：</span>
              {Object.entries(t.counters).map(([k, mul]) => (
                <span key={k} className="hr-text-gold ml-1">
                  {unitTemplate(k as any).name}({mul}×)
                </span>
              ))}
            </div>
          </>
        )}

        {/* Buffs */}
        {unit.buffs.length > 0 && (
          <>
            <div className="hr-divider" />
            <div className="text-[11px]">
              <span className="opacity-60">状态：</span>
              {unit.buffs.map(b => (
                <span key={b.id} className="hr-text-gold ml-1">
                  {buffName(b.type)}({b.remaining}回合)
                </span>
              ))}
            </div>
          </>
        )}

        {/* 远程被贴身警告 */}
        {t.attackRange >= 2 && state.phase === "playing" && isRangedPenalized(state, unit) && (
          <>
            <div className="hr-divider" />
            <div className="text-[11px]" style={{ color: "#ff7878" }}>
              ⚠ 近战包夹中：远程伤害减半
            </div>
          </>
        )}

        {/* 战斗预测：如果是敌方且当前是我方回合，显示对峙伤害 */}
        {unit.side === "enemy" && state.phase === "playing" && (
          <DamagePreview state={state} hero={hero} target={unit} />
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 hr-btn hr-btn-secondary text-xs py-1.5"
        >
          关闭
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="opacity-60">{label}</span>
      <span className="hr-display font-bold">{value}</span>
    </div>
  );
}

function buffName(type: string): string {
  return (
    {
      speed_up: "加速",
      shield: "护盾",
      damage_up: "增伤",
      blessed: "祝福",
    }[type] ?? type
  );
}

function DamagePreview({
  state,
  hero,
  target,
}: {
  state: BattleState;
  hero: HeroState;
  target: Unit;
}) {
  // 找 currentActor，如果是 ally 就显示对该敌人的预期伤害
  const cur = state.units.find((u, i) => state.turnOrder[state.nextActor] === u.id);
  if (!cur || cur.side !== "ally") return null;

  const myDmg = computeAttackDamage(state, cur, target, hero);
  const theirDmg = computeAttackDamage(state, target, cur, hero);

  return (
    <>
      <div className="hr-divider" />
      <div className="text-[11px] opacity-90">
        <div className="mb-0.5 hr-display tracking-wider">⚔ 对峙预测</div>
        <div>
          我方攻击 →{" "}
          <span className="hr-text-gold font-bold">-{myDmg}</span>
        </div>
        <div>
          被反击 →{" "}
          <span style={{ color: "#ff7878" }} className="font-bold">
            -{theirDmg}
          </span>
        </div>
      </div>
    </>
  );
}
