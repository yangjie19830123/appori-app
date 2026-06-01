import {
  BattleLogEntry,
  BattleState,
  BOARD_H,
  BOARD_W,
  HeroState,
  LevelConfig,
  SpellId,
  Unit,
  UnitKind,
} from "./types";
import { SPELL_TEMPLATES, unitTemplate } from "./units";

// ============================================================================
// 初始化战斗
// ============================================================================

export function initBattle(
  level: LevelConfig,
  hero: HeroState,
  team: UnitKind[],
): BattleState {
  const units: Unit[] = [];
  let n = 0;

  // 我方单位：从 team 按顺序填到 layout 位置
  for (let i = 0; i < level.allyLayout.length; i++) {
    const pos = level.allyLayout[i];
    const kind = team[i] ?? "infantry"; // 万一 team 短了用 infantry 兜底
    const t = unitTemplate(kind);
    units.push({
      id: `u${n++}`,
      side: "ally",
      kind,
      hp: t.hp,
      hpMax: t.hp,
      x: pos.x,
      y: pos.y,
      buffs: [],
      dead: false,
    });
  }
  for (const e of level.enemies) {
    const t = unitTemplate(e.kind);
    units.push({
      id: `u${n++}`,
      side: "enemy",
      kind: e.kind,
      hp: t.hp,
      hpMax: t.hp,
      x: e.x,
      y: e.y,
      buffs: [],
      dead: false,
    });
  }

  return {
    phase: "setup",
    units,
    turnOrder: [],
    nextActor: 0,
    round: 1,
    maxRounds: 30,
    mana: hero.manaMax,
    manaMax: hero.manaMax,
    pendingSpell: null,
    log: [{ ts: Date.now(), text: `${level.name} · 准备布阵` }],
    enemyBuff: level.enemyBuff,
    spellsCastThisRound: 0,
    enemyHero: level.enemyHero,
    enemyHeroState: level.enemyHero
      ? { nextTriggerRound: level.enemyHero.ability.cooldown }
      : undefined,
  };
}

function buildTurnOrder(units: Unit[]): string[] {
  return units
    .filter(u => !u.dead)
    .sort((a, b) => {
      const sa = unitTemplate(a.kind).speed;
      const sb = unitTemplate(b.kind).speed;
      if (sa !== sb) return sb - sa;
      if (a.side !== b.side) return a.side === "ally" ? -1 : 1;
      return 0;
    })
    .map(u => u.id);
}

// ============================================================================
// 敌方英雄技能（在 round 切换时检查）
// ============================================================================

function triggerEnemyHeroAbility(s: BattleState) {
  if (!s.enemyHero || !s.enemyHeroState) return;
  if (s.round < s.enemyHeroState.nextTriggerRound) return;

  const eh = s.enemyHero;
  const ab = eh.ability;
  s.log = pushLog(s.log, `${eh.emoji} ${eh.name} 施放：${ab.name}！`);

  switch (ab.type) {
    case "heal_all": {
      // 全体敌方回血
      for (const u of s.units) {
        if (u.dead || u.side !== "enemy") continue;
        const before = u.hp;
        u.hp = Math.min(u.hpMax, u.hp + ab.value);
        const real = u.hp - before;
        if (real > 0) {
          s.log = pushLog(
            s.log,
            `  ${unitTemplate(u.kind).name} 恢复 ${real} HP`,
          );
        }
      }
      break;
    }
    case "damage_random": {
      // 随机一个我方单位受伤
      const candidates = s.units.filter(u => !u.dead && u.side === "ally");
      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        target.hp = Math.max(0, target.hp - ab.value);
        s.log = pushLog(
          s.log,
          `  ${unitTemplate(target.kind).name} 受到 ${ab.value} 伤害`,
        );
        if (target.hp <= 0) {
          target.dead = true;
          s.log = pushLog(
            s.log,
            `  ${unitTemplate(target.kind).name} 阵亡`,
          );
        }
      }
      break;
    }
    case "damage_all": {
      // 全体我方受伤
      for (const u of s.units) {
        if (u.dead || u.side !== "ally") continue;
        u.hp = Math.max(0, u.hp - ab.value);
        if (u.hp <= 0) {
          u.dead = true;
          s.log = pushLog(
            s.log,
            `  ${unitTemplate(u.kind).name} 阵亡`,
          );
        }
      }
      s.log = pushLog(s.log, `  全体我方受到 ${ab.value} 伤害`);
      break;
    }
    case "buff_all": {
      // 全体敌方加 damage_up buff（持续 cooldown 回合）
      for (const u of s.units) {
        if (u.dead || u.side !== "enemy") continue;
        u.buffs.push({
          id: `eh_${Date.now()}_${u.id}`,
          type: "damage_up",
          remaining: ab.cooldown,
          value: ab.value,
        });
      }
      s.log = pushLog(s.log, `  全体敌方 +${ab.value} 攻击`);
      break;
    }
  }

  // 检查胜负（damage_all 可能秒掉残血单位）
  s.phase = checkWinLoss(s).phase;

  // 设置下次触发回合
  s.enemyHeroState.nextTriggerRound = s.round + ab.cooldown;
}

