// app/jp/verb/[level]/[chapter]/[verb]/VerbDetailTabs.tsx
//
// Interactive tabs for a single verb's study experience.
// Tabs: 予習 (preview) / 学習 (learn) / テスト (test) / 復習 (review).
// MVP includes 予習 + 学習 fully; テスト + 復習 show "Coming soon" placeholders.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useSpeech } from "../../../lib/useSpeech";
import {
  type Verb,
  type UserVerbProgress,
  type VerbType,
  VERB_TYPE_LABEL,
  STATUS_LABEL,
} from "../../../lib/types";

type TabKey = "preview" | "learn" | "test" | "review";

const TABS: { key: TabKey; ja: string; emoji: string }[] = [
  { key: "preview", ja: "予習", emoji: "📖" },
  { key: "learn", ja: "学習", emoji: "📝" },
  { key: "test", ja: "テスト", emoji: "🎯" },
  { key: "review", ja: "復習", emoji: "🔁" },
];

export default function VerbDetailTabs({
  verb,
  progress,
  isLoggedIn,
}: {
  verb: Verb;
  progress: UserVerbProgress | null;
  isLoggedIn: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("preview");
  const speech = useSpeech();

  const status = progress?.status ?? "new";
  const typeLabel = VERB_TYPE_LABEL[verb.verb_type];
  const statusLabel = STATUS_LABEL[status];

  return (
    <>
      {/* ─── Verb header card ─── */}
      <div className="bg-[var(--v-surface)] rounded-2xl border border-[var(--v-border)] p-5 sm:p-6 mb-4 v-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="v-display text-4xl sm:text-5xl text-[var(--v-ink)] mb-2 leading-tight">
              {verb.kanji}
            </div>
            <div className="text-sm text-[var(--v-ink-muted)] mb-1">
              <span className="font-semibold">{verb.kana}</span>
              <span className="text-[var(--v-ink-faint)] mx-2">·</span>
              <span className="italic">{verb.romaji}</span>
            </div>
            <div className="text-base text-[var(--v-ink)] font-medium">
              {verb.meaning_zh}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--v-accent-soft)] text-[var(--v-accent-dark)] border border-[var(--v-accent)]/30">
                {verb.level}
              </span>
              {isLoggedIn && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--v-border-soft)] text-[var(--v-ink-muted)] border border-[var(--v-border-soft)]">
                  {statusLabel.emoji} {statusLabel.ja}
                </span>
              )}
            </div>
          </div>

          {speech.supported && (
            <button
              onClick={() => speech.speak(verb.kanji)}
              className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--v-accent)] text-white text-lg shadow-sm hover:bg-[var(--v-accent-dark)] transition flex items-center justify-center"
              title={`${verb.kana} を読む`}
              aria-label="発音を聞く"
            >
              {speech.speaking ? "■" : "▶"}
            </button>
          )}
        </div>
      </div>

      {/* ─── Tab bar ─── */}
      <div className="bg-[var(--v-surface)] rounded-xl border border-[var(--v-border)] p-1 mb-4 flex gap-1 v-fade-in" style={{ animationDelay: "50ms" }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                active
                  ? "bg-[var(--v-accent)] text-white shadow-sm"
                  : "text-[var(--v-ink-muted)] hover:bg-[var(--v-accent-soft)] hover:text-[var(--v-accent-dark)]"
              }`}
            >
              <span className="hidden sm:inline">{t.emoji} </span>
              {t.ja}
            </button>
          );
        })}
      </div>

      {/* ─── Tab content ─── */}
      <div className="v-fade-in" style={{ animationDelay: "100ms" }}>
        {tab === "preview" && <PreviewTab verb={verb} speech={speech} onNext={() => setTab("learn")} />}
        {tab === "learn" && <LearnTab verb={verb} speech={speech} onNext={() => setTab("test")} />}
        {tab === "test" && <ComingSoonTab emoji="🎯" title="テスト" subtitle="次のステップで実装予定" />}
        {tab === "review" && <ComingSoonTab emoji="🔁" title="復習" subtitle="次のステップで実装予定" />}
      </div>
    </>
  );
}

// ─── 予習 Tab ──────────────────────────────────────────────
function PreviewTab({
  verb,
  speech,
  onNext,
}: {
  verb: Verb;
  speech: ReturnType<typeof useSpeech>;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-[var(--v-surface)] rounded-2xl border border-[var(--v-border)] p-5">
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-[var(--v-ink-faint)] uppercase mb-3">
          📖 この動詞について
        </h2>

        <InfoRow label="意味" value={<span className="text-base font-medium">{verb.meaning_zh}</span>} />
        <InfoRow
          label="読み方"
          value={
            <span className="inline-flex items-center gap-2">
              <span className="v-display text-base text-[var(--v-ink)]">{verb.kana}</span>
              {speech.supported && (
                <button
                  onClick={() => speech.speak(verb.kanji)}
                  className="text-[var(--v-accent)] hover:text-[var(--v-accent-dark)] transition text-base"
                  title={`${verb.kana} を読む`}
                >
                  🔊
                </button>
              )}
            </span>
          }
        />
        <InfoRow label="ローマ字" value={<span className="italic text-[var(--v-ink-muted)]">{verb.romaji}</span>} />
        <InfoRow
          label="タイプ"
          value={
            <span className="font-semibold" style={{ color: VERB_TYPE_LABEL[verb.verb_type].color }}>
              {VERB_TYPE_LABEL[verb.verb_type].ja}
            </span>
          }
        />
      </div>

      {/* Type explanation card */}
      <div className="bg-[var(--v-accent-soft)] rounded-2xl border border-[var(--v-accent)]/30 p-5">
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-[var(--v-accent-dark)] uppercase mb-3">
          💡 タイプの特徴
        </h2>
        <p className="text-sm text-[var(--v-ink)] leading-relaxed">
          {getTypeExplanation(verb.verb_type, verb.kanji, verb.kana)}
        </p>
      </div>

      {/* Notes card if exists */}
      {verb.notes_zh && (
        <div className="bg-[var(--v-surface)] rounded-2xl border border-[var(--v-border)] p-5">
          <h2 className="text-[11px] font-bold tracking-[0.15em] text-[var(--v-ink-faint)] uppercase mb-3">
            📌 ポイント
          </h2>
          <p className="text-sm text-[var(--v-ink)] leading-relaxed">{verb.notes_zh}</p>
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full py-3.5 rounded-xl bg-[var(--v-accent)] text-white font-bold text-sm hover:bg-[var(--v-accent-dark)] transition shadow-sm"
      >
        学習を始める →
      </button>
    </div>
  );
}

// Type-specific explanation generator
function getTypeExplanation(type: VerbType, kanji: string, kana: string): string {
  const lastKana = kana.slice(-1);
  if (type === "ichidan") {
    return `「${kanji}」は一段動詞です。基本形が「る」で終わり、その前が「い段」または「え段」の文字です(例: 「べ」「き」)。変化は簡単 - 「る」を取って後ろに付け足すだけ。例: ${kana} → ${kana.slice(0, -1)}ます`;
  }
  if (type === "godan") {
    return `「${kanji}」は五段動詞です。基本形は「う段」(${lastKana} など)で終わります。変化のとき、最後の文字を別の段に変えます。例: ${kana} → ${kana.slice(0, -1)}${shiftToI(lastKana)}ます`;
  }
  if (type === "irregular") {
    if (kanji.includes("する") || kanji === "する") {
      return `「${kanji}」は「する」型の不規則動詞です。「する」の部分が変化します。例: ${kanji} → ${kanji.replace(/する$/, "")}します`;
    }
    if (kanji === "来る" || kana === "くる") {
      return `「来る」は不規則動詞です。読み方も変わります。来る(くる) → 来ます(きます) → 来ない(こない)`;
    }
    return `「${kanji}」は不規則動詞です。特別な変化パターンを覚えましょう。`;
  }
  return "";
}

// Helper: shift kana from う段 to い段
function shiftToI(kana: string): string {
  const map: Record<string, string> = {
    "う": "い", "く": "き", "ぐ": "ぎ", "す": "し", "つ": "ち",
    "ぬ": "に", "ぶ": "び", "む": "み", "る": "り",
  };
  return map[kana] ?? kana;
}

// ─── 学習 Tab ──────────────────────────────────────────────
function LearnTab({
  verb,
  speech,
  onNext,
}: {
  verb: Verb;
  speech: ReturnType<typeof useSpeech>;
  onNext: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Define basic vs advanced forms
  const basicForms: { label: string; value: string | null; note?: string }[] = [
    { label: "基本形", value: verb.kanji },
    { label: "ます形", value: verb.form_masu },
    { label: "て形", value: verb.form_te, note: verb.kanji === "行く" ? "例外" : undefined },
    { label: "た形", value: verb.form_ta },
    { label: "ない形", value: verb.form_nai },
  ];
  const advancedForms: { label: string; value: string | null }[] = [
    { label: "可能形", value: verb.form_potential },
    { label: "受身形", value: verb.form_passive },
    { label: "使役形", value: verb.form_causative },
    { label: "意向形", value: verb.form_volitional },
    { label: "命令形", value: verb.form_imperative },
    { label: "条件形", value: verb.form_conditional },
  ];

  return (
    <div className="space-y-4">
      {/* Conjugation table */}
      <div className="bg-[var(--v-surface)] rounded-2xl border border-[var(--v-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--v-border-soft)]">
          <h2 className="text-[11px] font-bold tracking-[0.15em] text-[var(--v-ink-faint)] uppercase">
            📝 変化形
          </h2>
        </div>
        <div className="divide-y divide-[var(--v-border-soft)]">
          {basicForms.map((f) => (
            <FormRow key={f.label} label={f.label} value={f.value} note={f.note} speech={speech} />
          ))}
          {showAdvanced && advancedForms.map((f) => (
            <FormRow key={f.label} label={f.label} value={f.value} speech={speech} />
          ))}
        </div>
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full py-2.5 text-xs font-bold text-[var(--v-accent)] hover:bg-[var(--v-accent-soft)] transition"
        >
          {showAdvanced ? "▲ 基本形のみ表示" : "▼ もっと見る (可能/受身/使役...)"}
        </button>
      </div>

      {/* Example sentences */}
      {verb.examples && verb.examples.length > 0 && (
        <div className="bg-[var(--v-surface)] rounded-2xl border border-[var(--v-border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--v-border-soft)]">
            <h2 className="text-[11px] font-bold tracking-[0.15em] text-[var(--v-ink-faint)] uppercase">
              📚 例文 ({verb.examples.length})
            </h2>
          </div>
          <div className="divide-y divide-[var(--v-border-soft)]">
            {verb.examples.map((ex, i) => (
              <div key={i} className="px-5 py-4 hover:bg-[var(--v-accent-soft)]/30 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="v-display text-base text-[var(--v-ink)] mb-1 leading-relaxed">
                      <span className="text-[var(--v-accent)] font-bold mr-2">{["①","②","③","④","⑤"][i] ?? `${i+1}.`}</span>
                      {ex.ja}
                    </div>
                    {ex.kana && (
                      <div className="text-xs text-[var(--v-ink-muted)] mb-1">
                        {ex.kana}
                      </div>
                    )}
                    <div className="text-sm text-[var(--v-ink-muted)]">{ex.zh}</div>
                  </div>
                  {speech.supported && (
                    <button
                      onClick={() => speech.speak(ex.ja)}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--v-accent-soft)] text-[var(--v-accent)] hover:bg-[var(--v-accent-light)] transition flex items-center justify-center"
                      title="例文を読む"
                    >
                      🔊
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes if exists */}
      {verb.notes_zh && (
        <div className="bg-[var(--v-accent-soft)] rounded-2xl border border-[var(--v-accent)]/30 p-5">
          <h2 className="text-[11px] font-bold tracking-[0.15em] text-[var(--v-accent-dark)] uppercase mb-2">
            💡 ポイント
          </h2>
          <p className="text-sm text-[var(--v-ink)] leading-relaxed">{verb.notes_zh}</p>
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full py-3.5 rounded-xl bg-[var(--v-accent)] text-white font-bold text-sm hover:bg-[var(--v-accent-dark)] transition shadow-sm"
      >
        テストに進む →
      </button>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 py-2 border-b border-[var(--v-border-soft)] last:border-b-0">
      <div className="text-xs font-bold text-[var(--v-ink-faint)] tracking-wider uppercase w-20 flex-shrink-0">
        {label}
      </div>
      <div className="flex-1 text-[var(--v-ink)]">{value}</div>
    </div>
  );
}

function FormRow({
  label,
  value,
  note,
  speech,
}: {
  label: string;
  value: string | null;
  note?: string;
  speech: ReturnType<typeof useSpeech>;
}) {
  if (!value) return null;
  return (
    <div className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--v-accent-soft)]/30 transition">
      <div className="text-xs font-bold text-[var(--v-ink-faint)] tracking-wider uppercase w-16 flex-shrink-0">
        {label}
      </div>
      <div className="flex-1 v-display text-lg text-[var(--v-ink)]">{value}</div>
      {note && (
        <span className="text-[10px] font-bold text-[var(--v-warning)] bg-yellow-100 px-2 py-0.5 rounded-full border border-yellow-300">
          ⚠️ {note}
        </span>
      )}
      {speech.supported && (
        <button
          onClick={() => speech.speak(value)}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--v-accent-soft)] text-[var(--v-accent)] hover:bg-[var(--v-accent-light)] transition flex items-center justify-center text-xs"
          title={`${value} を読む`}
        >
          🔊
        </button>
      )}
    </div>
  );
}

function ComingSoonTab({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="bg-[var(--v-surface)] rounded-2xl border border-[var(--v-border)] p-10 text-center">
      <div className="text-5xl mb-3">{emoji}</div>
      <h3 className="v-display text-xl text-[var(--v-ink)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--v-ink-muted)]">{subtitle}</p>
      <div className="mt-4 inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[var(--v-accent-soft)] text-[var(--v-accent-dark)]">
        Coming soon
      </div>
    </div>
  );
}
