"use client";

import type { EquipmentItem, HeroId, HeroState, SaveData, SpellId, StatChoice, UnitKind } from "./types";
import { XP_TABLE } from "./types";
import { equipmentTemplate } from "./equipment";

const SAVE_KEY = "appori:heroes:save:v1";

// ============================================================================
// 英雄预设
// ============================================================================

export interface HeroPreset {
  id: HeroId;
  name: string;
  emoji: string;
  className: string;
  desc: string;
  attack: number;
  defense: number;
  power: number;
  manaMax: number;
  startingSpells: SpellId[];
  spellAt5: SpellId;
  spellAt7: SpellId;
}

export const HERO_PRESETS: Record<HeroId, HeroPreset> = {
  katherine: {
    id: "katherine",
    name: "凯瑟琳",
    emoji: "👸",
    className: "圣骑士",
    desc: "正统骑士团长，攻防均衡，擅长辅助友军。适合新手。",
    attack: 1,
    defense: 2,
    power: 1,
    manaMax: 10,
    startingSpells: ["heal", "judgment", "haste"],
    spellAt5: "thorn_arrow",
    spellAt7: "rally",
  },
  ailis: {
    id: "ailis",
    name: "艾利斯",
    emoji: "🧙‍♀️",
    className: "法师",
    desc: "学院出身的元素法师，法力深厚，法术伤害高。",
    attack: 1,
    defense: 1,
    power: 2,
    manaMax: 15,
    startingSpells: ["heal", "judgment", "thorn_arrow"],
    spellAt5: "haste",
    spellAt7: "rally",
  },
  rogan: {
    id: "rogan",
    name: "罗根",
    emoji: "🤴",
    className: "战士",
    desc: "经验丰富的征战将军。部队加成强，但法术较弱。",
    attack: 2,
    defense: 2,
    power: 0,
    manaMax: 8,
    startingSpells: ["haste", "rally", "judgment"],
    spellAt5: "heal",
    spellAt7: "thorn_arrow",
  },
};

// ============================================================================
// 初始英雄
// ============================================================================

export function newHero(heroId: HeroId = "katherine"): HeroState {
  const p = HERO_PRESETS[heroId];
  return {
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    level: 1,
    xp: 0,
    attack: p.attack,
    defense: p.defense,
    power: p.power,
    manaMax: p.manaMax,
    spells: [...p.startingSpells],
    equipped: { weapon: null, armor: null, trinket: null },
  };
}

// 默认队伍：6 个单位（不需要 priest 解锁的版本）
export const DEFAULT_TEAM: UnitKind[] = [
  "shieldman", "infantry", "archer", "archer", "cavalry", "cavalry",
];

// 解锁祭司后的推荐队伍
export const DEFAULT_TEAM_WITH_PRIEST: UnitKind[] = [
  "shieldman", "infantry", "archer", "archer", "priest", "cavalry",
];

export function newSave(heroId: HeroId = "katherine"): SaveData {
  return {
    hero: newHero(heroId),
    progress: {},
    totalBattles: 0,
    totalWins: 0,
    pendingLevelUps: 0,
    inventory: [],
    pendingLoot: [],
    unlocks: { priest: false },
    team: DEFAULT_TEAM,
  };
}

// ============================================================================
// 经验/升级
// ============================================================================

// 升级解锁法术：每个英雄有不同的 Lv5 / Lv7 法术
function spellsToUnlockAtLevel(heroId: HeroId, level: number): SpellId[] {
  const p = HERO_PRESETS[heroId];
  if (!p) return [];
  const out: SpellId[] = [];
  if (level === 5) out.push(p.spellAt5);
  if (level === 7) out.push(p.spellAt7);
  return out;
}

export function addXp(
  hero: HeroState,
  amount: number,
): { hero: HeroState; levelUps: number; newSpells: string[] } {
  let h = { ...hero };
  h.xp += amount;
  let ups = 0;
  const newSpells: string[] = [];
  while (h.level < XP_TABLE.length && h.xp >= XP_TABLE[h.level]) {
    h.level++;
    h.manaMax += 5;
    ups++;
    // 按英雄 id 查这级该解锁的法术
    const toLearn = spellsToUnlockAtLevel(h.id, h.level);
    for (const spell of toLearn) {
      if (!h.spells.includes(spell)) {
        h = { ...h, spells: [...h.spells, spell] };
        newSpells.push(spell);
      }
    }
  }
  return { hero: h, levelUps: ups, newSpells };
}

export function applyStatChoice(
  hero: HeroState,
  choice: StatChoice,
): HeroState {
  return { ...hero, [choice]: hero[choice] + 1 };
}

export function xpProgress(hero: HeroState): { cur: number; need: number; pct: number } {
  const cur = hero.xp - (XP_TABLE[hero.level - 1] ?? 0);
  if (hero.level >= XP_TABLE.length) return { cur: 0, need: 0, pct: 100 };
  const need = XP_TABLE[hero.level] - (XP_TABLE[hero.level - 1] ?? 0);
  return { cur, need, pct: Math.min(100, (cur / need) * 100) };
}