// ============================================================================
// 布阵阶段（竖屏：我方下方 6-7 行）
// ============================================================================

export const SETUP_MIN_Y = 6;
export const SETUP_MAX_Y = 7;

export function isInSetupZone(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_W && y >= SETUP_MIN_Y && y <= SETUP_MAX_Y;
}

export function canPlaceAt(units: Unit[], x: number, y: number, ignoreId?: string): boolean {
  if (!isInSetupZone(x, y)) return false;
  return !units.some(u => !u.dead && u.id !== ignoreId && u.x === x && u.y === y);
}

export function moveAllyInSetup(state: BattleState, unitId: string, x: number, y: number): BattleState {
  if (state.phase !== "setup") return state;
  const unit = state.units.find(u => u.id === unitId);
  if (!unit || unit.side !== "ally") return state;
  if (!canPlaceAt(state.units, x, y, unitId)) return state;
  return {
    ...state,
    units: state.units.map(u => (u.id === unitId ? { ...u, x, y } : u)),
  };
}

export function swapAlliesInSetup(state: BattleState, aId: string, bId: string): BattleState {
  if (state.phase !== "setup") return state;
  const a = state.units.find(u => u.id === aId);
  const b = state.units.find(u => u.id === bId);
  if (!a || !b || a.side !== "ally" || b.side !== "ally") return state;
  return {
    ...state,
    units: state.units.map(u => {
      if (u.id === aId) return { ...u, x: b.x, y: b.y };
      if (u.id === bId) return { ...u, x: a.x, y: a.y };
      return u;
    }),
  };
}

export function resetSetup(
  state: BattleState,
  defaultLayout: { x: number; y: number }[],
): BattleState {
  if (state.phase !== "setup") return state;
  // 按 ally 顺序对应 layout 顺序（u0 → layout[0]）
  const allies = state.units.filter(u => u.side === "ally");
  const newAllyMap = new Map<string, { x: number; y: number }>();
  for (let i = 0; i < allies.length && i < defaultLayout.length; i++) {
    newAllyMap.set(allies[i].id, defaultLayout[i]);
  }
  return {
    ...state,
    units: state.units.map(u => {
      const pos = newAllyMap.get(u.id);
      if (!pos) return u;
      return { ...u, x: pos.x, y: pos.y };
    }),
  };
}

export function startCombat(state: BattleState): BattleState {
  if (state.phase !== "setup") return state;
  return {
    ...state,
    phase: "playing",
    turnOrder: buildTurnOrder(state.units),
    nextActor: 0,
    round: 1,
    log: [...state.log, { ts: Date.now(), text: "⚔ 战斗开始！" }],
  };
}

// ============================================================================
// 当前 actor / 我方回合判定
// ============================================================================

export function currentActor(state: BattleState): Unit | null {
  if (state.phase !== "playing") return null;
  const id = state.turnOrder[state.nextActor];
  return state.units.find(u => u.id === id && !u.dead) ?? null;
}

export function isAllyTurn(state: BattleState): boolean {
  const a = currentActor(state);
  return !!a && a.side === "ally";
}

// ============================================================================
// 移动范围 / 攻击范围（BFS）
// ============================================================================

