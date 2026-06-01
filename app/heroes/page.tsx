"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CHAPTERS, isChapterUnlocked } from "./lib/chapters";
import { hasSave, loadSave, xpProgress, isLevelUnlocked, levelStars, resetSave } from "./lib/save";
import { effectiveHero } from "./lib/equipment";
import type { SaveData } from "./lib/types";
import { unitTemplate } from "./lib/units";
import { Stars } from "./components/Stars";
import { LevelUpModal } from "./components/LevelUpModal";
import { HeroDetail } from "./components/HeroDetail";
import { TeamEditor } from "./components/TeamEditor";
import { HeroSelect } from "./components/HeroSelect";

export default function HeroesHomePage() {
  const [save, setSave] = useState<SaveData | null>(null);
  const [needSelect, setNeedSelect] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHeroDetail, setShowHeroDetail] = useState(false);
  const [showTeamEditor, setShowTeamEditor] = useState(false);

  useEffect(() => {
    if (!hasSave()) {
      setNeedSelect(true);
    } else {
      setSave(loadSave());
    }
  }, []);

  if (needSelect) {
    return (
      <HeroSelect
        onSelected={(s) => {
          setSave(s);
          setNeedSelect(false);
        }}
      />
    );
  }

  if (!save) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="hr-display text-2xl opacity-60">载入中…</div>
      </main>
    );
  }

  const xp = xpProgress(save.hero);
  const eff = effectiveHero(save.hero, save.inventory);
  const equippedCount = Object.values(save.hero.equipped).filter(Boolean).length;

  return (
    <main className="min-h-screen px-4 pt-6 pb-10 max-w-md mx-auto">
      {/* Logo */}
      <div className="text-center mb-5">
        <h1 className="hr-display text-3xl font-black tracking-widest">
          英 雄 之 路
        </h1>
        <div className="text-xs opacity-50 mt-1">HEROES — APPORI</div>
      </div>

      {/* 英雄面板 - 整个可点击 → 弹详情 */}
      <button
        type="button"
        onClick={() => setShowHeroDetail(true)}
        className="hr-panel p-4 mb-5 w-full text-left active:scale-[0.99] transition-transform"
      >
        <div className="flex gap-4">
          <div className="text-6xl">{save.hero.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between">
              <div className="hr-display text-xl font-bold">{save.hero.name}</div>
              <div className="text-sm">
                <span className="opacity-60">Lv.</span>
                <span className="hr-display text-xl font-bold ml-1">{save.hero.level}</span>
              </div>
            </div>
            <div className="text-xs opacity-60 mb-2">骑士 · 人族</div>
            {/* XP bar */}
            <div className="hr-bar mb-2.5">
              <div className="hr-bar-fill" style={{ width: `${xp.pct}%` }} />
            </div>
            <div className="text-[10px] opacity-50 -mt-1.5 mb-1.5">
              EXP {xp.cur}/{xp.need}
            </div>
            {/* 属性 - 含装备加成显示 */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <StatWithBonus icon="⚔️" name="攻击" base={save.hero.attack} eff={eff.attack} />
              <StatWithBonus icon="🛡️" name="防御" base={save.hero.defense} eff={eff.defense} />
              <StatWithBonus icon="✨" name="法力" base={save.hero.power} eff={eff.power} />
              <StatWithBonus icon="💧" name="法力值" base={save.hero.manaMax} eff={eff.manaMax} />
            </div>
          </div>
        </div>

        {/* 法术列表 */}
        <div className="hr-divider" />
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[11px] opacity-60 tracking-widest">已学法术</div>
          <div className="text-[10px] opacity-60">
            装备 {equippedCount}/3 · 仓库 {save.inventory.length}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {save.hero.spells.map(s => (
            <span key={s} className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
              {spellEmoji(s)} {spellName(s)}
            </span>
          ))}
        </div>
        <div className="text-center text-[9px] opacity-40 mt-2">
          点击查看详情 / 管理装备
        </div>
      </button>

      {/* 队伍卡片 */}
      <button
        type="button"
        onClick={() => setShowTeamEditor(true)}
        className="hr-panel p-3 mb-5 w-full text-left active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">⚔️</div>
          <div className="flex-1 min-w-0">
            <div className="hr-display font-bold text-sm">我的队伍</div>
            <div className="text-[10px] opacity-60">点击编辑上场单位</div>
          </div>
          <div className="flex gap-1">
            {save.team.map((kind, i) => {
              const t = unitTemplate(kind);
              return (
                <div
                  key={i}
                  className="text-xl"
                  title={t.name}
                >
                  {t.emoji}
                </div>
              );
            })}
          </div>
        </div>
      </button>

      {/* 待领取的升级 */}
      {save.pendingLevelUps > 0 && (
        <LevelUpModal
          save={save}
          onComplete={(newSave) => setSave(newSave)}
        />
      )}

      {/* 章节列表 */}
      <div className="space-y-3">
        <h2 className="hr-display text-lg tracking-widest text-center opacity-80">
          ⚜ 章 节 ⚜
        </h2>
        {CHAPTERS.map(ch => (
          <ChapterCard key={ch.id} chapter={ch} save={save} />
        ))}
      </div>

      {/* 重置存档（开发期方便测试） */}
      <div className="mt-8 text-center">
        {!showResetConfirm ? (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="text-[10px] opacity-40 hover:opacity-70"
          >
            重置存档
          </button>
        ) : (
          <div className="text-xs opacity-80">
            <div className="mb-2">确定重置？所有进度会清空。</div>
            <button
              type="button"
              className="hr-btn hr-btn-danger text-xs px-3 py-1.5 mr-2"
              onClick={() => {
                resetSave();
                window.location.reload();
              }}
            >
              确定
            </button>
            <button
              type="button"
              className="hr-btn hr-btn-secondary text-xs px-3 py-1.5"
              onClick={() => setShowResetConfirm(false)}
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* 英雄详情 / 装备管理 */}
      {showHeroDetail && (
        <HeroDetail
          save={save}
          onClose={() => setShowHeroDetail(false)}
          onChange={setSave}
        />
      )}

      {/* 队伍编辑 */}
      {showTeamEditor && (
        <TeamEditor
          save={save}
          onClose={() => setShowTeamEditor(false)}
          onChange={setSave}
        />
      )}
    </main>
  );
}

function Stat({ icon, name, value }: { icon: string; name: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{icon}</span>
      <span className="opacity-60">{name}</span>
      <span className="hr-display font-bold ml-auto">{value}</span>
    </div>
  );
}

function StatWithBonus({
  icon,
  name,
  base,
  eff,
}: {
  icon: string;
  name: string;
  base: number;
  eff: number;
}) {
  const bonus = eff - base;
  return (
    <div className="flex items-center gap-1.5">
      <span>{icon}</span>
      <span className="opacity-60">{name}</span>
      <span className="hr-display font-bold ml-auto">
        {base}
        {bonus > 0 && <span className="hr-text-gold ml-1">+{bonus}</span>}
      </span>
    </div>
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

function ChapterCard({
  chapter,
  save,
}: {
  chapter: typeof CHAPTERS[number];
  save: SaveData;
}) {
  const totalLevels = chapter.levels.length;
  const completed = chapter.levels.filter(l =>
    levelStars(save, chapter.id, l.id) > 0,
  ).length;
  const totalStars = chapter.levels.reduce(
    (a, l) => a + levelStars(save, chapter.id, l.id),
    0,
  );
  const maxStars = totalLevels * 3;
  const unlocked = isChapterUnlocked(chapter.id, save.progress) && chapter.levels.length > 0;

  if (!unlocked) {
    const hasContent = chapter.levels.length > 0;
    return (
      <div className="hr-panel p-4 opacity-50">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🔒</div>
          <div className="flex-1">
            <div className="hr-display font-bold">第{chapter.id}章 · {chapter.name}</div>
            <div className="text-xs opacity-70 mt-0.5">{chapter.desc}</div>
            <div className="text-[10px] opacity-50 mt-1">
              {hasContent ? `— 通关上一章解锁 —` : `— 敬请期待 —`}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-panel p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl">{chapter.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="hr-display font-bold">第{chapter.id}章 · {chapter.name}</div>
          <div className="text-xs opacity-60 mt-0.5 truncate">{chapter.desc}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] opacity-60">通关</div>
          <div className="hr-display font-bold">{completed}/{totalLevels}</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {chapter.levels.map((lvl, idx) => {
          const stars = levelStars(save, chapter.id, lvl.id);
          const unlocked = isLevelUnlocked(save, chapter.id, idx);
          if (!unlocked) {
            return (
              <div key={lvl.id} className="hr-level-card locked text-center">
                <div className="text-xl opacity-30">🔒</div>
                <div className="text-[10px] mt-1 opacity-50">{lvl.id}</div>
              </div>
            );
          }
          return (
            <Link
              key={lvl.id}
              href={`/heroes/battle/${chapter.id}/${lvl.id}`}
              className="hr-level-card text-center no-underline"
            >
              <div className="hr-display text-base font-bold">{lvl.id}</div>
              <div className="text-[9px] opacity-70 mt-0.5 leading-tight line-clamp-1">{lvl.name}</div>
              <div className="mt-1.5">
                <Stars filled={stars} size="sm" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="hr-divider" />
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <Stars filled={Math.round((totalStars / maxStars) * 3)} size="sm" />
          <span className="opacity-60 ml-1">{totalStars} / {maxStars}</span>
        </div>
      </div>
    </div>
  );
}
