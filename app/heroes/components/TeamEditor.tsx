"use client";

import { useState } from "react";
import type { SaveData, UnitKind } from "../lib/types";
import { unitTemplate } from "../lib/units";
import { availableUnitKinds, resetTeamToDefault, saveSave, setTeam, TEAM_SIZE } from "../lib/save";

interface Props {
  save: SaveData;
  onClose: () => void;
  onChange: (newSave: SaveData) => void;
}

export function TeamEditor({ save, onClose, onChange }: Props) {
  const [team, setTeamState] = useState<UnitKind[]>([...save.team]);
  const available = availableUnitKinds(save.unlocks);

  const isFull = team.length >= TEAM_SIZE;

  const handleAdd = (kind: UnitKind) => {
    if (isFull) return;
    setTeamState([...team, kind]);
  };

  const handleRemove = (idx: number) => {
    const next = [...team];
    next.splice(idx, 1);
    setTeamState(next);
  };

  const handleSave = () => {
    if (team.length !== TEAM_SIZE) return;
    const next = setTeam(save, team);
    saveSave(next);
    onChange(next);
    onClose();
  };

  const handleReset = () => {
    const next = resetTeamToDefault(save);
    saveSave(next);
    setTeamState([...next.team]);
    onChange(next);
  };

  // 统计每种兵的数量
  const counts: Record<string, number> = {};
  for (const k of team) counts[k] = (counts[k] ?? 0) + 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-3"
      onClick={onClose}
    >
      <div
        className="hr-panel p-4 max-w-md w-full max-h-[90vh] overflow-y-auto hr-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-3">
          <h2 className="hr-display text-lg tracking-widest">⚔ 我的队伍 ⚔</h2>
          <div className="text-xs opacity-60 mt-0.5">编辑上场的 6 个单位</div>
        </div>

        {/* 上场队伍：6 个槽位 */}
        <div className="text-[11px] opacity-60 mb-2 tracking-widest">
          上场 ({team.length}/{TEAM_SIZE})
        </div>
        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {Array.from({ length: TEAM_SIZE }).map((_, i) => {
            const kind = team[i];
            if (!kind) {
              return (
                <div
                  key={i}
                  className="hr-panel-soft p-2 flex items-center justify-center text-2xl opacity-30 aspect-square"
                >
                  ＋
                </div>
              );
            }
            const t = unitTemplate(kind);
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleRemove(i)}
                className="hr-panel-soft p-1.5 flex flex-col items-center justify-center aspect-square active:scale-95 transition-transform"
                title={`移除 ${t.name}`}
              >
                <div className="text-2xl">{t.emoji}</div>
                <div className="text-[8px] opacity-60 -mt-0.5">{t.name}</div>
              </button>
            );
          })}
        </div>

        <div className="hr-divider" />

        {/* 可选兵种 */}
        <div className="text-[11px] opacity-60 mb-2 tracking-widest">可选兵种</div>
        <div className="space-y-1.5">
          {available.map(kind => {
            const t = unitTemplate(kind);
            return (
              <button
                key={kind}
                type="button"
                onClick={() => handleAdd(kind)}
                disabled={isFull}
                className={`w-full hr-panel-soft p-2 flex items-center gap-3 ${
                  isFull ? "opacity-40 cursor-not-allowed" : "active:scale-[0.98]"
                } transition-transform`}
              >
                <div className="text-3xl">{t.emoji}</div>
                <div className="flex-1 text-left min-w-0">
                  <div className="hr-display font-bold text-sm">
                    {t.name}
                    {counts[kind] > 0 && (
                      <span className="hr-text-gold ml-2 text-xs">×{counts[kind]}</span>
                    )}
                  </div>
                  <div className="text-[10px] opacity-60 leading-tight">{t.desc}</div>
                </div>
                <div className="text-2xl opacity-50">{isFull ? "✓" : "＋"}</div>
              </button>
            );
          })}
          {!save.unlocks.priest && (
            <div className="hr-panel-soft p-2 flex items-center gap-3 opacity-40">
              <div className="text-3xl">🧙</div>
              <div className="flex-1">
                <div className="hr-display font-bold text-sm">祭司 🔒</div>
                <div className="text-[10px] opacity-60">通关 2-5 解锁</div>
              </div>
            </div>
          )}
        </div>

        {/* 单位详情迷你列表（数据参考） */}
        <div className="hr-divider" />
        <div className="text-[10px] opacity-60 mb-1.5 tracking-widest">兵种数据</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          {available.map(k => {
            const t = unitTemplate(k);
            return (
              <div key={k} className="flex items-center gap-1">
                <span>{t.emoji}</span>
                <span className="opacity-70 truncate">
                  HP{t.hp} 攻{t.attack} 防{t.defense}
                </span>
              </div>
            );
          })}
        </div>

        <div className="hr-divider" />

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="hr-btn hr-btn-secondary text-xs px-3"
            title="恢复默认队伍"
          >
            ↺
          </button>
          <button
            type="button"
            onClick={onClose}
            className="hr-btn hr-btn-secondary flex-1"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={team.length !== TEAM_SIZE}
            className={`hr-btn flex-1 ${team.length !== TEAM_SIZE ? "opacity-50" : ""}`}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