export function reachableCells(state: BattleState, unit: Unit): Map<string, number> {
  const result = new Map<string, number>();
  if (unit.dead) return result;

  const t = unitTemplate(unit.kind);
  let move = t.moveRange;
  const haste = unit.buffs.find(b => b.type === "speed_up");
  if (haste) move += haste.value;

  const visited = new Set<string>([`${unit.x},${unit.y}`]);
  const queue: { x: number; y: number; d: number }[] = [{ x: unit.x, y: unit.y, d: 0 }];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.d >= move) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx < 0 || nx >= BOARD_W || ny < 0 || ny >= BOARD_H) continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const occupant = state.units.find(u => !u.dead && u.x === nx && u.y === ny);
      if (occupant) continue;
      result.set(key, cur.d + 1);
      queue.push({ x: nx, y: ny, d: cur.d + 1 });
    }
  }
  return result;
}

export function attackableEnemies(
  state: BattleState,
  unit: Unit,
  reach: Map<string, number>,
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  const t = unitTemplate(unit.kind);
  const enemies = state.units.filter(e => !e.dead && e.side !== unit.side);

  // 远程单位（射程 ≥ 2）攻击时不走动，只能在原地打
  // 但是射程不再受 attackRange 限制 —— 整个战场都能打到，距离影响伤害
  const isRanged = t.attackRange >= 2;
  const standpoints: { x: number; y: number }[] = isRanged
    ? [{ x: unit.x, y: unit.y }]
    : [
        { x: unit.x, y: unit.y },
        ...Array.from(reach.keys()).map(k => {
          const [x, y] = k.split(",").map(Number);
          return { x, y };
        }),
      ];

  for (const e of enemies) {
    let bestStand: { x: number; y: number } | null = null;
    let bestDist = Infinity;
    for (const sp of standpoints) {
      const d = manhattan(sp.x, sp.y, e.x, e.y);
      // 远程：所有距离都可攻击（伤害衰减由 computeAttackDamage 处理）
      // 近战：必须在 attackRange 内
      const canHit = isRanged ? true : d <= t.attackRange;
      if (canHit && d < bestDist) {
        bestDist = d;
        bestStand = sp;
      }
    }
    if (bestStand) result.set(e.id, bestStand);
  }
  return result;
}

// 祭司能"攻击"（实为治疗）的友军：全战场不满血友军（远程单位规则）
// 治疗量受距离衰减影响
export function healableAllies(
  state: BattleState,
  unit: Unit,
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  if (unit.kind !== "priest") return result;
  const allies = state.units.filter(
    a => !a.dead && a.side === unit.side && a.id !== unit.id && a.hp < a.hpMax,
  );
  for (const a of allies) {
    result.set(a.id, { x: unit.x, y: unit.y });
  }
  return result;
}

function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

// ============================================================================
// 玩家操作
// ============================================================================

export interface FloatText {
  unitId: string;
  text: string;
  kind: "damage" | "heal" | "miss" | "buff";
}

export interface StepResult {
  state: BattleState;
  floats: FloatText[];
}

export function playerMove(
  state: BattleState,
  unitId: string,
  destX: number,
  destY: number,
  hero: HeroState,
  attackTargetId?: string,
): StepResult {
  const out: StepResult = { state: cloneState(state), floats: [] };
  if (out.state.phase !== "playing") return out;

  const actor = currentActor(out.state);
  if (!actor || actor.id !== unitId || actor.side !== "ally") return out;

  const reach = reachableCells(out.state, actor);
  const isOriginPos = destX === actor.x && destY === actor.y;
  if (!isOriginPos && !reach.has(`${destX},${destY}`)) return out;

  const idx = out.state.units.findIndex(u => u.id === unitId);
  out.state.units[idx] = { ...out.state.units[idx], x: destX, y: destY };

  if (attackTargetId) {
    const target = out.state.units.find(u => u.id === attackTargetId);
    if (target && !target.dead && target.side !== actor.side) {
      const t = unitTemplate(out.state.units[idx].kind);
      const d = manhattan(destX, destY, target.x, target.y);
      if (d <= t.attackRange) {
        performAttackInPlace(out.state, out.state.units[idx], target, hero, out.floats);
      }
    }
  }

  out.state = checkWinLoss(out.state);
  if (out.state.phase === "playing") advanceActor(out.state);
  return out;
}

export function playerAttack(
  state: BattleState,
  unitId: string,
  enemyId: string,
  hero: HeroState,
): StepResult {
  const cur = currentActor(state);
  if (!cur || cur.id !== unitId) return { state, floats: [] };
  const reach = reachableCells(state, cur);
  const att = attackableEnemies(state, cur, reach);
  const stand = att.get(enemyId);
  if (!stand) return { state, floats: [] };
  return playerMove(state, unitId, stand.x, stand.y, hero, enemyId);
}

