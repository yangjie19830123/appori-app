// app/jp/verb/[level]/[chapter]/[verb]/page.tsx
//
// Single verb detail page with 4 tabs:
// 予習 (preview), 学習 (learn), テスト (test), 復習 (review)
//
// Server component: fetches verb data + user progress, then renders
// the VerbDetailTabs client component which handles tab switching & audio.

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getVerbById, getUserProgressMap } from "../../../lib/data";
import { type JLPTLevel, LEVEL_LABEL } from "../../../lib/types";
import VerbDetailTabs from "./VerbDetailTabs";

export const dynamic = "force-dynamic";

const AVAILABLE_LEVELS: JLPTLevel[] = ["N5"];

export default async function VerbDetailPage({
  params,
}: {
  params: Promise<{ level: string; chapter: string; verb: string }>;
}) {
  const { level: levelParam, chapter: chapterParam, verb: verbParam } = await params;
  const level = levelParam.toUpperCase() as JLPTLevel;

  if (!AVAILABLE_LEVELS.includes(level)) notFound();

  const chapterMatch = chapterParam.match(/^ch(\d+)$/i);
  if (!chapterMatch) notFound();
  const chapter = parseInt(chapterMatch[1], 10);

  // verb id format: "n5_iku", "n5_taberu", etc.
  const verbId = `${level.toLowerCase()}_${verbParam}`;
  const verb = await getVerbById(verbId);
  if (!verb || verb.chapter !== chapter) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const progressMap = user ? await getUserProgressMap([verbId]) : new Map();
  const progress = progressMap.get(verbId) ?? null;

  const levelLabel = LEVEL_LABEL[level];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* ─── Breadcrumb ─── */}
      <header className="mb-5 v-fade-in">
        <div className="flex items-center gap-1 text-xs text-[var(--v-ink-muted)] flex-wrap">
          <Link href="/jp/verb" className="hover:text-[var(--v-accent)] transition">
            動詞マスター
          </Link>
          <span className="text-[var(--v-ink-faint)]">/</span>
          <Link
            href={`/jp/verb/${level.toLowerCase()}`}
            className="hover:text-[var(--v-accent)] transition"
          >
            {levelLabel.en} {levelLabel.ja}
          </Link>
          <span className="text-[var(--v-ink-faint)]">/</span>
          <Link
            href={`/jp/verb/${level.toLowerCase()}/ch${chapter}`}
            className="hover:text-[var(--v-accent)] transition"
          >
            第{chapter}章 {verb.chapter_title}
          </Link>
        </div>
      </header>

      {/* The tab UI is interactive → client component */}
      <VerbDetailTabs verb={verb} progress={progress} isLoggedIn={!!user} />
    </div>
  );
}
