"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { findLevel } from "../../../lib/chapters";
import {
  attackableEnemies,
  availableSpells,
  canPlaceAt,
  castSpell,
  computeStars,
  currentActor,
  enemyAct,
  healableAllies,
  initBattle,
  isAllyTurn,
  moveAllyInSetup,
  playerAttack,
  playerHeal,
  playerMove,
  playerSkip,
  reachableCells,
  resetSetup,
  startCombat,
  swapAlliesInSetup,
  type FloatText,
} from "../../../lib/engine";
import { addXp, loadSave, saveSave, setLevelStars } from "../../../lib/save";
import { effectiveHero, equipmentTemplate, rollLoot } from "../../../lib/equipment";
import type { BattleState, SaveData, SpellId, Unit } from "../../../lib/types";
import { BOARD_H, BOARD_W } from "../../../lib/types";
import { SPELL_TEMPLATES, unitTemplate } from "../../../lib/units";
import { BattleBoard } from "../../../components/BattleBoard";
import { Stars } from "../../../components/Stars";
import { UnitTooltip } from "../../../components/UnitTooltip";
import { TurnOrder } from "../../../components/TurnOrder";
import { GameLog } from "../../../components/GameLog";
import { EnemyHeroBadge } from "../../../components/EnemyHeroBadge";

