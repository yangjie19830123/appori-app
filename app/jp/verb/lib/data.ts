// app/jp/verb/lib/data.ts
// Server-side data access. Used by Server Components.

import { createClient } from "@/lib/supabase/server";
import type {
  Verb,
  UserVerbProgress,
  ChapterSummary,
  LevelSummary,
  JLPTLevel,
  ProgressStatus,
} from "./types";

// Phase 1: only N5 is available. Future phases will expand.
const AVAILABLE_LEVELS: JLPTLevel[] = ["N5"];
const ALL_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2"];

/**
 * Fetch all verbs for a given level, ordered by chapter then display_order.
 */
export async function getVerbsByLevel(level: JLPTLevel): Promise<Verb[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("verbs")
    .select("*")
    .eq("level", level)
    .order("chapter", { ascending: true })
    .order("display_order", { ascending: true });
  if (error) {
    console.error("[getVerbsByLevel]", error);
    return [];
  }
  return (data ?? []) as Verb[];
}

/**
 * Fetch a single verb by id.
 */
export async function getVerbById(id: string): Promise<Verb | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("verbs")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("[getVerbById]", error);
    return null;
  }
  return data as Verb;
}

/**
 * Fetch the current user's progress for all verbs (or filtered by verb_ids).
 * Returns a Map<verb_id, UserVerbProgress> for quick lookup.
 */
export async function getUserProgressMap(
  verbIds?: string[]
): Promise<Map<string, UserVerbProgress>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Map();

  let query = supabase
    .from("user_verb_progress")
    .select("*")
    .eq("user_id", user.id);
  if (verbIds && verbIds.length > 0) {
    query = query.in("verb_id", verbIds);
  }
  const { data, error } = await query;
  if (error) {
    console.error("[getUserProgressMap]", error);
    return new Map();
  }

  const map = new Map<string, UserVerbProgress>();
  for (const row of (data ?? []) as UserVerbProgress[]) {
    map.set(row.verb_id, row);
  }
  return map;
}

/**
 * Build a complete summary for all levels (N5, N4, N3, N2),
 * including chapter-level breakdowns and user progress counts.
 */
export async function getAllLevelSummaries(): Promise<LevelSummary[]> {
  const summaries: LevelSummary[] = [];

  for (const level of ALL_LEVELS) {
    const available = AVAILABLE_LEVELS.includes(level);
    if (!available) {
      summaries.push({
        level,
        total_verbs: 0,
        mastered_count: 0,
        chapters: [],
        available: false,
      });
      continue;
    }

    const verbs = await getVerbsByLevel(level);
    const verbIds = verbs.map((v) => v.id);
    const progressMap = await getUserProgressMap(verbIds);

    // Group by chapter
    const byChapter = new Map<number, Verb[]>();
    for (const v of verbs) {
      if (!byChapter.has(v.chapter)) byChapter.set(v.chapter, []);
      byChapter.get(v.chapter)!.push(v);
    }

    const chapters: ChapterSummary[] = [];
    let totalMastered = 0;
    for (const [chapNum, chapVerbs] of Array.from(byChapter.entries()).sort(
      (a, b) => a[0] - b[0]
    )) {
      let mastered = 0;
      let learning = 0;
      let newCount = 0;
      for (const v of chapVerbs) {
        const p = progressMap.get(v.id);
        if (!p || p.status === "new") newCount++;
        else if (p.status === "learning") learning++;
        else if (p.status === "mastered") mastered++;
      }
      totalMastered += mastered;
      chapters.push({
        level,
        chapter: chapNum,
        chapter_title: chapVerbs[0]?.chapter_title ?? `第${chapNum}章`,
        total_verbs: chapVerbs.length,
        mastered_count: mastered,
        learning_count: learning,
        new_count: newCount,
      });
    }

    summaries.push({
      level,
      total_verbs: verbs.length,
      mastered_count: totalMastered,
      chapters,
      available: true,
    });
  }

  return summaries;
}

/**
 * Fetch verbs and progress for a specific chapter.
 */
export async function getChapterDetail(
  level: JLPTLevel,
  chapter: number
): Promise<{
  verbs: Verb[];
  progressMap: Map<string, UserVerbProgress>;
  chapter_title: string;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("verbs")
    .select("*")
    .eq("level", level)
    .eq("chapter", chapter)
    .order("display_order", { ascending: true });
  if (error || !data) {
    console.error("[getChapterDetail]", error);
    return { verbs: [], progressMap: new Map(), chapter_title: "" };
  }
  const verbs = data as Verb[];
  const verbIds = verbs.map((v) => v.id);
  const progressMap = await getUserProgressMap(verbIds);
  return {
    verbs,
    progressMap,
    chapter_title: verbs[0]?.chapter_title ?? `第${chapter}章`,
  };
}
