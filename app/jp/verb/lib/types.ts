// app/jp/verb/lib/types.ts
// Shared types for the verb learning tool

export type VerbType = "ichidan" | "godan" | "irregular";
export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type ProgressStatus = "new" | "learning" | "mastered";

export type ExampleSentence = {
  ja: string;
  kana?: string;
  zh: string;
};

// Matches the `verbs` table in Supabase
export type Verb = {
  id: string;
  kanji: string;
  kana: string;
  romaji: string;
  meaning_zh: string;
  meaning_en: string | null;
  verb_type: VerbType;
  level: JLPTLevel;
  chapter: number;
  chapter_title: string | null;
  form_masu: string;
  form_te: string;
  form_ta: string;
  form_nai: string;
  form_potential: string | null;
  form_passive: string | null;
  form_causative: string | null;
  form_volitional: string | null;
  form_imperative: string | null;
  form_conditional: string | null;
  examples: ExampleSentence[];
  notes_zh: string | null;
  display_order: number;
};

// Matches the `user_verb_progress` table
export type UserVerbProgress = {
  user_id: string;
  verb_id: string;
  status: ProgressStatus;
  preview_count: number;
  study_count: number;
  test_correct: number;
  test_wrong: number;
  last_studied_at: string | null;
  next_review_at: string | null;
  created_at: string;
  updated_at: string;
};

// Aggregated view for chapter list
export type ChapterSummary = {
  level: JLPTLevel;
  chapter: number;
  chapter_title: string;
  total_verbs: number;
  mastered_count: number;
  learning_count: number;
  new_count: number;
};

// Level-level summary
export type LevelSummary = {
  level: JLPTLevel;
  total_verbs: number;
  mastered_count: number;
  chapters: ChapterSummary[];
  available: boolean; // false for N4/N3/N2/N1 in MVP
};

// Label mappings (for UI)
export const VERB_TYPE_LABEL: Record<VerbType, { ja: string; zh: string; color: string }> = {
  ichidan: { ja: "一段動詞", zh: "一段动词", color: "#22C55E" },
  godan: { ja: "五段動詞", zh: "五段动词", color: "#3B82F6" },
  irregular: { ja: "不規則動詞", zh: "不规则动词", color: "#F59E0B" },
};

export const LEVEL_LABEL: Record<JLPTLevel, { en: string; ja: string; zh: string }> = {
  N5: { en: "N5", ja: "入門", zh: "入门" },
  N4: { en: "N4", ja: "初級", zh: "初级" },
  N3: { en: "N3", ja: "中級", zh: "中级" },
  N2: { en: "N2", ja: "中上級", zh: "中上级" },
  N1: { en: "N1", ja: "上級", zh: "高级" },
};

export const STATUS_LABEL: Record<ProgressStatus, { ja: string; emoji: string }> = {
  new: { ja: "未学習", emoji: "○" },
  learning: { ja: "学習中", emoji: "◐" },
  mastered: { ja: "習得済", emoji: "●" },
};
