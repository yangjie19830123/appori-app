// ============================================================================
// 单位 / 兵种
// ============================================================================

export type UnitKind =
  | "infantry"
  | "shieldman"
  | "archer"
  | "cavalry"
  | "priest"
  | "elf_archer"
  | "treant"
  | "spider"
  | "skeleton"
  | "zombie"
  | "skeleton_archer"
  | "necromancer";
export type Side = "ally" | "enemy";

export interface UnitTemplate {
  kind: UnitKind;
  name: string;            // "步兵"
  emoji: string;           // 🛡️
  hp: number;              // 单兵 HP
  attack: number;          // 基础攻击
  defense: number;         // 基础防御
  speed: number;           // 行动顺序排序用
  moveRange: number;       // 一回合最多移几格
  attackRange: number;     // 1 = 近战；>1 = 远程
  // 兵种相克倍率：作为攻击方时对 [被克者] 的伤害倍率
  // 例如步兵 vs 骑兵 = 1.5（步兵克骑兵）
  counters: Partial<Record<UnitKind, number>>;
  desc: string;            // 提示文案
}

// 战场上的具体单位实例
export interface Unit {
  id: string;
  side: Side;
  kind: UnitKind;
  hp: number;              // 当前 HP（可能受 buff 影响最大值）
  hpMax: number;
  // 网格坐标（左上为 0,0）
  x: number;
  y: number;
  // 临时 buff
  buffs: Buff[];
  // 已经死亡
  dead: boolean;
}

export interface Buff {
  id: string;
  type: "speed_up" | "shield" | "damage_up" | "blessed";
  remaining: number;       // 剩余回合数
  value: number;
}

// ============================================================================
// 英雄
// ============================================================================

export type HeroId = "katherine" | "ailis" | "rogan";

export interface HeroState {
  id: HeroId;
  name: string;            // 凯瑟琳
  emoji: string;           // 👸
  level: number;
  xp: number;              // 当前经验
  // 属性（HMM3 风格）—— 这些是基础值，装备加成单独算
  attack: number;          // 加成所有部队攻击
  defense: number;         // 加成所有部队防御
  power: number;           // 法术效果倍率
  manaMax: number;
  // 已学法术
  spells: SpellId[];
  // 装备槽
  equipped: {
    weapon: string | null;     // EquipmentItem.id
    armor: string | null;
    trinket: string | null;
  };
}

// ============================================================================
// 装备
// ============================================================================

export type EquipmentSlot = "weapon" | "armor" | "trinket";
export type EquipmentRarity = "common" | "rare" | "legendary";

export interface EquipmentTemplate {
  id: string;
  name: string;
  emoji: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  bonus: {
    attack?: number;
    defense?: number;
    power?: number;
    manaMax?: number;
  };
  desc: string;
}

// 玩家拥有的装备实例（暂时和 template 一对一，未来扩展词缀时再分离）
export interface EquipmentItem {
  uid: string;          // 唯一 id（同一种装备可能有多件）
  templateId: string;
  obtainedAt: number;   // 时间戳
}

// 升级所需经验（按等级查表）
export const XP_TABLE = [
  0,    // L1
  100,  // L2
  250,  // L3
  450,  // L4
  700,  // L5
  1000, // L6
  1400, // L7
  1900, // L8
  2500, // L9
  3200, // L10
];

// 三选一加点选项
export type StatChoice = "attack" | "defense" | "power";

// ============================================================================
// 法术
// ============================================================================

export type SpellId = "heal" | "haste" | "judgment" | "thorn_arrow" | "rally";

export interface SpellTemplate {
  id: SpellId;
  name: string;
  emoji: string;
  manaCost: number;
  // 目标类型
  target: "ally_unit" | "enemy_unit" | "self_party";
  // 范围（v0.1 全是单体）
  range: "single";
  desc: string;
  // 由 power 决定的效果倍率（基础值 × (1 + power × 0.1)）
  baseValue: number;
}

// ============================================================================
// 战场（竖屏：5 列 × 8 行；我方在下方，敌方在上方）
// ============================================================================

export const BOARD_W = 5;  // 列
export const BOARD_H = 8;  // 行

// 战场状态机的阶段
export type BattlePhase =
  | "setup"            // 战前预览（玩家点开始）
  | "playing"          // 战斗中
  | "victory"          // 我方赢
  | "defeat"           // 我方输
  | "draw";            // 平局（30 回合）

export interface BattleState {
  phase: BattlePhase;
  units: Unit[];
  turnOrder: string[];
  nextActor: number;
  round: number;
  maxRounds: number;
  mana: number;
  manaMax: number;
  pendingSpell: SpellId | null;
  log: BattleLogEntry[];
  // 敌方挑战加成（按关卡难度，应用到所有敌方部队的攻防）
  enemyBuff: { attack: number; defense: number };
  // 本轮已施放法术次数
  spellsCastThisRound: number;
  // 敌方英雄（如果关卡有）：模板 + 状态
  enemyHero?: EnemyHero;
  enemyHeroState?: {
    nextTriggerRound: number; // 何时下次发动技能
  };
}

export interface BattleLogEntry {
  ts: number;
  text: string;
}

// ============================================================================
// 关卡 / 章节
// ============================================================================

// ============================================================================
// 敌方英雄（NPC，关卡级技能触发器）
// ============================================================================

export type EnemyHeroAbility =
  | "heal_all"        // 全体敌方回血
  | "damage_random"   // 单体随机我方扣血
  | "damage_all"      // 全体我方扣血
  | "buff_all";       // 全体敌方 +攻击 buff

export interface EnemyHero {
  name: string;
  emoji: string;
  desc: string;
  ability: {
    type: EnemyHeroAbility;
    cooldown: number;     // 每 N round 触发
    value: number;        // 效果数值
    name: string;         // 技能名
  };
}

export interface LevelConfig {
  id: string;          // "1-1"
  name: string;
  desc: string;
  enemies: { kind: UnitKind; x: number; y: number }[];
  // 阵容位置（不再是固定 kind）—— 玩家从 team 里按顺序填这些位置
  allyLayout: { x: number; y: number }[];
  rewardXp: number;
  enemyBuff: { attack: number; defense: number };
  starThresholds: {
    one: "win";
    two: { allyLossPctMax: number };
    three: { allyLossPctMax: number };
  };
  // 关卡可选：敌方英雄
  enemyHero?: EnemyHero;
}

export interface ChapterConfig {
  id: number;
  name: string;
  desc: string;
  emoji: string;
  unlocked: boolean;
  levels: LevelConfig[];
}

// ============================================================================
// 玩家存档
// ============================================================================

export interface SaveData {
  hero: HeroState;
  // chapter id → level id → 星数（0/1/2/3）
  progress: Record<number, Record<string, number>>;
  // 累计统计（彩蛋用）
  totalBattles: number;
  totalWins: number;
  // 待领取的升级（通关后弹三选一）
  pendingLevelUps: number;  // 累积了几次升级未确认
  // 装备仓库
  inventory: EquipmentItem[];
  // 待领取的战利品（通关后展示给玩家）
  pendingLoot: EquipmentItem[];
  // 已解锁的特殊兵种（通关章节奖励）
  unlocks: {
    priest: boolean;  // 通关 2-5 解锁
  };
  // 上场队伍：6 个单位的兵种（玩家可自定义）
  team: UnitKind[];
}