export default function BattlePage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = parseInt(String(params?.chapter ?? "1"), 10);
  const levelId = String(params?.level ?? "1-1");
  const level = findLevel(chapterId, levelId);

  const [save, setSave] = useState<SaveData | null>(null);
  const [state, setState] = useState<BattleState | null>(null);
  const [pendingFloats, setPendingFloats] = useState<FloatText[]>([]);
  const [pendingSpell, setPendingSpell] = useState<SpellId | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [tooltipUnit, setTooltipUnit] = useState<Unit | null>(null);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化
  useEffect(() => {
    const sv = loadSave();
    setSave(sv);
    if (level) {
      const eff = effectiveHero(sv.hero, sv.inventory);
      setState(initBattle(level, eff, sv.team));
    }
  }, [chapterId, levelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 进入 playing 时自动选中当前 actor（仅当 ally）
  useEffect(() => {
    if (!state) return;
    if (state.phase === "playing") {
      const a = currentActor(state);
      if (a && a.side === "ally") {
        setSelectedUnitId(a.id);
        setPendingSpell(null);
      } else {
        setSelectedUnitId(null);
      }
    }
  }, [state?.phase, state?.nextActor, state?.round]); // eslint-disable-line react-hooks/exhaustive-deps

  // 敌方回合自动行动（延时 600ms 让玩家看清谁要动）
  useEffect(() => {
    if (!state || !save) return;
    if (state.phase !== "playing") return;
    const a = currentActor(state);
    if (!a || a.side !== "enemy") return;

    aiTimerRef.current = setTimeout(() => {
      const r = enemyAct(state, effHero!);
      setState(r.state);
      setPendingFloats(r.floats);
    }, 700);
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [state, save]);

  // 战斗结束 → 弹结算
  useEffect(() => {
    if (!state) return;
    if (state.phase === "victory" || state.phase === "defeat" || state.phase === "draw") {
      const t = setTimeout(() => setShowResult(true), 700);
      return () => clearTimeout(t);
    }
  }, [state?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // 含装备加成的英雄属性（战斗中所有伤害计算都用这个）
  const effHero = useMemo(() => {
    if (!save) return null;
    return effectiveHero(save.hero, save.inventory);
  }, [save]);

  // ── 计算高亮：可移动格 + 可攻击敌人 + 法术目标 ──────────────
  const reach = useMemo(() => {
    if (!state || state.phase !== "playing") return new Map<string, number>();
    const a = currentActor(state);
    if (!a || a.side !== "ally") return new Map<string, number>();
    return reachableCells(state, a);
  }, [state]);

  const attackTargets = useMemo(() => {
    if (!state || state.phase !== "playing") return new Map<string, { x: number; y: number }>();
    const a = currentActor(state);
    if (!a || a.side !== "ally") return new Map<string, { x: number; y: number }>();
    return attackableEnemies(state, a, reach);
  }, [state, reach]);

  // 祭司专属：能治疗的友军
  const healTargets = useMemo(() => {
    if (!state || state.phase !== "playing") return new Map<string, { x: number; y: number }>();
    const a = currentActor(state);
    if (!a || a.side !== "ally" || a.kind !== "priest") return new Map<string, { x: number; y: number }>();
    return healableAllies(state, a);
  }, [state]);

  // 高亮的单位 ids
  const targetableIds = useMemo(() => {
    if (!state) return new Set<string>();
    const ids = new Set<string>();

    if (state.phase === "setup") {
      // 布阵阶段：所有我方
      for (const u of state.units) {
        if (!u.dead && u.side === "ally") ids.add(u.id);
      }
    } else if (state.phase === "playing") {
      if (pendingSpell) {
        // 施法选目标
        const sp = SPELL_TEMPLATES[pendingSpell];
        if (sp) {
          for (const u of state.units) {
            if (u.dead) continue;
            if (sp.target === "ally_unit" && u.side === "ally") ids.add(u.id);
            if (sp.target === "enemy_unit" && u.side === "enemy") ids.add(u.id);
          }
        }
      } else {
        // 普通操作：可攻击的敌人 + 祭司可治疗的友军
        for (const eid of attackTargets.keys()) ids.add(eid);
        for (const aid of healTargets.keys()) ids.add(aid);
      }
    }
    return ids;
  }, [state, pendingSpell, attackTargets, healTargets]);

  // 高亮格子
  const placeableCells = useMemo(() => {
    if (!state) return new Set<string>();
    const set = new Set<string>();

    if (state.phase === "setup" && selectedUnitId) {
      // 布阵阶段：可放置的空格
      for (let x = 0; x < BOARD_W; x++) {
        for (let y = 0; y < BOARD_H; y++) {
          if (canPlaceAt(state.units, x, y, selectedUnitId)) set.add(`${x},${y}`);
        }
      }
    } else if (state.phase === "playing" && !pendingSpell) {
      // 我方回合：当前 actor 的可移动格子
      for (const k of reach.keys()) set.add(k);
    }
    return set;
  }, [state, selectedUnitId, pendingSpell, reach]);

  if (!level) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="hr-display text-2xl mb-3">关卡不存在</div>
          <button className="hr-btn" onClick={() => router.push("/heroes")}>返回主页</button>
        </div>
      </main>
    );
  }
  if (!state || !save) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="hr-display text-xl opacity-60">载入中…</div>
      </main>
    );
  }

  // ── 事件处理 ──────────────────────────────────────────
  const handleSpellClick = (spellId: SpellId) => {
    if (!state || !save) return;
    const sp = SPELL_TEMPLATES[spellId];
    if (!sp || state.mana < sp.manaCost || !isAllyTurn(state)) return;
    // self_party 法术：立即释放，无需选目标
    if (sp.target === "self_party") {
      const r = castSpell(state, spellId, "", effHero!);
      setState(r.state);
      setPendingFloats(r.floats);
      setPendingSpell(null);
      return;
    }
    setPendingSpell(prev => (prev === spellId ? null : spellId));
  };

  const handleUnitClick = (u: Unit) => {
    if (!state || !save) return;

    if (state.phase === "setup") {
      if (u.side !== "ally") return;
      if (!selectedUnitId) setSelectedUnitId(u.id);
      else if (selectedUnitId === u.id) setSelectedUnitId(null);
      else {
        setState(swapAlliesInSetup(state, selectedUnitId, u.id));
        setSelectedUnitId(null);
      }
      return;
    }

    if (state.phase === "playing") {
      // 施法目标
      if (pendingSpell) {
        const r = castSpell(state, pendingSpell, u.id, effHero!);
        setState(r.state);
        setPendingFloats(r.floats);
        setPendingSpell(null);
        return;
      }
      const cur = currentActor(state);
      if (!cur || cur.side !== "ally") return;
      // 祭司治疗友军
      if (cur.kind === "priest" && u.side === "ally" && healTargets.has(u.id)) {
        const r = playerHeal(state, cur.id, u.id, effHero!);
        setState(r.state);
        setPendingFloats(r.floats);
        return;
      }
      // 攻击敌人
      if (u.side === "enemy" && attackTargets.has(u.id)) {
        const r = playerAttack(state, cur.id, u.id, effHero!);
        setState(r.state);
        setPendingFloats(r.floats);
      }
    }
  };

  const handleCellClick = (x: number, y: number) => {
    if (!state || !save) return;

    if (state.phase === "setup") {
      if (!selectedUnitId) return;
      if (!canPlaceAt(state.units, x, y, selectedUnitId)) return;
      setState(moveAllyInSetup(state, selectedUnitId, x, y));
      setSelectedUnitId(null);
      return;
    }

    if (state.phase === "playing") {
      const cur = currentActor(state);
      if (!cur || cur.side !== "ally") return;
      if (!reach.has(`${x},${y}`)) return;
      const r = playerMove(state, cur.id, x, y, effHero!);
      setState(r.state);
      setPendingFloats(r.floats);
    }
  };

  const handleStartCombat = () => {
    setSelectedUnitId(null);
    setState(startCombat(state));
  };

  const handleResetSetup = () => {
    if (!level) return;
    setState(resetSetup(state, level.allyLayout));
    setSelectedUnitId(null);
  };

  const handleSkip = () => {
    const r = playerSkip(state);
    setState(r.state);
    setPendingFloats(r.floats);
    setPendingSpell(null);
  };

  const spells = availableSpells(state, effHero!);
  const cur = currentActor(state);
  const allyTurn = isAllyTurn(state);

  // 当前回合标签文本
  const phaseTag =
    state.phase === "setup"
      ? "布阵阶段"
      : state.phase === "playing"
      ? `第 ${state.round} 回合 · ${allyTurn ? "你的回合" : "敌方回合"}`
      : state.phase === "victory"
      ? "胜利"
      : state.phase === "defeat"
      ? "战败"
      : "平局";

  return (
    <main className="min-h-[100dvh] flex flex-col p-3 max-w-md mx-auto">
      {/* 顶栏 */}
      <div className="flex items-center justify-between text-xs mb-2">
        <button
          type="button"
          onClick={() => router.push("/heroes")}
          className="px-2 py-1 rounded-md bg-white/5 border border-white/10 opacity-70"
        >
          ← 撤退
        </button>
        <div className="text-center">
          <div className="hr-display text-sm font-bold">{level.name}</div>
          <div
            className={`text-[10px] mt-0.5 ${
              state.phase === "playing" && allyTurn
                ? "hr-text-gold"
                : state.phase === "playing"
                ? "opacity-60"
                : "opacity-60"
            }`}
          >
            {level.id} · {phaseTag}
          </div>
        </div>
        <div className="w-12" />
      </div>

      {/* 法力值 */}
      {/* 行动顺序条 */}
      {state.phase === "playing" && (
        <div className="mb-1">
          <TurnOrder state={state} count={6} />
        </div>
      )}

      {/* 敌方英雄信息 */}
      {state.enemyHero && state.phase === "playing" && (
        <div className="mb-1">
          <EnemyHeroBadge state={state} />
        </div>
      )}

      {/* 法力值 */}
      <div className="hr-panel-soft p-2 mb-1 flex items-center gap-2">
        <span className="text-sm">💧</span>
        <div className="hr-bar flex-1">
          <div
            className="hr-bar-fill mana"
            style={{ width: `${(state.mana / state.manaMax) * 100}%` }}
          />
        </div>
        <span className="text-xs hr-display font-bold w-12 text-right">
          {state.mana}/{state.manaMax}
        </span>
      </div>

      {/* 战场（占满中间） */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <BattleBoard
          state={state}
          targetableUnitIds={targetableIds}
          placeableCells={placeableCells}
          selectedUnitId={selectedUnitId}
          onUnitClick={handleUnitClick}
          onUnitLongPress={u => setTooltipUnit(u)}
          onCellClick={handleCellClick}
          floats={pendingFloats}
        />
      </div>

      {/* 操作提示 */}
      {state.phase === "setup" && (
        <div className="text-center text-[11px] hr-text-gold opacity-90 mt-1">
          {selectedUnitId
            ? "点金色格子移动 · 点其他单位交换 · 再点自己取消"
            : "点我方单位调整位置 · 长按任何单位查看属性"}
        </div>
      )}
      {state.phase === "playing" && allyTurn && cur && (
        <div className="text-center text-[11px] hr-text-gold opacity-90 mt-1">
          {pendingSpell
            ? `点击 ${SPELL_TEMPLATES[pendingSpell].emoji}${SPELL_TEMPLATES[pendingSpell].name} 的目标`
            : `${unitTemplate(cur.kind).name} 的回合 · 点金格移动 / 点红框攻击 · 长按看属性`}
        </div>
      )}
      {state.phase === "playing" && !allyTurn && (
        <div className="text-center text-[11px] opacity-60 mt-1">
          敌方思考中…
        </div>
      )}

      {/* 法术栏 */}
      <div className="mt-2">
        <div className="flex items-center justify-center gap-3">
          {spells.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSpellClick(s.id)}
              disabled={!s.castable}
              className={`hr-spell ${
                !s.castable ? "hr-spell-disabled" : ""
              } ${pendingSpell === s.id ? "hr-spell-active" : ""}`}
              title={`${s.template.name} - ${s.template.desc}`}
            >
              <span>{s.template.emoji}</span>
              <span className="hr-spell-cost">{s.template.manaCost}</span>
            </button>
          ))}
        </div>
        <div className="text-center text-[9px] opacity-50 mt-1">
          {state.spellsCastThisRound >= 1 && state.phase === "playing"
            ? "本回合已施法 · 下回合再用"
            : spells.map(s => `${s.template.emoji}${s.template.name}`).join(" · ")}
        </div>
      </div>

      {/* 操作栏 */}
      <div className="flex gap-2 mt-2">
        {state.phase === "setup" && (
          <>
            <button type="button" onClick={handleResetSetup} className="hr-btn hr-btn-secondary px-3">
              ↺ 重置
            </button>
            <button type="button" onClick={handleStartCombat} className="hr-btn flex-1">
              ⚔ 开始战斗
            </button>
          </>
        )}
        {state.phase === "playing" && allyTurn && (
          <button type="button" onClick={handleSkip} className="hr-btn hr-btn-secondary flex-1">
            ⏭ 待命（跳过）
          </button>
        )}
      </div>

      {/* 结算弹窗 */}
      {showResult && (
        <ResultModal
          state={state}
          level={level}
          save={save}
          onContinue={() => router.push("/heroes")}
          onRetry={() => {
            setState(initBattle(level, effHero!, save.team));
            setShowResult(false);
            setPendingSpell(null);
            setPendingFloats([]);
            setSelectedUnitId(null);
          }}
        />
      )}

      {/* 单位详情（长按弹出） */}
      {tooltipUnit && effHero && (
        <UnitTooltip
          unit={tooltipUnit}
          state={state}
          hero={effHero}
          onClose={() => setTooltipUnit(null)}
        />
      )}

      {/* 战斗日志侧栏 */}
      <GameLog log={state.log} />
    </main>
  );
}