// 祭司治疗友军（消耗回合）
export function playerHeal(
  state: BattleState,
  unitId: string,
  allyId: string,
  hero: HeroState,
): StepResult {
  const out: StepResult = { state: cloneState(state), floats: [] };
  if (out.state.phase !== "playing") return out;
  const actor = currentActor(out.state);
  if (!actor || actor.id !== unitId || actor.kind !== "priest") return out;
  const target = out.state.units.find(u => u.id === allyId);
  if (!target || target.dead || target.side !== actor.side) return out;
  // 距离（祭司全场治疗，但远距离效果衰减，跟弓箭手一样）
  const d = Math.abs(actor.x - target.x) + Math.abs(actor.y - target.y);

  // 治疗量：基础 20，按英雄 power 略微加成 + 距离衰减
  const falloff = rangedFalloffMultiplier(d);
  const heal = Math.round(20 * (1 + hero.power * 0.1) * falloff);
  const before = target.hp;
  const idx = out.state.units.findIndex(u => u.id === allyId);
  out.state.units[idx] = {
    ...target,
    hp: Math.min(target.hpMax, target.hp + heal),
  };
  const real = out.state.units[idx].hp - before;
  out.floats.push({ unitId: allyId, text: `+${real}`, kind: "heal" });
  out.state.log = pushLog(
    out.state.log,
    `🧙 祭司 → ${unitTemplate(target.kind).name}：恢复 ${real} HP`,
  );
  if (out.state.phase === "playing") advanceActor(out.state);
  return out;
}

export function playerSkip(state: BattleState): StepResult {
  const out: StepResult = { state: cloneState(state), floats: [] };
  if (out.state.phase !== "playing") return out;
  const actor = currentActor(out.state);
  if (!actor) return out;
  out.state.log = pushLog(out.state.log, `${unitTemplate(actor.kind).name} 待命`);
  advanceActor(out.state);
  return out;
}

// ============================================================================
// 推进 actor
// ============================================================================

function advanceActor(s: BattleState) {
  s.nextActor++;
  if (s.nextActor >= s.turnOrder.length) {
    s.round++;
    if (s.round > s.maxRounds) {
      s.phase = "draw";
      s.log = pushLog(s.log, `双方僵持 ${s.maxRounds} 回合，平局。`);
      return;
    }
    for (const u of s.units) {
      u.buffs = u.buffs.map(b => ({ ...b, remaining: b.remaining - 1 })).filter(b => b.remaining > 0);
    }
    s.turnOrder = buildTurnOrder(s.units);
    s.nextActor = 0;
    // 新回合：法术次数重置
    s.spellsCastThisRound = 0;
    // 检查敌方英雄技能触发
    triggerEnemyHeroAbility(s);
    if (s.phase !== "playing") return;
  }
  // 跳过死人
  let safety = 0;
  while (s.nextActor < s.turnOrder.length && safety++ < 50) {
    const id = s.turnOrder[s.nextActor];
    const u = s.units.find(x => x.id === id);
    if (u && !u.dead) break;
    s.nextActor++;
    if (s.nextActor >= s.turnOrder.length) {
      advanceActor(s);
      return;
    }
  }
}

// ============================================================================
// 敌方 AI
// ============================================================================

