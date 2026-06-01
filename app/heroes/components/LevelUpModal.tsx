"use client";

import { useState } from "react";
import type { SaveData, StatChoice } from "../lib/types";
import { applyStatChoice, saveSave } from "../lib/save";

interface Props {
  save: SaveData;
  onComplete: (newSave: SaveData) => void;
}

const CHOICES: { id: StatChoice; emoji: string; name: string; desc: string }[] = [
  { id: "attack",  emoji: "⚔️", name: "攻击 +1", desc: "我方所有部队攻击+1" },
  { id: "defense", emoji: "🛡️", name: "防御 +1", desc: "我方所有部队防御+1" },
  { id: "power",   emoji: "✨", name: "法力 +1", desc: "法术效果增强" },
];

export function LevelUpModal({ save, onComplete }: Props) {
  const [picking, setPicking] = useState(true);

  if (!picking) return null;

  const handlePick = (choice: StatChoice) => {
    const newHero = applyStatChoice(save.hero, choice);
    const newSave: SaveData = {
      ...save,
      hero: newHero,
      pendingLevelUps: save.pendingLevelUps - 1,
    };
    saveSave(newSave);
    if (newSave.pendingLevelUps > 0) {
      // 还有下一次升级要选，停留并刷新组件
      onComplete(newSave);
    } else {
      setPicking(false);
      onComplete(newSave);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="hr-panel p-5 max-w-sm w-full hr-victory-pop">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">⭐</div>
          <h2 className="hr-display text-2xl font-bold tracking-wider">
            英雄升级！
          </h2>
          <div className="text-xs opacity-70 mt-1">
            等级提升至 Lv.{save.hero.level} · 法力上限 +5
          </div>
          {save.pendingLevelUps > 1 && (
            <div className="text-[11px] opacity-60 mt-1">
              （{save.pendingLevelUps} 次升级待选）
            </div>
          )}
        </div>
        <div className="text-xs opacity-80 mb-3 text-center">选择一项属性提升</div>
        <div className="space-y-2">
          {CHOICES.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => handlePick(c.id)}
              className="w-full hr-panel-soft p-3 flex items-center gap-3 hover:bg-white/10 active:scale-[0.98] transition cursor-pointer"
            >
              <div className="text-2xl">{c.emoji}</div>
              <div className="flex-1 text-left">
                <div className="hr-display font-bold">{c.name}</div>
                <div className="text-[10px] opacity-60">{c.desc}</div>
              </div>
              <div className="opacity-40">→</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