function ResultModal({
  state,
  level,
  save,
  onContinue,
  onRetry,
}: {
  state: BattleState;
  level: ReturnType<typeof findLevel>;
  save: SaveData;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const [savedSave, setSavedSave] = useState<SaveData | null>(null);
  const [lootDropped, setLootDropped] = useState<SaveData["inventory"]>([]);
  const [priestUnlocked, setPriestUnlocked] = useState(false);

  useEffect(() => {
    if (!level) return;
    if (state.phase === "victory") {
      const stars = computeStars(state, level);
      const xpResult = addXp(save.hero, level.rewardXp);
      const loot = rollLoot(stars);
      // 通关 2-5 解锁祭司
      const newlyUnlockedPriest = level.id === "2-5" && !save.unlocks.priest;

      let newSave: SaveData = {
        ...save,
        hero: xpResult.hero,
        pendingLevelUps: save.pendingLevelUps + xpResult.levelUps,
        totalBattles: save.totalBattles + 1,
        totalWins: save.totalWins + 1,
        inventory: save.inventory.length + loot.length <= 30
          ? [...save.inventory, ...loot]
          : save.inventory,
        unlocks: newlyUnlockedPriest
          ? { ...save.unlocks, priest: true }
          : save.unlocks,
        // 解锁祭司时自动把队伍里的第一个 cavalry 替换成 priest
        team: newlyUnlockedPriest
          ? (() => {
              const t = [...save.team];
              const idx = t.findIndex(k => k === "cavalry");
              if (idx >= 0) t[idx] = "priest";
              return t;
            })()
          : save.team,
      };
      newSave = setLevelStars(newSave, parseInt(level.id.split("-")[0], 10), level.id, stars);
      saveSave(newSave);
      setSavedSave(newSave);
      setLootDropped(loot);
      setPriestUnlocked(newlyUnlockedPriest);
    } else {
      const newSave: SaveData = { ...save, totalBattles: save.totalBattles + 1 };
      saveSave(newSave);
      setSavedSave(newSave);
    }
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!level) return null;
  const stars = state.phase === "victory" ? computeStars(state, level) : 0;
  const won = state.phase === "victory";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="hr-panel p-5 max-w-sm w-full hr-victory-pop text-center">
        <div className="text-5xl mb-2">
          {won ? "🏆" : state.phase === "draw" ? "🤝" : "💀"}
        </div>
        <h2 className="hr-display text-3xl font-black tracking-wider mb-2">
          {won ? "胜 利" : state.phase === "draw" ? "平 局" : "战 败"}
        </h2>
        {won && (
          <div className="flex justify-center my-3">
            <Stars filled={stars} size="lg" />
          </div>
        )}
        {won && (
          <div className="text-sm opacity-80 mb-2">
            获得经验 <span className="hr-display font-bold hr-text-gold">+{level.rewardXp}</span>
          </div>
        )}
        {won && lootDropped.length > 0 && (
          <div className="my-3">
            <div className="text-[10px] tracking-widest opacity-60 mb-2">⚜ 战 利 品 ⚜</div>
            <div className="flex justify-center gap-2 flex-wrap">
              {lootDropped.map(it => {
                const t = equipmentTemplate(it.templateId);
                if (!t) return null;
                return (
                  <div
                    key={it.uid}
                    className="hr-panel-soft p-2 flex flex-col items-center min-w-[64px]"
                    style={{
                      borderColor: rarityColor(t.rarity),
                      borderWidth: 2,
                    }}
                  >
                    <div className="text-2xl">{t.emoji}</div>
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: rarityColor(t.rarity) }}
                    >
                      {t.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {priestUnlocked && (
          <div className="hr-panel-soft p-3 my-3 hr-fade-in">
            <div className="text-2xl mb-1">🧙</div>
            <div className="hr-display tracking-wider hr-text-gold text-sm">
              新单位解锁：祭司
            </div>
            <div className="text-[10px] opacity-70 mt-1">
              下次战斗自动加入队伍 · 替代 1 个骑兵
            </div>
          </div>
        )}
        {savedSave && savedSave.pendingLevelUps > 0 && (
          <div className="text-xs hr-display tracking-widest mb-3 opacity-90">
            ⭐ 英雄升级！返回主页选择属性
          </div>
        )}
        <div className="hr-divider" />
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={onRetry} className="hr-btn hr-btn-secondary flex-1">
            再 战
          </button>
          <button type="button" onClick={onContinue} className="hr-btn flex-1">
            {won ? "继续" : "返回"}
          </button>
        </div>
      </div>
    </div>
  );
}

function rarityColor(rarity: "common" | "rare" | "legendary"): string {
  return rarity === "legendary" ? "#b06bdc" : rarity === "rare" ? "#5fa84a" : "#cccccc";
}
