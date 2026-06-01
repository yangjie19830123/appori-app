"use client";

import { useState } from "react";
import type { EquipmentSlot, SaveData } from "../lib/types";
import {
  effectiveHero,
  equipmentTemplate,
  EQUIPMENT_TEMPLATES,
} from "../lib/equipment";
import {
  discardItem,
  equipItem,
  saveSave,
  unequipItem,
  xpProgress,
} from "../lib/save";

interface Props {
  save: SaveData;
  onClose: () => void;
  onChange: (newSave: SaveData) => void;
}

const SLOT_LABEL: Record<EquipmentSlot, string> = {
  weapon: "武器",
  armor: "护甲",
  trinket: "饰品",
};

const RARITY_COLOR: Record<string, string> = {
  common: "#cccccc",
  rare: "#5fa84a",
  legendary: "#b06bdc",
};

export function HeroDetail({ save, onClose, onChange }: Props) {
  const [filter, setFilter] = useState<EquipmentSlot | "all">("all");
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null);

  const eff = effectiveHero(save.hero, save.inventory);
  const xp = xpProgress(save.hero);

  const handleEquip = (uid: string) => {
    const next = equipItem(save, uid);
    saveSave(next);
    onChange(next);
  };
  const handleUnequip = (slot: EquipmentSlot) => {
    const next = unequipItem(save, slot);
    saveSave(next);
    onChange(next);
  };
  const handleDiscard = (uid: string) => {
    const next = discardItem(save, uid);
    saveSave(next);
    onChange(next);
    setConfirmDiscard(null);
  };

  const filteredInv = save.inventory.filter(i => {
    if (filter === "all") return true;
    const t = equipmentTemplate(i.templateId);
    return t?.slot === filter;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-3"
      onClick={onClose}
    >
      <div
        className="hr-panel p-4 max-w-md w-full max-h-[90vh] overflow-y-auto hr-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* 头像 + 等级 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="text-5xl">{save.hero.emoji}</div>
          <div className="flex-1">
            <div className="hr-display font-bold text-lg">{save.hero.name}</div>
            <div className="text-[11px] opacity-70">骑士 · 人族</div>
            <div className="hr-bar mt-1.5 h-2">
              <div className="hr-bar-fill" style={{ width: `${xp.pct}%` }} />
            </div>
            <div className="text-[10px] opacity-50 mt-0.5">
              Lv.{save.hero.level} · {xp.cur}/{xp.need} EXP
            </div>
          </div>
        </div>

        <div className="hr-divider" />

        {/* 总属性 */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mb-3">
          <StatRow label="⚔️ 攻击" base={save.hero.attack} eff={eff.attack} />
          <StatRow label="🛡️ 防御" base={save.hero.defense} eff={eff.defense} />
          <StatRow label="✨ 法力" base={save.hero.power} eff={eff.power} />
          <StatRow label="💧 法力上限" base={save.hero.manaMax} eff={eff.manaMax} />
        </div>

        <div className="hr-divider" />

        {/* 装备槽 */}
        <div className="text-[11px] opacity-60 mb-2 tracking-widest">已装备</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {(["weapon", "armor", "trinket"] as EquipmentSlot[]).map(slot => {
            const uid = save.hero.equipped[slot];
            const item = uid ? save.inventory.find(i => i.uid === uid) : null;
            const t = item ? equipmentTemplate(item.templateId) : null;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => t && handleUnequip(slot)}
                className="hr-panel-soft p-2 flex flex-col items-center justify-center gap-1 min-h-[64px]"
                style={{
                  borderColor: t ? RARITY_COLOR[t.rarity] : undefined,
                  borderWidth: t ? 2 : undefined,
                }}
              >
                {t ? (
                  <>
                    <div className="text-2xl">{t.emoji}</div>
                    <div className="text-[10px]" style={{ color: RARITY_COLOR[t.rarity] }}>
                      {t.name}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xl opacity-30">＋</div>
                    <div className="text-[10px] opacity-50">{SLOT_LABEL[slot]}</div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* 仓库 */}
        <div className="flex items-center gap-2 mb-2">
          <div className="text-[11px] opacity-60 tracking-widest">仓库</div>
          <div className="text-[10px] opacity-50">{save.inventory.length}/30</div>
          <div className="flex-1" />
          {(["all", "weapon", "armor", "trinket"] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-0.5 rounded-md ${
                filter === f
                  ? "bg-white/15 border border-white/30"
                  : "bg-white/5 border border-white/10 opacity-60"
              }`}
            >
              {f === "all" ? "全部" : SLOT_LABEL[f]}
            </button>
          ))}
        </div>

        {filteredInv.length === 0 ? (
          <div className="text-center text-xs opacity-50 py-6">
            仓库空空如也，去打仗掉装备吧
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredInv.map(item => {
              const t = equipmentTemplate(item.templateId)!;
              const equipped = Object.values(save.hero.equipped).includes(item.uid);
              const isPending = confirmDiscard === item.uid;
              return (
                <div
                  key={item.uid}
                  className="hr-panel-soft p-2 flex flex-col items-center text-center"
                  style={{ borderColor: RARITY_COLOR[t.rarity], borderWidth: 1 }}
                >
                  <div className="text-2xl">{t.emoji}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: RARITY_COLOR[t.rarity] }}>
                    {t.name}
                  </div>
                  <div className="text-[9px] opacity-70 mt-0.5">{bonusText(t)}</div>
                  {isPending ? (
                    <div className="flex gap-1 mt-1.5 w-full">
                      <button
                        type="button"
                        onClick={() => handleDiscard(item.uid)}
                        className="flex-1 text-[10px] py-1 rounded bg-uno-red/30 border border-red-500/50"
                        style={{ background: "rgba(200, 50, 50, 0.3)" }}
                      >
                        丢弃
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDiscard(null)}
                        className="flex-1 text-[10px] py-1 rounded bg-white/5 border border-white/10"
                      >
                        取消
                      </button>
                    </div>
                  ) : equipped ? (
                    <div className="text-[9px] hr-text-gold mt-1">已装备</div>
                  ) : (
                    <div className="flex gap-1 mt-1 w-full">
                      <button
                        type="button"
                        onClick={() => handleEquip(item.uid)}
                        className="flex-1 text-[10px] py-1 rounded bg-white/10 border border-white/20"
                      >
                        装备
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDiscard(item.uid)}
                        className="text-[10px] px-1.5 py-1 rounded bg-white/5 border border-white/10 opacity-60"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 hr-btn hr-btn-secondary"
        >
          关闭
        </button>
      </div>
    </div>
  );
}

function StatRow({ label, base, eff }: { label: string; base: number; eff: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="opacity-70">{label}</span>
      <span className="hr-display font-bold">
        {eff > base ? (
          <>
            {base}
            <span className="hr-text-gold ml-1">(+{eff - base})</span>
          </>
        ) : (
          base
        )}
      </span>
    </div>
  );
}

function bonusText(t: ReturnType<typeof equipmentTemplate>): string {
  if (!t) return "";
  const parts: string[] = [];
  if (t.bonus.attack) parts.push(`攻+${t.bonus.attack}`);
  if (t.bonus.defense) parts.push(`防+${t.bonus.defense}`);
  if (t.bonus.power) parts.push(`法+${t.bonus.power}`);
  if (t.bonus.manaMax) parts.push(`法力+${t.bonus.manaMax}`);
  return parts.join(" ");
}