export function enemyAct(state: BattleState, hero: HeroState): StepResult {
  const out: StepResult = { state: cloneState(state), floats: [] };
  if (out.state.phase !== "playing") return out;
  const actor = currentActor(out.state);
  if (!actor || actor.side !== "enemy") return out;

  const reach = reachableCells(out.state, actor);
  const att = attackableEnemies(out.state, actor, reach);

  if (att.size > 0) {
    const candidates = Array.from(att.entries()).map(([id, stand]) => ({
      target: out.state.units.find(u => u.id === id)!,
      stand,
    }));
    const target = pickAITarget(actor, candidates);
    const idx = out.state.units.findIndex(u => u.id === actor.id);
    out.state.units[idx] = { ...out.state.units[idx], x: target.stand.x, y: target.stand.y };
    performAttackInPlace(out.state, out.state.units[idx], target.target, hero, out.floats);
    out.state = checkWinLoss(out.state);
    if (out.state.phase === "playing") advanceActor(out.state);
    return out;
  }

  const enemies = out.state.units.filter(u => !u.dead && u.side !== actor.side);
  if (enemies.length === 0) {
    advanceActor(out.state);
    return out;
  }
  const nearest = enemies.reduce((best, e) =>
    manhattan(actor.x, actor.y, e.x, e.y) < manhattan(actor.x, actor.y, best.x, best.y) ? e : best,
  );

  let bestCell: { x: number; y: number } | null = null;
  let bestD = Infinity;
  for (const k of reach.keys()) {
    const [x, y] = k.split(",").map(Number);
    const d = manhattan(x, y, nearest.x, nearest.y);
    if (d < bestD) {
      bestD = d;
      bestCell = { x, y };
    }
  }
  if (bestCell) {
    const idx = out.state.units.findIndex(u => u.id === actor.id);
    out.state.units[idx] = { ...out.state.units[idx], x: bestCell.x, y: bestCell.y };
    out.state.log = pushLog(out.state.log, `${unitTemplate(actor.kind).name} 移动`);
  }
  advanceActor(out.state);
  return out;
}

function pickAITarget(
  actor: Unit,
  candidates: { target: Unit; stand: { x: number; y: number } }[],
) {
  const t = unitTemplate(actor.kind);
  const lethal = candidates.find(c => estimateDamage(actor, c.target, 0, 0) >= c.target.hp);
  if (lethal) return lethal;
  const countered = candidates.find(c => (t.counters[c.target.kind] ?? 1) > 1);
  if (countered) return countered;
  return candidates.reduce((best, c) => (c.target.hp < best.target.hp ? c : best));
}

// ============================================================================
// 攻击结算
// ============================================================================

function performAttackInPlace(
  s: BattleState,
  attacker: Unit,
  target: Unit,
  hero: HeroState,
  floats: FloatText[],
) {
  const dmg = computeAttackDamage(s, attacker, target, hero);
  target.hp = Math.max(0, target.hp - dmg);
  floats.push({ unitId: target.id, text: `-${dmg}`, kind: "damage" });

  const aT = unitTemplate(attacker.kind);
  const tT = unitTemplate(target.kind);
  s.log = pushLog(
    s.log,
    `${sideEmoji(attacker.side)}${aT.name} → ${sideEmoji(target.side)}${tT.name}：-${dmg}`,
  );
  if (target.hp <= 0) {
    target.dead = true;
    s.log = pushLog(s.log, `${sideEmoji(target.side)}${tT.name} 阵亡`);
  }
}

// 公开 API：计算攻击者对目标的预期伤害（用于 UI 预览 + 内部结算）
export function computeAttackDamage(
  state: BattleState,
  attacker: Unit,
  target: Unit,
  hero: HeroState,
): number {
  const aT = unitTemplate(attacker.kind);
  const tT = unitTemplate(target.kind);

  // 攻击方 atk：基础 + (我方→英雄加成 / 敌方→挑战加成) + buff
  let atk = aT.attack;
  if (attacker.side === "ally") atk += hero.attack;
  else atk += state.enemyBuff.attack;
  const dmgBuff = attacker.buffs.find(b => b.type === "damage_up");
  if (dmgBuff) atk += dmgBuff.value;

  // 防御方 def：基础 + (我方→英雄加成 / 敌方→挑战加成) + buff
  let def = tT.defense;
  if (target.side === "ally") def += hero.defense;
  else def += state.enemyBuff.defense;
  const shield = target.buffs.find(b => b.type === "shield");
  if (shield) def += shield.value;

  let dmg = Math.max(1, atk - def * 0.5);
  const counter = aT.counters[target.kind] ?? 1;
  dmg *= counter;

  // 远程单位距离衰减：近距离伤害高，远距离伤害低
  // 倍率 = clamp(1.3 - distance × 0.10, 0.3, 1.3)
  if (aT.attackRange >= 2) {
    const dist = Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y);
    const falloff = Math.max(0.3, Math.min(1.3, 1.3 - dist * 0.10));
    dmg *= falloff;
  }

  // 远程单位被近战贴身惩罚：伤害 × 0.5
  if (aT.attackRange >= 2 && isRangedPenalized(state, attacker)) {
    dmg *= 0.5;
  }

  return Math.max(1, Math.round(dmg));
}

