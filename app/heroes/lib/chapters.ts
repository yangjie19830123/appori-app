import type { ChapterConfig, LevelConfig } from "./types";

// 我方布阵默认位置（6 个槽位，从 team 按顺序填充）
const ALLY_LAYOUT: LevelConfig["allyLayout"] = [
  { x: 1, y: 6 },  // 槽 0：前排左
  { x: 3, y: 6 },  // 槽 1：前排右
  { x: 1, y: 7 },  // 槽 2：后排左
  { x: 3, y: 7 },  // 槽 3：后排右
  { x: 0, y: 6 },  // 槽 4：左翼
  { x: 4, y: 6 },  // 槽 5：右翼
];

const LEVELS: LevelConfig[] = [
  {
    id: "1-1",
    name: "第一课",
    desc: "新手训练。一个落单的哥布林步兵。",
    enemies: [
      { kind: "infantry", x: 2, y: 0 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 60,
    enemyBuff: { attack: 0, defense: 0 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 50 },
      three: { allyLossPctMax: 15 },
    },
  },
  {
    id: "1-2",
    name: "树林伏兵",
    desc: "弓箭手躲在远处放冷箭。",
    enemies: [
      { kind: "infantry", x: 2, y: 1 },
      { kind: "archer",   x: 0, y: 0 },
      { kind: "archer",   x: 4, y: 0 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 100,
    enemyBuff: { attack: 1, defense: 1 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 40 },
      three: { allyLossPctMax: 10 },
    },
  },
  {
    id: "1-3",
    name: "骑兵突袭",
    desc: "敌方骑兵高速冲来——让步兵迎战！",
    enemies: [
      { kind: "cavalry", x: 1, y: 1 },
      { kind: "cavalry", x: 3, y: 1 },
      { kind: "cavalry", x: 2, y: 0 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 140,
    enemyBuff: { attack: 2, defense: 2 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 35 },
      three: { allyLossPctMax: 10 },
    },
  },
  {
    id: "1-4",
    name: "三方混战",
    desc: "敌方混编部队来袭。考验全兵种调度。",
    enemies: [
      { kind: "infantry", x: 1, y: 1 },
      { kind: "infantry", x: 3, y: 1 },
      { kind: "archer",   x: 0, y: 0 },
      { kind: "archer",   x: 4, y: 0 },
      { kind: "cavalry",  x: 2, y: 0 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 180,
    enemyBuff: { attack: 3, defense: 3 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 30 },
      three: { allyLossPctMax: 10 },
    },
  },
  {
    id: "1-5",
    name: "BOSS：哥布林酋长",
    desc: "章节首领。记得用魔法和走位。",
    enemies: [
      { kind: "shieldman", x: 2, y: 0 }, // BOSS：盾兵酋长（更难推）
      { kind: "infantry",  x: 1, y: 1 },
      { kind: "infantry",  x: 3, y: 1 },
      { kind: "archer",    x: 0, y: 0 },
      { kind: "archer",    x: 4, y: 0 },
      { kind: "cavalry",   x: 2, y: 2 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 250,
    enemyBuff: { attack: 5, defense: 5 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 30 },
      three: { allyLossPctMax: 10 },
    },
  },
];

export const CHAPTER_1: ChapterConfig = {
  id: 1,
  name: "训练之路",
  desc: "凯瑟琳带领新兵在边境磨练，初遇哥布林部落。",
  emoji: "⚔️",
  unlocked: true,
  levels: LEVELS,
};

// ============================================================================
// Chapter 2 — 精灵之森
// ============================================================================

const CH2_LEVELS: LevelConfig[] = [
  {
    id: "2-1",
    name: "林间初遇",
    desc: "踏入精灵领地，远处传来弓弦的低鸣。",
    enemies: [
      { kind: "elf_archer", x: 0, y: 0 },
      { kind: "elf_archer", x: 4, y: 0 },
      { kind: "spider",     x: 2, y: 1 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 100,
    enemyBuff: { attack: 1, defense: 1 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 40 },
      three: { allyLossPctMax: 15 },
    },
  },
  {
    id: "2-2",
    name: "蛛群涌动",
    desc: "黑色的蜘蛛从树洞中爬出，速度惊人。",
    enemies: [
      { kind: "spider",     x: 0, y: 1 },
      { kind: "spider",     x: 1, y: 0 },
      { kind: "spider",     x: 3, y: 0 },
      { kind: "spider",     x: 4, y: 1 },
      { kind: "elf_archer", x: 2, y: 0 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 150,
    enemyBuff: { attack: 2, defense: 2 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 35 },
      three: { allyLossPctMax: 12 },
    },
  },
  {
    id: "2-3",
    name: "古木苏醒",
    desc: "巨树缓缓睁开双眼——树人挡住了你的去路。",
    enemies: [
      { kind: "treant",     x: 2, y: 1 },
      { kind: "elf_archer", x: 0, y: 0 },
      { kind: "elf_archer", x: 4, y: 0 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 180,
    enemyBuff: { attack: 2, defense: 2 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 35 },
      three: { allyLossPctMax: 12 },
    },
    enemyHero: {
      name: "森林贤者",
      emoji: "🧚",
      desc: "古老的精灵贤者，治愈树木与同胞。",
      ability: {
        type: "heal_all",
        cooldown: 3,
        value: 20,
        name: "森林之拥",
      },
    },
  },
  {
    id: "2-4",
    name: "弓林伏击",
    desc: "无数箭矢从林间倾泻而下！",
    enemies: [
      { kind: "elf_archer", x: 0, y: 0 },
      { kind: "elf_archer", x: 1, y: 1 },
      { kind: "elf_archer", x: 2, y: 0 },
      { kind: "elf_archer", x: 3, y: 1 },
      { kind: "elf_archer", x: 4, y: 0 },
      { kind: "spider",     x: 2, y: 2 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 220,
    enemyBuff: { attack: 3, defense: 3 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 30 },
      three: { allyLossPctMax: 10 },
    },
  },
  {
    id: "2-5",
    name: "BOSS：精灵女王",
    desc: "森林之主亲临战场。她的弓箭从不空发。",
    enemies: [
      { kind: "elf_archer", x: 2, y: 0 }, // 女王（位中央）
      { kind: "treant",     x: 2, y: 2 }, // 守护树人
      { kind: "elf_archer", x: 0, y: 1 },
      { kind: "elf_archer", x: 4, y: 1 },
      { kind: "spider",     x: 1, y: 2 },
      { kind: "spider",     x: 3, y: 2 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 350,
    enemyBuff: { attack: 5, defense: 5 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 30 },
      three: { allyLossPctMax: 10 },
    },
    enemyHero: {
      name: "精灵女王",
      emoji: "👸🏼",
      desc: "森林之主，控制无形的暗影箭矢。",
      ability: {
        type: "damage_random",
        cooldown: 3,
        value: 25,
        name: "暗影箭",
      },
    },
  },
];

export const CHAPTER_2: ChapterConfig = {
  id: 2,
  name: "精灵之森",
  desc: "深入古老的精灵领地，与神秘的森林居民交战。",
  emoji: "🌲",
  unlocked: false, // 动态解锁：通关 1-5 后开启
  levels: CH2_LEVELS,
};

// ============================================================================
// Chapter 3 — 亡灵入侵
// ============================================================================

const CH3_LEVELS: LevelConfig[] = [
  {
    id: "3-1",
    name: "墓园边缘",
    desc: "墓地中传来骨头摩擦的声音——亡灵苏醒了。",
    enemies: [
      { kind: "skeleton", x: 1, y: 0 },
      { kind: "skeleton", x: 3, y: 0 },
      { kind: "skeleton", x: 2, y: 1 },
      { kind: "zombie",   x: 2, y: 0 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 200,
    enemyBuff: { attack: 1, defense: 1 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 35 },
      three: { allyLossPctMax: 12 },
    },
  },
  {
    id: "3-2",
    name: "死亡迷雾",
    desc: "迷雾中弓骷髅成排站立，箭如雨下。",
    enemies: [
      { kind: "skeleton",        x: 1, y: 1 },
      { kind: "skeleton",        x: 2, y: 1 },
      { kind: "skeleton",        x: 3, y: 1 },
      { kind: "skeleton",        x: 2, y: 2 },
      { kind: "skeleton_archer", x: 0, y: 0 },
      { kind: "skeleton_archer", x: 4, y: 0 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 250,
    enemyBuff: { attack: 2, defense: 2 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 35 },
      three: { allyLossPctMax: 12 },
    },
  },
  {
    id: "3-3",
    name: "巫师塔下",
    desc: "塔顶站着一个枯瘦身影——死灵法师。",
    enemies: [
      { kind: "necromancer", x: 2, y: 0 },
      { kind: "zombie",      x: 1, y: 1 },
      { kind: "zombie",      x: 3, y: 1 },
      { kind: "skeleton",    x: 0, y: 2 },
      { kind: "skeleton",    x: 4, y: 2 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 300,
    enemyBuff: { attack: 3, defense: 3 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 32 },
      three: { allyLossPctMax: 10 },
    },
    enemyHero: {
      name: "暗影法师",
      emoji: "🧛",
      desc: "操纵亡灵的黑袍法师。",
      ability: {
        type: "buff_all",
        cooldown: 3,
        value: 4,
        name: "亡者之力",
      },
    },
  },
  {
    id: "3-4",
    name: "万骨之地",
    desc: "整片大地铺满白骨，每一步都是亡灵的注视。",
    enemies: [
      { kind: "skeleton",        x: 0, y: 1 },
      { kind: "skeleton",        x: 1, y: 1 },
      { kind: "skeleton",        x: 2, y: 1 },
      { kind: "skeleton",        x: 3, y: 1 },
      { kind: "skeleton",        x: 4, y: 1 },
      { kind: "skeleton",        x: 2, y: 2 },
      { kind: "necromancer",     x: 2, y: 0 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 380,
    enemyBuff: { attack: 4, defense: 4 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 30 },
      three: { allyLossPctMax: 10 },
    },
  },
  {
    id: "3-5",
    name: "BOSS：死亡领主",
    desc: "凯瑟琳的最终试炼。打败它，黑暗将退散。",
    enemies: [
      { kind: "necromancer",     x: 2, y: 0 }, // 死亡领主（强化死灵法师）
      { kind: "zombie",          x: 2, y: 1 },
      { kind: "skeleton_archer", x: 0, y: 0 },
      { kind: "skeleton_archer", x: 4, y: 0 },
      { kind: "skeleton",        x: 1, y: 2 },
      { kind: "skeleton",        x: 3, y: 2 },
    ],
    allyLayout: ALLY_LAYOUT,
    rewardXp: 500,
    enemyBuff: { attack: 6, defense: 6 },
    starThresholds: {
      one: "win",
      two: { allyLossPctMax: 30 },
      three: { allyLossPctMax: 10 },
    },
    enemyHero: {
      name: "死亡领主",
      emoji: "☠️",
      desc: "黑暗本身的化身，触手可至灵魂。",
      ability: {
        type: "damage_all",
        cooldown: 2,
        value: 12,
        name: "死亡之触",
      },
    },
  },
];

export const CHAPTER_3: ChapterConfig = {
  id: 3,
  name: "亡灵入侵",
  desc: "黑暗法师召唤亡灵大军侵袭城镇。",
  emoji: "💀",
  unlocked: false, // 动态解锁：通关 2-5 后开启
  levels: CH3_LEVELS,
};

export const CHAPTERS: ChapterConfig[] = [
  CHAPTER_1,
  CHAPTER_2,
  CHAPTER_3,
];

export function findLevel(chapterId: number, levelId: string): LevelConfig | null {
  const ch = CHAPTERS.find(c => c.id === chapterId);
  if (!ch) return null;
  return ch.levels.find(l => l.id === levelId) ?? null;
}

// 章节解锁条件：第 N 章解锁 = 第 N-1 章全部关卡至少 1 星 通关
// 第 1 章默认解锁
export function isChapterUnlocked(
  chapterId: number,
  progress: Record<number, Record<string, number>>,
): boolean {
  if (chapterId <= 1) return true;
  const prevCh = CHAPTERS.find(c => c.id === chapterId - 1);
  if (!prevCh || prevCh.levels.length === 0) return false;
  const prevProgress = progress[chapterId - 1] ?? {};
  // 前一章每一关都需要 stars ≥ 1
  return prevCh.levels.every(l => (prevProgress[l.id] ?? 0) >= 1);
}
