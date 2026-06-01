// app/jp/verb/[level]/page.tsx
//
// JLPT level detail page (e.g. /jp/verb/n5)
// Shows all chapters within a level as large cards.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getVerbsByLevel, getUserProgressMap } from "../lib/data";
import { LEVEL_LABEL, type JLPTLevel } from "../lib/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const AVAILABLE_LEVELS: JLPTLevel[] = ["N5"];

export default async function LevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level: levelParam } = await params;
  const level = levelParam.toUpperCase() as JLPTLevel;

  // Only N5 available in MVP
  if (!AVAILABLE_LEVELS.includes(level)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const verbs = await getVerbsByLevel(level);
  const progressMap = user
    ? await getUserProgressMap(verbs.map((v) => v.id))
    : new Map();

  // Group by chapter
  type ChapterGroup = {
    chapter: number;
    title: string;
    verbs: typeof verbs;
    mastered: number;
    learning: number;
  };
  const byChapter = new Map<number, ChapterGroup>();
  for (const v of verbs) {
    if (!byChapter.has(v.chapter)) {
      byChapter.set(v.chapter, {
        chapter: v.chapter,
        title: v.chapter_title ?? `第${v.chapter}章`,
        verbs: [],
        mastered: 0,
        learning: 0,
      });
    }
    const g = byChapter.get(v.chapter)!;
    g.verbs.push(v);
    const p = progressMap.get(v.id);
    if (p?.status === "mastered") g.mastered++;
    else if (p?.status === "learning") g.learning++;
  }
  const chapters = Array.from(byChapter.values()).sort((a, b) => a.chapter - b.chapter);

  const totalMastered = chapters.reduce((sum, c) => sum + c.mastered, 0);
  const totalVerbs = verbs.length;
  const overallPercent = totalVerbs > 0 ? (totalMastered / totalVerbs) * 100 : 0;

  const label = LEVEL_LABEL[level];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* ─── Breadcrumb / back nav ─── */}
      <header className="mb-6 v-fade-in">
        <Link
          href="/jp/verb"
          className="text-xs text-[var(--v-ink-muted)] hover:text-[var(--v-accent)] transition inline-flex items-center gap-1"
        >
          ← 動詞マスター
        </Link>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-3 mb-1">
              <span className="v-display text-4xl sm:text-5xl text-[var(--v-accent)]">{label.en}</span>
              <span className="text-lg font-semibold text-[var(--v-ink)]">{label.ja}</span>
            </div>
            <p className="text-sm text-[var(--v-ink-muted)]">
              {chapters.length} 章 · {totalVerbs} 動詞
            </p>
          </div>
          {user && (
            <div className="text-right flex-shrink-0">
              <div className="text-[10px] font-bold text-[var(--v-ink-faint)] tracking-wider uppercase mb-0.5">
                Progress
              </div>
              <div className="text-2xl font-extrabold text-[var(--v-accent)]">
                {totalMastered}<span className="text-sm text-[var(--v-ink-muted)] font-normal">/{totalVerbs}</span>
              </div>
            </div>
          )}
        </div>
        {/* Overall progress bar */}
        {user && (
          <div className="mt-4 h-2 bg-[var(--v-border-soft)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--v-accent-light)] to-[var(--v-accent)] transition-all"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        )}
      </header>

      {/* ─── Chapter cards ─── */}
      <section>
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-[var(--v-ink-faint)] uppercase mb-3">
          📚 Chapters
        </h2>
        <div className="space-y-3">
          {chapters.map((c, i) => {
            const percent = c.verbs.length > 0 ? (c.mastered / c.verbs.length) * 100 : 0;
            const isDone = c.mastered === c.verbs.length && c.verbs.length > 0;
            return (
              <Link
                key={c.chapter}
                href={`/jp/verb/${level.toLowerCase()}/ch${c.chapter}`}
                className="block"
              >
                <div
                  className="bg-[var(--v-surface)] rounded-2xl border border-[var(--v-border)] v-card-lift overflow-hidden v-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-bold text-[var(--v-accent)] tracking-wider">
                            第{c.chapter}章
                          </span>
                          {isDone && (
                            <span className="text-[10px] font-bold text-[var(--v-success)] bg-[var(--v-success-light)] px-2 py-0.5 rounded-full">
                              ✓ 完了
                            </span>
                          )}
                        </div>
                        <h3 className="v-display text-2xl text-[var(--v-ink)] mb-1">
                          {c.title}
                        </h3>
                        <div className="text-xs text-[var(--v-ink-muted)] flex items-center gap-3">
                          <span>{c.verbs.length} 動詞</span>
                          {user && (
                            <>
                              {c.mastered > 0 && (
                                <span className="text-[var(--v-success)]">
                                  ● {c.mastered} 習得
                                </span>
                              )}
                              {c.learning > 0 && (
                                <span className="text-[var(--v-accent)]">
                                  ◐ {c.learning} 学習中
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <ProgressRing percent={percent} size={48} />
                    </div>

                    {/* Verb preview row - first 6 verbs */}
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[var(--v-border-soft)]">
                      {c.verbs.slice(0, 6).map((v) => {
                        const p = progressMap.get(v.id);
                        const status = p?.status ?? "new";
                        return (
                          <span
                            key={v.id}
                            className={`v-display text-xs px-2 py-1 rounded-md border ${
                              status === "mastered"
                                ? "bg-[var(--v-success-light)] text-[var(--v-success)] border-[var(--v-success)]/30"
                                : status === "learning"
                                ? "bg-[var(--v-accent-soft)] text-[var(--v-accent-dark)] border-[var(--v-accent)]/30"
                                : "bg-white text-[var(--v-ink-muted)] border-[var(--v-border-soft)]"
                            }`}
                          >
                            {v.kanji}
                          </span>
                        );
                      })}
                      {c.verbs.length > 6 && (
                        <span className="text-xs px-2 py-1 text-[var(--v-ink-faint)] font-semibold">
                          +{c.verbs.length - 6}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="mt-10 text-center text-[10px] text-[var(--v-ink-faint)]">
        全章節完了で N5レベル習得 🎓
      </footer>
    </div>
  );
}

// Progress ring SVG
function ProgressRing({ percent, size }: { percent: number; size: number }) {
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} className="v-ring-track" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        className="v-ring-progress"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        className="font-bold"
        fontSize={12}
        fill="var(--v-accent)"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}