// 计算远程距离衰减倍率（公开 API，UI 用来显示提示）
export function rangedFalloffMultiplier(distance: number): number {
  return Math.max(0.3, Math.min(1.3, 1.3 - distance * 0.10));
}

// 远程单位是否被近战敌人贴身（4 邻格内有活的敌方单位）
export function isRangedPenalized(state: BattleState, unit: Unit): boolean {
  for (const dx of [-1, 0, 1]) {
    for (const dy of [-1, 0, 1]) {
      if (dx === 0 && dy === 0) continue;
      if (Math.abs(dx) + Math.abs(dy) !== 1) continue; // 仅上下左右 4 邻
      const nx = unit.x + dx;
      const ny = unit.y + dy;
      const adj = state.units.find(
        u => !u.dead && u.x === nx && u.y === ny && u.side !== unit.side,
      );
      if (adj) return true;
    }
  }
  return false;
}

// 旧接口保留兼容（AI 内部用）
function estimateDamage(
  attacker: Unit,
  target: Unit,
  heroAtk: number,
  heroDef: number,
): number {
  const aT = unitTemplate(attacker.kind);
  const tT = unitTemplate(target.kind);
  let atk = aT.attack + heroAtk;
  const dmgBuff = attacker.buffs.find(b => b.type === "damage_up");
  if (dmgBuff) atk += dmgBuff.value;
  let def = tT.defense + heroDef;
  const shield = target.buffs.find(b => b.type === "shield");
  if (shield) def += shield.value;
  let dmg = Math.max(1, atk - def * 0.5);
  const counter = aT.counters[target.kind] ?? 1;
  dmg *= counter;
  return Math.max(1, Math.round(dmg));
}

// ============================================================================
// 法术
// ============================================================================

export function castSpell(
  s: BattleState,
  spellId: SpellId,
  targetUnitId: string,
  hero: HeroState,
): StepResult {
  const out: StepResult = { state: cloneState(s), floats: [] };
  if (out.state.phase !== "playing") return out;

  const sp = SPELL_TEMPLATES[spellId];
  if (!sp) return out;
  if (out.state.mana < sp.manaCost) return out;
  if (!isAllyTurn(out.state)) return out;
  // 每回合英雄只能施放 1 次法术
  if (out.state.spellsCastThisRound >= 1) return out;

  // self_party 法术不需要单位目标
  if (sp.target === "self_party") {
    out.state.mana -= sp.manaCost;
    out.state.spellsCastThisRound++;
    applySelfPartySpell(out.state, spellId, hero, out.floats);
    out.state = checkWinLoss(out.state);
    return out;
  }

  const target = out.state.units.find(u => u.id === targetUnitId);
  if (!target || target.dead) return out;
  if (sp.target === "ally_unit" && target.side !== "ally") return out;
  if (sp.target === "enemy_unit" && target.side !== "enemy") return out;

  out.state.mana -= sp.manaCost;
  out.state.spellsCastThisRound++;
  const power = hero.power;

  switch (spellId) {
    case "heal": {
      const amt = Math.round(sp.baseValue * (1 + power * 0.1));
      const before = target.hp;
      target.hp = Math.min(target.hpMax, target.hp + amt);
      const real = target.hp - before;
      out.floats.push({ unitId: target.id, text: `+${real}`, kind: "heal" });
      out.state.log = pushLog(
        out.state.log,
        `${hero.name} 对 ${unitTemplate(target.kind).name} 施放治疗：+${real}`,
      );
      break;
    }
    case "haste": {
      target.buffs.push({
        id: `b${Date.now()}`,
        type: "speed_up",
        remaining: 2,
        value: sp.baseValue,
      });
      out.floats.push({ unitId: target.id, text: "💨", kind: "buff" });
      out.state.log = pushLog(
        out.state.log,
        `${hero.name} 对 ${unitTemplate(target.kind).name} 施放加速`,
      );
      break;
    }
    case "judgment": {
      const dmg = Math.round(sp.baseValue * (1 + power * 0.1));
      target.hp = Math.max(0, target.hp - dmg);
      out.floats.push({ unitId: target.id, text: `-${dmg}`, kind: "damage" });
      out.state.log = pushLog(
        out.state.log,
        `${hero.name} 对 ${unitTemplate(target.kind).name} 施放神圣审判：-${dmg}`,
      );
      if (target.hp <= 0) {
        target.dead = true;
        out.state.log = pushLog(
          out.state.log,
          `${unitTemplate(target.kind).name} 被审判净化`,
        );
      }
      break;
    }
    case "thorn_arrow": {
      // 半穿透：扣防御一半再算伤害（比普攻更猛但不像 judgment 完全无视）
      const tT = unitTemplate(target.kind);
      const partialDef = (tT.defense / 2) * 0.5;
      const baseDmg = sp.baseValue * (1 + power * 0.1);
      const dmg = Math.max(1, Math.round(baseDmg - partialDef));
      target.hp = Math.max(0, target.hp - dmg);
      out.floats.push({ unitId: target.id, text: `-${dmg}`, kind: "damage" });
      out.state.log = pushLog(
        out.state.log,
        `${hero.name} 对 ${unitTemplate(target.kind).name} 施放荆棘箭：-${dmg}`,
      );
      if (target.hp <= 0) {
        target.dead = true;
        out.state.log = pushLog(
          out.state.log,
          `${unitTemplate(target.kind).name} 被荆棘绞杀`,
        );
      }
      break;
    }
  }

  out.state = checkWinLoss(out.state);
  return out;
}