// ============================================================================
// 装备操作
// ============================================================================

export function equipItem(save: SaveData, uid: string): SaveData {
  const item = save.inventory.find(i => i.uid === uid);
  if (!item) return save;
  const t = equipmentTemplate(item.templateId);
  if (!t) return save;
  return {
    ...save,
    hero: {
      ...save.hero,
      equipped: { ...save.hero.equipped, [t.slot]: uid },
    },
  };
}

export function unequipItem(save: SaveData, slot: "weapon" | "armor" | "trinket"): SaveData {
  return {
    ...save,
    hero: { ...save.hero, equipped: { ...save.hero.equipped, [slot]: null } },
  };
}

export function discardItem(save: SaveData, uid: string): SaveData {
  // 如果正在装备，先卸下
  let s = save;
  for (const slot of ["weapon", "armor", "trinket"] as const) {
    if (s.hero.equipped[slot] === uid) s = unequipItem(s, slot);
  }
  return { ...s, inventory: s.inventory.filter(i => i.uid !== uid) };
}

export function claimLoot(save: SaveData): SaveData {
  return {
    ...save,
    inventory: [...save.inventory, ...save.pendingLoot],
    pendingLoot: [],
  };
}

// ============================================================================
// localStorage
// ============================================================================

export function loadSave(): SaveData {
  if (typeof window === "undefined") return newSave();
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return newSave();
    const data = JSON.parse(raw) as SaveData;
    // 简单兼容：缺字段用默认值补
    if (!data.hero) data.hero = newHero();
    if (!data.hero.equipped) {
      data.hero.equipped = { weapon: null, armor: null, trinket: null };
    }
    if (!data.progress) data.progress = {};
    if (typeof data.totalBattles !== "number") data.totalBattles = 0;
    if (typeof data.totalWins !== "number") data.totalWins = 0;
    if (typeof data.pendingLevelUps !== "number") data.pendingLevelUps = 0;
    if (!Array.isArray(data.inventory)) data.inventory = [];
    if (!Array.isArray(data.pendingLoot)) data.pendingLoot = [];
    if (!data.unlocks) data.unlocks = { priest: false };
    if (typeof data.unlocks.priest !== "boolean") data.unlocks.priest = false;
    if (!Array.isArray(data.team) || data.team.length !== 6) {
      data.team = data.unlocks.priest ? DEFAULT_TEAM_WITH_PRIEST : DEFAULT_TEAM;
    }

    // 补学：根据当前等级补足应有的法术（兼容老存档）
    // 老存档只有 katherine，新逻辑按 hero.id 查
    for (let lvl = 1; lvl <= data.hero.level; lvl++) {
      const toLearn = spellsToUnlockAtLevel(data.hero.id, lvl);
      for (const spell of toLearn) {
        if (!data.hero.spells.includes(spell)) {
          data.hero.spells = [...data.hero.spells, spell];
        }
      }
    }
    return data;
  } catch {
    return newSave();
  }
}

export function saveSave(data: SaveData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

// 是否已经存在玩家存档（用于决定是否弹英雄选择窗）
export function hasSave(): boolean {
  if (typeof window === "undefined") return true;
  return !!window.localStorage.getItem(SAVE_KEY);
}

export function resetSave() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SAVE_KEY);
}

// ============================================================================
// 关卡解锁规则：1-N 解锁需要 1-(N-1) 通关
// ============================================================================

export function isLevelUnlocked(
  save: SaveData,
  chapterId: number,
  levelIndex: number,
): boolean {
  if (levelIndex === 0) return true;
  const ch = save.progress[chapterId] ?? {};
  const prevId = `${chapterId}-${levelIndex}`;
  return (ch[prevId] ?? 0) >= 1;
}

export function levelStars(save: SaveData, chapterId: number, levelId: string): number {
  return save.progress[chapterId]?.[levelId] ?? 0;
}

export function setLevelStars(
  save: SaveData,
  chapterId: number,
  levelId: string,
  stars: number,
): SaveData {
  const ch = { ...(save.progress[chapterId] ?? {}) };
  ch[levelId] = Math.max(ch[levelId] ?? 0, stars);
  return {
    ...save,
    progress: { ...save.progress, [chapterId]: ch },
  };
}

// ============================================================================
// 队伍编辑
// ============================================================================

export const TEAM_SIZE = 6;

// 玩家可用的我方兵种（基础 + 解锁的）
export function availableUnitKinds(unlocks: SaveData["unlocks"]): import("./types").UnitKind[] {
  const base: import("./types").UnitKind[] = ["shieldman", "infantry", "archer", "cavalry"];
  if (unlocks.priest) base.push("priest");
  return base;
}

export function setTeam(save: SaveData, team: import("./types").UnitKind[]): SaveData {
  if (team.length !== TEAM_SIZE) return save;
  return { ...save, team };
}

export function resetTeamToDefault(save: SaveData): SaveData {
  return {
    ...save,
    team: save.unlocks.priest ? DEFAULT_TEAM_WITH_PRIEST : DEFAULT_TEAM,
  };
}
