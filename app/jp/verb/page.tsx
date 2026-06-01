// app/jp/verb/page.tsx
import Link from "next/link";
import { getAllLevelSummaries } from "./lib/data";
import { LEVEL_LABEL } from "./lib/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic"; // always fresh user progress

export default async function VerbHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const summaries = await getAllLevelSummaries();

  const n5 = summaries.find((s) => s.level === "N5");
  const totalMastered = summaries.reduce((sum, s) => sum + s.mastered_count, 0);
  const totalVerbs = summaries.reduce((sum, s) => sum + s.total_verbs, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

      {/* ─── Header ─── */}
      <header className="mb-8 sm:mb-10 v-fade-in">
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="text-xs text-[var(--v-ink-muted)] hover:text-[var(--v-accent)] transition">
            ← Appori
          </Link>
          {user ? (
            <div className="text-[10px] text-[var(--v-ink-muted)]">
              {user.email}
            </div>
          ) : (
            <Link
              href="/jp/verb/login"
              className="text-xs text-[var(--v-accent)] hover:text-[var(--v-accent-dark)] font-semibold transition"
            >
              ログイン →
            </Link>
          )}
        </div>
        <h1 className="v-display text-3xl sm:text-5xl text-[var(--v-ink)] mb-2 flex items-baseline gap-3">
          動詞マスター
          <span className="text-base sm:text-xl text-[var(--v-accent)]">🇯🇵</span>
        </h1>
        <p className="text-sm sm:text-base text-[var(--v-ink-muted)]">
          JLPT動詞を楽しく学ぼう · 予習・学習・テスト・復習
        </p>
      </header>

      {/* ─── Overall stats card ─── */}
      {user && totalVerbs > 0 && (
        <div className="bg-[var(--v-surface)] rounded-2xl p-5 mb-6 border border-[var(--v-border)] v-fade-in" style={{animationDelay: "50ms"}}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-[var(--v-ink-faint)] tracking-wider uppercase mb-1">
                Total Progress
              </div>
              <div className="text-2xl font-extrabold text-[var(--v-ink)]">
                {totalMastered} <span className="text-base text-[var(--v-ink-muted)] font-normal">/ {totalVerbs} 動詞</span>
              </div>
            </div>
            <ProgressRing percent={totalVerbs > 0 ? (totalMastered / totalVerbs) * 100 : 0} size={64} />
          </div>
        </div>
      )}

      {/* ─── Login prompt for guests ─── */}
      {!user && (
        <div className="bg-gradient-to-br from-[var(--v-accent-soft)] to-[var(--v-accent-light)] rounded-2xl p-5 mb-6 border border-[var(--v-accent)]/30 v-fade-in" style={{animationDelay: "50ms"}}>
          <div className="text-sm font-bold text-[var(--v-ink)] mb-1">
            🔓 ログインして進捗を保存
          </div>
          <p className="text-xs text-[var(--v-ink-muted)] mb-3">
            学習進捗・テスト結果がデバイス間で同期されます
          </p>
          <Link
            href="/jp/verb/login"
            className="inline-block px-4 py-2 rounded-lg bg-[var(--v-accent)] text-white text-sm font-bold hover:bg-[var(--v-accent-dark)] transition shadow-sm"
          >
            ログインする →
          </Link>
        </div>
      )}

      {/* ─── Level cards ─── */}
      <section>
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-[var(--v-ink-faint)] uppercase mb-3">
          📚 Learning Levels
        </h2>
        <div className="space-y-3">
          {summaries.map((s, i) => {
            const label = LEVEL_LABEL[s.level];
            const percent = s.total_verbs > 0 ? (s.mastered_count / s.total_verbs) * 100 : 0;
            const isAvailable = s.available;
            const cardContent = (
              <div
                className={`bg-[var(--v-surface)] rounded-2xl border ${
                  isAvailable ? "border-[var(--v-border)] v-card-lift cursor-pointer" : "border-[var(--v-border-soft)] opacity-60"
                } overflow-hidden v-fade-in`}
                style={{ animationDelay: `${100 + i * 60}ms` }}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="v-display text-2xl sm:text-3xl text-[var(--v-accent)]">{label.en}</span>
                        <span className="text-sm font-semibold text-[var(--v-ink)]">{label.ja}</span>
                        {!isAvailable && (
                          <span className="text-[10px] font-bold text-[var(--v-ink-faint)] bg-[var(--v-border-soft)] px-2 py-0.5 rounded-full ml-1">
                            準備中
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--v-ink-muted)]">
                        {isAvailable ? (
                          <>
                            {s.chapters.length} 章 · {s.total_verbs} 動詞
                            {user && (
                              <span className="ml-2 text-[var(--v-accent)] font-semibold">
                                {s.mastered_count}/{s.total_verbs} 習得
                              </span>
                            )}
                          </>
                        ) : (
                          "Coming soon"
                        )}
                      </div>
                    </div>
                    {isAvailable && user && (
                      <ProgressRing percent={percent} size={44} />
                    )}
                  </div>

                  {/* Progress bar for available levels (when logged in) */}
                  {isAvailable && user && (
                    <div className="h-1.5 bg-[var(--v-border-soft)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--v-accent-light)] to-[var(--v-accent)] transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}

                  {/* Chapter pills (only N5 for now, when available + has chapters) */}
                  {isAvailable && s.chapters.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.chapters.map((c) => {
                        const chapDone = c.total_verbs > 0 && c.mastered_count === c.total_verbs;
                        return (
                          <span
                            key={c.chapter}
                            className={`text-[10px] px-2 py-1 rounded-full font-semibold border ${
                              chapDone
                                ? "bg-[var(--v-success-light)] text-[var(--v-success)] border-[var(--v-success)]/30"
                                : c.mastered_count > 0
                                ? "bg-[var(--v-accent-soft)] text-[var(--v-accent-dark)] border-[var(--v-accent)]/30"
                                : "bg-white text-[var(--v-ink-muted)] border-[var(--v-border-soft)]"
                            }`}
                          >
                            {chapDone && "✓ "}
                            第{c.chapter}章 · {c.chapter_title}
                            <span className="ml-1 opacity-70">
                              {c.mastered_count}/{c.total_verbs}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );

            if (isAvailable) {
              return (
                <Link key={s.level} href={`/jp/verb/${s.level.toLowerCase()}`} className="block">
                  {cardContent}
                </Link>
              );
            }
            return <div key={s.level}>{cardContent}</div>;
          })}
        </div>
      </section>

      {/* ─── Footer hint ─── */}
      <footer className="mt-10 text-center text-[10px] text-[var(--v-ink-faint)]">
        N5から始めて、N2までの500+動詞を制覇しよう 🚀
      </footer>
    </div>
  );
}

// Inline progress ring component
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
        fontSize={size > 50 ? 14 : 11}
        fill="var(--v-accent)"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}