function applySelfPartySpell(
  s: BattleState,
  spellId: SpellId,
  hero: HeroState,
  floats: FloatText[],
) {
  const sp = SPELL_TEMPLATES[spellId];
  if (!sp) return;

  switch (spellId) {
    case "rally": {
      const allies = s.units.filter(u => !u.dead && u.side === "ally");
      for (const a of allies) {
        a.buffs.push({
          id: `b${Date.now()}_${a.id}`,
          type: "damage_up",
          remaining: 2,
          value: sp.baseValue,
        });
        floats.push({ unitId: a.id, text: "🎺", kind: "buff" });
      }
      s.log = pushLog(s.log, `${hero.name} 吹响集结号！全军 +${sp.baseValue} 攻击`);
      break;
    }
  }
}

// ============================================================================
// 胜负
// ============================================================================

function checkWinLoss(s: BattleState): BattleState {
  const allyAlive = s.units.some(u => u.side === "ally" && !u.dead);
  const enemyAlive = s.units.some(u => u.side === "enemy" && !u.dead);
  if (!enemyAlive && allyAlive) {
    s.phase = "victory";
    s.log = pushLog(s.log, "🏆 胜利！");
  } else if (!allyAlive && enemyAlive) {
    s.phase = "defeat";
    s.log = pushLog(s.log, "💀 战败");
  } else if (!allyAlive && !enemyAlive) {
    s.phase = "draw";
    s.log = pushLog(s.log, "双方同归于尽");
  }
  return s;
}

// ============================================================================
// 工具
// ============================================================================

function cloneState(s: BattleState): BattleState {
  return {
    ...s,
    units: s.units.map(u => ({ ...u, buffs: u.buffs.map(b => ({ ...b })) })),
    turnOrder: [...s.turnOrder],
    log: [...s.log],
  };
}

function pushLog(log: BattleLogEntry[], text: string): BattleLogEntry[] {
  const next = [...log, { ts: Date.now(), text }];
  return next.slice(-30);
}

function sideEmoji(side: "ally" | "enemy"): string {
  return side === "ally" ? "🟦" : "🟥";
}

// ============================================================================
// 战后结算
// ============================================================================

export function computeStars(state: BattleState, level: LevelConfig): number {
  if (state.phase !== "victory") return 0;
  let totalMax = 0;
  let totalCur = 0;
  for (const u of state.units) {
    if (u.side === "ally") {
      totalMax += u.hpMax;
      totalCur += u.dead ? 0 : u.hp;
    }
  }
  const lossPct = totalMax === 0 ? 0 : ((totalMax - totalCur) / totalMax) * 100;
  if (lossPct <= level.starThresholds.three.allyLossPctMax) return 3;
  if (lossPct <= level.starThresholds.two.allyLossPctMax) return 2;
  return 1;
}

export function availableSpells(s: BattleState, hero: HeroState) {
  return hero.spells.map(id => {
    const sp = SPELL_TEMPLATES[id];
    return {
      id,
      template: sp,
      castable:
        s.mana >= sp.manaCost &&
        s.phase === "playing" &&
        isAllyTurn(s) &&
        s.spellsCastThisRound < 1,
    };
  });
}
