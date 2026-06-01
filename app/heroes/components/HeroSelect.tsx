"use client";

import { useState } from "react";
import { HERO_PRESETS, newSave, saveSave } from "../lib/save";
import type { HeroId, SaveData } from "../lib/types";

interface Props {
  onSelected: (save: SaveData) => void;
}

const HEROES_ORDER: HeroId[] = ["katherine", "ailis", "rogan"];

export function HeroSelect({ onSelected }: Props) {
  const [picked, setPicked] = useState<HeroId | null>("katherine");

  const handleConfirm = () => {
    if (!picked) return;
    const save = newSave(picked);
    saveSave(save);
    onSelected(save);
  };

  return (
    <main className="min-h-[100dvh] flex flex-col px-4 pt-8 pb-6 max-w-md mx-auto">
      {/* Logo */}
      <div className="text-center mb-6 hr-fade-in">
        <h1 className="hr-display text-3xl font-black tracking-widest">
          英 雄 之 路
        </h1>
        <div className="text-xs opacity-50 mt-1">HEROES — APPORI</div>
      </div>

      <div className="text-center mb-5 hr-fade-in">
        <h2 className="hr-display text-xl tracking-widest hr-text-gold">
          ⚜ 选 择 你 的 英 雄 ⚜
        </h2>
        <div className="text-[11px] opacity-60 mt-2">
          每个英雄拥有不同的初始属性和法术
        </div>
      </div>

      {/* 三个英雄卡片 */}
      <div className="space-y-3 flex-1">
        {HEROES_ORDER.map(id => {
          const p = HERO_PRESETS[id];
          const selected = picked === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPicked(id)}
              className={`hr-panel w-full p-4 text-left transition-transform active:scale-[0.99] ${
                selected ? "" : "opacity-70"
              }`}
              style={{
                borderColor: selected ? "var(--hr-gold-light)" : undefined,
                borderWidth: selected ? 3 : 2,
                boxShadow: selected
                  ? "0 0 0 1px rgba(0, 0, 0, 0.4) inset, 0 0 20px rgba(255, 216, 122, 0.3)"
                  : undefined,
              }}
            >
              <div className="flex gap-3">
                <div className="text-5xl">{p.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <div className="hr-display text-lg font-bold">{p.name}</div>
                    <div className="text-[11px] opacity-70">{p.className}</div>
                  </div>
                  <div className="text-[11px] opacity-70 mt-1 leading-snug">
                    {p.desc}
                  </div>
                </div>
              </div>

              {/* 属性 */}
              <div className="hr-divider" />
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="opacity-60">⚔️ 攻击</span>
                  <span className="hr-display font-bold">{p.attack}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">🛡️ 防御</span>
                  <span className="hr-display font-bold">{p.defense}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">✨ 法力</span>
                  <span className="hr-display font-bold">{p.power}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">💧 法力上限</span>
                  <span className="hr-display font-bold">{p.manaMax}</span>
                </div>
              </div>

              {/* 法术 */}
              <div className="hr-divider" />
              <div className="text-[10px] opacity-60 mb-1 tracking-widest">起始法术</div>
              <div className="flex flex-wrap gap-1 text-[11px]">
                {p.startingSpells.map(s => (
                  <span key={s} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10">
                    {spellEmoji(s)} {spellName(s)}
                  </span>
                ))}
              </div>
              <div className="text-[10px] opacity-50 mt-1.5">
                Lv.5 学 {spellEmoji(p.spellAt5)}{spellName(p.spellAt5)} ·
                Lv.7 学 {spellEmoji(p.spellAt7)}{spellName(p.spellAt7)}
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!picked}
        className="hr-btn w-full mt-5"
      >
        确 认 选 择 →
      </button>
      <div className="text-center text-[10px] opacity-40 mt-2">
        英雄选定后无法更改（除非重置存档）
      </div>
    </main>
  );
}

function spellEmoji(id: string): string {
  return ({
    heal: "✨",
    haste: "💨",
    judgment: "⚡",
    thorn_arrow: "🌿",
    rally: "🎺",
  } as Record<string, string>)[id] ?? "📜";
}
function spellName(id: string): string {
  return ({
    heal: "治疗",
    haste: "加速",
    judgment: "神圣审判",
    thorn_arrow: "荆棘箭",
    rally: "集结号",
  } as Record<string, string>)[id] ?? id;
}
