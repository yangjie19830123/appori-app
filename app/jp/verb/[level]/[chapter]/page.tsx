// app/jp/verb/[level]/[chapter]/page.tsx
//
// Chapter content page (e.g. /jp/verb/n5/ch1)
// Shows all verbs in a chapter as clickable cards.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getChapterDetail } from "../../lib/data";
import { LEVEL_LABEL, VERB_TYPE_LABEL, type JLPTLevel } from "../../lib/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const AVAILABLE_LEVELS: JLPTLevel[] = ["N5"];

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ level: string; chapter: string }>;
}) {
  const { level: levelParam, chapter: chapterParam } = await params;
  const level = levelParam.toUpperCase() as JLPTLevel;

  // Parse chapter from "ch1", "ch2" etc.
  const chapterMatch = chapterParam.match(/^ch(\d+)$/i);
  if (!chapterMatch) notFound();
  const chapter = parseInt(chapterMatch[1], 10);

  if (!AVAILABLE_LEVELS.includes(level)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { verbs, progressMap, chapter_title } = await getChapterDetail(level, chapter);
  if (verbs.length === 0) notFound();

  const masteredCount = verbs.filter((v) => progressMap.get(v.id)?.status === "mastered").length;
  const learningCount = verbs.filter((v) => progressMap.get(v.id)?.status === "learning").length;

  const label = LEVEL_LABEL[level];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* ─── Breadcrumb ─── */}
      <header className="mb-6 v-fade-in">
        <div className="flex items-center gap-1 text-xs text-[var(--v-ink-muted)] mb-3">
          <Link href="/jp/verb" className="hover:text-[var(--v-accent)] transition">
            動詞マスター
          </Link>
          <span className="text-[var(--v-ink-faint)]">/</span>
          <Link
            href={`/jp/verb/${level.toLowerCase()}`}
            className="hover:text-[var(--v-accent)] transition"
          >
            {label.en} {label.ja}
          </Link>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-[var(--v-accent)] tracking-wider mb-1">
              第{chapter}章
            </div>
            <h1 className="v-display text-3xl sm:text-4xl text-[var(--v-ink)] mb-1">
              {chapter_title}
            </h1>
            <p className="text-sm text-[var(--v-ink-muted)]">
              {verbs.length} 動詞
              {user && masteredCount > 0 && (
                <span className="ml-2 text-[var(--v-success)] font-semibold">
                  · {masteredCount} 習得済
                </span>
              )}
              {user && learningCount > 0 && (
                <span className="ml-2 text-[var(--v-accent)] font-semibold">
                  · {learningCount} 学習中
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* ─── Verb cards grid ─── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {verbs.map((v, i) => {
            const p = progressMap.get(v.id);
            const status = p?.status ?? "new";
            const typeLabel = VERB_TYPE_LABEL[v.verb_type];

            return (
              <Link
                key={v.id}
                href={`/jp/verb/${level.toLowerCase()}/ch${chapter}/${v.romaji.replace(/\s+/g, "_")}`}
                className="block v-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="bg-[var(--v-surface)] rounded-2xl border border-[var(--v-border)] v-card-lift overflow-hidden">
                  <div className="p-4 flex items-start gap-3">
                    {/* Status indicator (left bar) */}
                    <div
                      className="w-1 self-stretch rounded-full flex-shrink-0"
                      style={{
                        background:
                          status === "mastered"
                            ? "var(--v-success)"
                            : status === "learning"
                            ? "var(--v-accent)"
                            : "var(--v-border-soft)",
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      {/* Kanji + kana */}
                      <div className="mb-1.5">
                        <div className="v-display text-2xl text-[var(--v-ink)] leading-tight">
                          {v.kanji}
                        </div>
                        <div className="text-xs text-[var(--v-ink-muted)] mt-0.5">
                          {v.kana}
                        </div>
                      </div>

                      {/* Meaning */}
                      <div className="text-sm text-[var(--v-ink)] mb-2 truncate">
                        {v.meaning_zh}
                      </div>

                      {/* Type badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            color: typeLabel.color,
                            borderColor: typeLabel.color + "60",
                            backgroundColor: typeLabel.color + "15",
                          }}
                        >
                          {typeLabel.ja}
                        </span>
                        {status === "mastered" && (
                          <span className="text-[var(--v-success)] text-xs font-bold">✓ 習得</span>
                        )}
                        {status === "learning" && (
                          <span className="text-[var(--v-accent)] text-xs font-bold">◐ 学習中</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Tip ─── */}
      <footer className="mt-8 text-center">
        <div className="inline-block bg-[var(--v-accent-soft)] rounded-xl px-4 py-2 text-xs text-[var(--v-accent-dark)]">
          💡 動詞をクリックして学習を始めよう
        </div>
      </footer>
    </div>
  );
}
