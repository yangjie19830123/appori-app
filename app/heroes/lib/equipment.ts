import type { EquipmentItem, EquipmentTemplate, HeroState } from "./types";

export const EQUIPMENT_TEMPLATES: Record<string, EquipmentTemplate> = {
  // ── 武器 ──
  training_sword: {
    id: "training_sword",
    name: "训练剑",
    emoji: "🗡️",
    slot: "weapon",
    rarity: "common",
    bonus: { attack: 2 },
    desc: "新兵训练用剑",
  },
  battle_axe: {
    id: "battle_axe",
    name: "战斧",
    emoji: "🪓",
    slot: "weapon",
    rarity: "common",
    bonus: { attack: 3 },
    desc: "沉重锋利的双手斧",
  },
  holy_sword: {
    id: "holy_sword",
    name: "圣剑",
    emoji: "🔱",
    slot: "weapon",
    rarity: "rare",
    bonus: { attack: 5 },
    desc: "蕴含光明之力的传说之剑",
  },
  dragonslayer: {
    id: "dragonslayer",
    name: "屠龙剑",
    emoji: "⚔️",
    slot: "weapon",
    rarity: "legendary",
    bonus: { attack: 8, power: 1 },
    desc: "古代英雄留下的神兵，剑刃暗藏龙血",
  },
  // ── 护甲 ──
  leather_armor: {
    id: "leather_armor",
    name: "皮甲",
    emoji: "🦺",
    slot: "armor",
    rarity: "common",
    bonus: { defense: 2 },
    desc: "轻便的皮制护甲",
  },
  chainmail: {
    id: "chainmail",
    name: "锁子甲",
    emoji: "🥋",
    slot: "armor",
    rarity: "common",
    bonus: { defense: 3 },
    desc: "金属环编织而成的中等护甲",
  },
  plate_armor: {
    id: "plate_armor",
    name: "板甲",
    emoji: "⛑️",
    slot: "armor",
    rarity: "rare",
    bonus: { defense: 5 },
    desc: "全身覆盖的厚重金属甲",
  },
  dragon_scale: {
    id: "dragon_scale",
    name: "龙鳞甲",
    emoji: "🦾",
    slot: "armor",
    rarity: "legendary",
    bonus: { defense: 8, manaMax: 10 },
    desc: "用真龙之鳞锻造，刀枪不入",
  },
  // ── 饰品 ──
  mage_ring: {
    id: "mage_ring",
    name: "法师戒指",
    emoji: "💍",
    slot: "trinket",
    rarity: "common",
    bonus: { power: 1, manaMax: 5 },
    desc: "蕴含微弱魔力的银戒",
  },
  wisdom_amulet: {
    id: "wisdom_amulet",
    name: "智慧项链",
    emoji: "📿",
    slot: "trinket",
    rarity: "rare",
    bonus: { power: 2, manaMax: 10 },
    desc: "贤者的遗物，加深对法术的领悟",
  },
  king_crown: {
    id: "king_crown",
    name: "王者之冠",
    emoji: "👑",
    slot: "trinket",
    rarity: "legendary",
    bonus: { attack: 3, defense: 3, power: 2 },
    desc: "唯有真正的王者方能驾驭",
  },
};

export const ALL_EQUIPMENT_IDS = Object.keys(EQUIPMENT_TEMPLATES);

export function equipmentTemplate(id: string): EquipmentTemplate | null {
  return EQUIPMENT_TEMPLATES[id] ?? null;
}

// ============================================================================
// 战利品掉落
// ============================================================================

// 按星数掉落规则：
// 1 ⭐：30% 白
// 2 ⭐：60% 白 + 15% 绿
// 3 ⭐：100% 白 + 40% 绿 + 5% 紫
export function rollLoot(stars: number): EquipmentItem[] {
  const out: EquipmentItem[] = [];

  if (stars >= 3) {
    out.push(makeItem(pickByRarity("common")));
    if (Math.random() < 0.4) out.push(makeItem(pickByRarity("rare")));
    if (Math.random() < 0.05) out.push(makeItem(pickByRarity("legendary")));
  } else if (stars === 2) {
    if (Math.random() < 0.6) out.push(makeItem(pickByRarity("common")));
    if (Math.random() < 0.15) out.push(makeItem(pickByRarity("rare")));
  } else if (stars === 1) {
    if (Math.random() < 0.3) out.push(makeItem(pickByRarity("common")));
  }

  return out;
}

function pickByRarity(rarity: "common" | "rare" | "legendary"): string {
  const ids = ALL_EQUIPMENT_IDS.filter(
    id => EQUIPMENT_TEMPLATES[id].rarity === rarity,
  );
  return ids[Math.floor(Math.random() * ids.length)];
}

function makeItem(templateId: string): EquipmentItem {
  return {
    uid: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    templateId,
    obtainedAt: Date.now(),
  };
}

// ============================================================================
// 装备效果计算
// ============================================================================

// 把英雄基础属性 + 装备加成合并成"总属性"
export function effectiveHero(hero: HeroState, inventory: EquipmentItem[]): HeroState {
  const eq = hero.equipped;
  let attack = hero.attack;
  let defense = hero.defense;
  let power = hero.power;
  let manaMax = hero.manaMax;

  for (const slot of ["weapon", "armor", "trinket"] as const) {
    const uid = eq[slot];
    if (!uid) continue;
    const item = inventory.find(i => i.uid === uid);
    if (!item) continue;
    const t = equipmentTemplate(item.templateId);
    if (!t) continue;
    if (t.bonus.attack) attack += t.bonus.attack;
    if (t.bonus.defense) defense += t.bonus.defense;
    if (t.bonus.power) power += t.bonus.power;
    if (t.bonus.manaMax) manaMax += t.bonus.manaMax;
  }

  return { ...hero, attack, defense, power, manaMax };
}
