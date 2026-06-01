"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSpeech } from "./lib/useSpeech";

interface Token {
  surface: string;
  reading: string;
  hasKanji: boolean;
  pos: string;
}

const EXAMPLES = [
  { label: "挨拶", text: "初めまして、私は田中太郎と申します。東京都に住んでいます。" },
  { label: "学校", text: "明日は運動会です。お弁当と水筒を持ってきてください。雨天時は延期します。" },
  { label: "通知", text: "国民健康保険料の納付期限は令和八年五月三十一日です。届出が必要な場合は区役所へお越しください。" },
  { label: "文学", text: "吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。" },
];

type InputMode = "image" | "paste";

// Split tokens into sentences using Japanese sentence terminators
function splitIntoSentences(tokens: Token[]): Token[][] {
  const sentences: Token[][] = [];
  let current: Token[] = [];
  for (const t of tokens) {
    current.push(t);
    if (/[。！？!?\n]/.test(t.surface)) {
      sentences.push(current);
      current = [];
    }
  }
  if (current.length > 0) sentences.push(current);
  return sentences;
}

// Convert tokens to text for TTS playback.
// IMPORTANT: We pass the ORIGINAL text (surface, with kanji) to the speech engine,
// not the pre-converted furigana. Modern TTS engines handle kanji correctly,
// and feeding them concatenated hiragana causes them to re-tokenize without
// word boundaries, producing wrong readings like れいわ + はちねん → れいわわちねん.
function tokensToReadable(tokens: Token[]): string {
  return tokens.map((t) => t.surface).join("");
}

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("image");
  const [input, setInput] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [hiragana, setHiragana] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"furigana" | "hiragana" | "side">("furigana");
  const [copied, setCopied] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Voice / TTS
  const speech = useSpeech();
  const [highlightSentence, setHighlightSentence] = useState<number | null>(null);
  const [highlightTokenIdx, setHighlightTokenIdx] = useState<number | null>(null);
  const [readingAllMode, setReadingAllMode] = useState(false);
  const readingAllCancelRef = useRef<boolean>(false);

  // Furigana editing
  const [editMode, setEditMode] = useState(false);
  const [editingTokenIdx, setEditingTokenIdx] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // File size warning (for image upload)
  const [sizeNotice, setSizeNotice] = useState<string>("");

  // Group tokens into sentences for sentence-level playback
  const sentences = useMemo(() => splitIntoSentences(tokens), [tokens]);

  // Paste listener for images
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) handleImageFile(file);
          return;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  // Compress an image File to keep it under maxSizeKB (default 900KB, safely below OCR.space 1MB limit).
  // Resizes (if too large) and progressively lowers JPEG quality until under the threshold.
  const compressImage = useCallback(
    async (file: File, maxSizeKB = 900): Promise<{ base64: string; mediaType: string; dataUrl: string }> => {
      // If already small enough, just use as-is
      if (file.size <= maxSizeKB * 1024) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = () => reject(r.error);
          r.readAsDataURL(file);
        });
        return { base64: dataUrl.split(",")[1], mediaType: file.type, dataUrl };
      }

      // Load into <img>
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new window.Image();
        const url = URL.createObjectURL(file);
        i.onload = () => {
          URL.revokeObjectURL(url);
          resolve(i);
        };
        i.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        i.src = url;
      });

      // Cap longer side to 2000px to keep OCR quality but reduce filesize
      const MAX_SIDE = 2000;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (Math.max(w, h) > MAX_SIDE) {
        const ratio = MAX_SIDE / Math.max(w, h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");
      ctx.drawImage(img, 0, 0, w, h);

      // Progressively lower JPEG quality until under threshold
      let quality = 0.9;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrl.length * 0.75 > maxSizeKB * 1024 && quality > 0.3) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      // If still too big at quality 0.3, shrink dimensions further
      if (dataUrl.length * 0.75 > maxSizeKB * 1024) {
        const shrinkRatio = 0.7;
        canvas.width = Math.round(w * shrinkRatio);
        canvas.height = Math.round(h * shrinkRatio);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      }

      return { base64: dataUrl.split(",")[1], mediaType: "image/jpeg", dataUrl };
    },
    []
  );

  // Format bytes to human readable
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;

      // Size validation: reject anything > 5MB
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const COMPRESS_THRESHOLD = 1 * 1024 * 1024; // 1MB
      const sizeStr = formatFileSize(file.size);

      if (file.size > MAX_FILE_SIZE) {
        setError(
          `画像サイズが大きすぎます (${sizeStr})。5MB以下の画像をアップロードしてください。`
        );
        setSizeNotice("");
        return;
      }

      // Show size notice if compression will happen
      if (file.size > COMPRESS_THRESHOLD) {
        setSizeNotice(`画像サイズ: ${sizeStr} - 自動圧縮します`);
      } else {
        setSizeNotice("");
      }

      (async () => {
        setError("");
        setOcrLoading(true);
        setInputMode("image");

        try {
          // Show a quick preview of the original (so user sees something immediately)
          const previewUrl = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = () => reject(r.error);
            r.readAsDataURL(file);
          });
          setImagePreview(previewUrl);

          // Compress if needed before sending to OCR
          const { base64, mediaType } = await compressImage(file, 900);

          const res = await fetch("/kanji/api/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64, media_type: mediaType }),
          });
          const data = await res.json();
          if (res.ok && data.text) {
            setInput(data.text);
            setSizeNotice(""); // clear notice on success
            await convertText(data.text);
          } else {
            setError(data.error || "テキスト認識に失敗しました");
          }
        } catch (err: any) {
          console.error("[ImageFile]", err);
          setError("画像処理に失敗しました: " + (err?.message || "不明なエラー"));
        } finally {
          setOcrLoading(false);
        }
      })();
    },
    [compressImage]
  );

  const convertText = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    setLoading(true);
    setError("");
    setTokens([]);
    setHiragana("");
    speech.stop();

    try {
      const res = await fetch("/kanji/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      const data = await res.json();
      if (res.ok) {
        setTokens(data.tokens ?? []);
        setHiragana(data.hiragana);
      } else {
        setError(data.error || "変換に失敗しました");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const convert = () => convertText(input);

  const copyResult = () => {
    let text = "";
    if (mode === "hiragana") {
      text = hiragana;
    } else {
      text = (tokens ?? []).map((t) => (t.hasKanji ? `${t.surface}(${t.reading})` : t.surface)).join("");
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    speech.stop();
    setReadingAllMode(false);
    setHighlightSentence(null);
    setHighlightTokenIdx(null);
    setEditMode(false);
    setEditingTokenIdx(null);
    setSizeNotice("");
    setInput("");
    setTokens([]);
    setHiragana("");
    setImagePreview(null);
    setError("");
  };

  // ── Furigana edit handlers ──────────────────────────────

  const startEditToken = (tokenIdx: number) => {
    speech.stop();
    setEditingTokenIdx(tokenIdx);
    setEditingValue(tokens[tokenIdx]?.reading ?? "");
    // Focus the input after render
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setEditingTokenIdx(null);
    setEditingValue("");
  };

  const saveEdit = () => {
    if (editingTokenIdx === null) return;
    const trimmed = editingValue.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    setTokens((prev) => {
      const next = [...prev];
      next[editingTokenIdx] = { ...next[editingTokenIdx], reading: trimmed };
      return next;
    });
    // Rebuild hiragana string from the updated tokens (with edit applied)
    setHiragana((prev) => {
      // Quick recompute: build from prev tokens with one swap
      const updated = tokens.map((t, i) =>
        i === editingTokenIdx ? trimmed : (t.hasKanji ? t.reading : t.surface)
      );
      return updated.join("");
    });
    cancelEdit();
  };

  // ── Voice playback handlers ─────────────────────────────

  const speakWord = (token: Token, tokenIdx: number) => {
    if (readingAllMode || editMode) return;
    speech.stop();
    setHighlightTokenIdx(tokenIdx);
    speech.speak(token.reading || token.surface, {
      onEnd: () => setHighlightTokenIdx((cur) => (cur === tokenIdx ? null : cur)),
      onError: () => setHighlightTokenIdx(null),
    });
  };

  const speakSentence = (sentenceIdx: number) => {
    if (readingAllMode) return;
    speech.stop();
    const s = sentences[sentenceIdx];
    if (!s) return;
    const text = tokensToReadable(s);
    setHighlightSentence(sentenceIdx);
    speech.speak(text, {
      onEnd: () => setHighlightSentence((cur) => (cur === sentenceIdx ? null : cur)),
      onError: () => setHighlightSentence(null),
    });
  };

  const speakAll = () => {
    if (sentences.length === 0) return;
    speech.stop();
    readingAllCancelRef.current = false;
    setReadingAllMode(true);

    const readNext = (idx: number) => {
      if (readingAllCancelRef.current || idx >= sentences.length) {
        setReadingAllMode(false);
        setHighlightSentence(null);
        return;
      }
      const text = tokensToReadable(sentences[idx]);
      if (!text.trim()) {
        readNext(idx + 1);
        return;
      }
      setHighlightSentence(idx);
      speech.speak(text, {
        onEnd: () => readNext(idx + 1),
        onError: () => {
          setReadingAllMode(false);
          setHighlightSentence(null);
        },
      });
    };
    readNext(0);
  };

  const stopAll = () => {
    readingAllCancelRef.current = true;
    speech.stop();
    setReadingAllMode(false);
    setHighlightSentence(null);
    setHighlightTokenIdx(null);
  };

  // Compute sentence ranges in the tokens array
  const sentenceRanges = useMemo(() => {
    const ranges: { start: number; end: number; idx: number }[] = [];
    let start = 0;
    sentences.forEach((s, idx) => {
      ranges.push({ start, end: start + s.length, idx });
      start += s.length;
    });
    return ranges;
  }, [sentences]);

  const isProcessing = loading || ocrLoading;

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1a2e5a] to-[#2b6cb0] text-white px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <Image src="/logo.png" alt="Appori" width={36} height={36} className="rounded-xl sm:w-[44px] sm:h-[44px]" />
            <div>
              <h1 className="text-base sm:text-xl font-extrabold tracking-wide">漢字リーダー</h1>
              <div className="text-[9px] sm:text-[10px] opacity-70 tracking-[0.12em]">KANJI READER by Appori</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 opacity-80">
            <span className="text-[11px]">Powered by</span>
            <Image src="/logo.png" alt="Appori" width={24} height={24} className="rounded" />
            <span className="text-sm font-bold">Appori</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 flex-1 w-full">
        {/* Input mode tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setInputMode("image")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2
              ${inputMode === "image" ? "bg-[#3B82F6] text-white shadow-sm" : "bg-white text-ink-600 border border-ink-200"}`}>
            📷 写真で読み取り
          </button>
          <button onClick={() => setInputMode("paste")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2
              ${inputMode === "paste" ? "bg-[#3B82F6] text-white shadow-sm" : "bg-white text-ink-600 border border-ink-200"}`}>
            📋 テキスト貼り付け
          </button>
        </div>

        {/* ─── Image Input Mode ─── */}
        {inputMode === "image" && !(tokens?.length) && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-ink-200 overflow-hidden mb-5">
            {imagePreview && !isProcessing ? (
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <img src={imagePreview} alt="preview" className="w-full sm:w-48 h-auto rounded-lg border border-ink-200" />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-ink-400 mb-2">認識されたテキスト:</div>
                    <textarea value={input} onChange={(e) => setInput(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-blue-400 min-h-[100px] font-serif" />
                    <div className="flex gap-2 mt-3">
                      <button onClick={convert} disabled={!input.trim()}
                        className="px-5 py-2 rounded-lg bg-[#3B82F6] text-white text-sm font-bold hover:bg-[#2563EB] transition disabled:opacity-40">
                        あ 変換
                      </button>
                      <button onClick={reset}
                        className="px-4 py-2 rounded-lg border border-ink-200 text-sm text-ink-500 hover:bg-ink-50 transition">
                        やり直す
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : isProcessing ? (
              <div className="p-10 sm:p-16 text-center">
                <div className="text-4xl sm:text-5xl mb-4 animate-pulse">{ocrLoading ? "📷" : "🔍"}</div>
                <div className="text-base font-bold text-ink-700 mb-1">
                  {ocrLoading ? "画像からテキストを認識中..." : "ひらがなに変換中..."}
                </div>
                <div className="text-sm text-ink-400">しばらくお待ちください</div>
              </div>
            ) : (
              <div
                className="p-8 sm:p-14 text-center cursor-pointer hover:bg-ink-50/50 transition"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleImageFile(f); }}
              >
                <div className="text-5xl sm:text-6xl mb-4">📷</div>
                <div className="text-lg sm:text-xl font-bold text-ink-700 mb-2">
                  読めない漢字を写真で撮影
                </div>
                <div className="text-sm text-ink-400 mb-4">
                  通知書、看板、教科書などの写真をアップロード
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
                    className="px-6 py-3 rounded-xl bg-[#3B82F6] text-white font-bold text-sm hover:bg-[#2563EB] transition shadow-sm flex items-center gap-2">
                    📸 カメラで撮影
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                    className="px-6 py-3 rounded-xl bg-white text-ink-600 font-bold text-sm border border-ink-200 hover:bg-ink-50 transition flex items-center gap-2">
                    📁 ファイルを選択
                  </button>
                </div>
                <div className="mt-4 text-xs text-ink-300">
                  ドラッグ＆ドロップ / <kbd className="px-1.5 py-0.5 bg-ink-100 rounded font-mono">Ctrl+V</kbd> でスクショ貼り付けもOK
                </div>
                <div className="mt-2 text-[10px] text-ink-300">
                  📦 5MB以下の画像 (大きい画像は自動圧縮)
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }} />
          </div>
        )}

        {/* ─── Paste Input Mode ─── */}
        {inputMode === "paste" && !(tokens?.length) && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-ink-200 overflow-hidden mb-5">
            <div className="px-4 sm:px-5 py-2.5 border-b border-ink-100 flex items-center justify-between">
              <span className="text-xs font-bold text-ink-400">📋 テキストを貼り付け（コピー元から）</span>
              <span className={`text-xs font-semibold ${input.length > 4500 ? "text-red-500" : "text-ink-300"}`}>
                {input.length} / 5000
              </span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Webサイト、メール、書類などからコピーした漢字テキストを貼り付け..."
              className="w-full px-4 sm:px-5 py-3 sm:py-4 text-base leading-relaxed resize-none focus:outline-none font-serif min-h-[120px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); convert(); }
              }}
            />
            <div className="px-4 sm:px-5 py-2 border-t border-ink-100">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[11px] text-ink-400 flex-shrink-0">例文:</span>
                {EXAMPLES.map((ex) => (
                  <button key={ex.label}
                    onClick={() => { setInput(ex.text); convertText(ex.text); }}
                    className="px-3 py-1 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition flex-shrink-0 font-medium">
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 sm:px-5 py-3 border-t border-ink-100">
              <button onClick={convert} disabled={!input.trim() || loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#3B82F6] text-white text-sm font-bold hover:bg-[#2563EB] transition shadow-sm disabled:opacity-40 flex items-center justify-center gap-1.5">
                {loading ? <><span className="animate-pulse">⏳</span> 変換中...</> : <>あ 変換</>}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-600 font-medium flex items-center justify-between">
            <span>❌ {error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Size notice (when uploading large image) */}
        {sizeNotice && !error && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-4 text-xs text-blue-700 font-medium flex items-center gap-2">
            <span>ℹ️ {sizeNotice}</span>
          </div>
        )}

        {/* ─── Result ─── */}
        {(tokens?.length ?? 0) > 0 && (
          <div className="animate-fade-up">
            {/* Source image + text */}
            {imagePreview && (
              <div className="bg-ink-100 rounded-xl p-3 mb-4 flex items-center gap-3">
                <img src={imagePreview} alt="" className="w-12 h-12 object-cover rounded-lg border border-ink-200" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-ink-400">写真から読み取り</div>
                  <div className="text-xs text-ink-600 truncate">{input.substring(0, 80)}</div>
                </div>
                <button onClick={reset} className="text-xs text-ink-400 hover:text-ink-600 px-3 py-1.5 rounded-lg border border-ink-200 bg-white transition flex-shrink-0">
                  新しく読み取る
                </button>
              </div>
            )}

            {/* ─── Voice Control Bar ─── */}
            {speech.supported ? (
              <div className="bg-white rounded-xl border border-ink-200 shadow-sm px-4 py-3 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    {!readingAllMode ? (
                      <button onClick={speakAll}
                        className="px-4 py-2 rounded-lg bg-[#3B82F6] text-white text-sm font-bold hover:bg-[#2563EB] transition shadow-sm flex items-center gap-1.5">
                        🔊 全文を読む
                      </button>
                    ) : (
                      <button onClick={stopAll}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition shadow-sm flex items-center gap-1.5">
                        ⏹ 停止
                      </button>
                    )}
                    {speech.speaking && !readingAllMode && (
                      <button onClick={stopAll}
                        className="px-3 py-2 rounded-lg bg-white text-ink-600 border border-ink-200 text-sm hover:bg-ink-50 transition flex items-center gap-1">
                        ⏹
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[11px] text-ink-400 font-bold whitespace-nowrap">速度</span>
                    <input
                      type="range"
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={speech.rate}
                      onChange={(e) => speech.setRate(parseFloat(e.target.value))}
                      className="flex-1 accent-[#3B82F6] cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[#3B82F6] tabular-nums w-10 text-right">
                      {speech.rate.toFixed(1)}x
                    </span>
                  </div>

                  {speech.voices.length > 1 && (
                    <select
                      value={speech.voice?.name ?? ""}
                      onChange={(e) => {
                        const v = speech.voices.find((vc) => vc.name === e.target.value);
                        if (v) speech.setVoice(v);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-ink-200 text-xs bg-white text-ink-700 focus:outline-none focus:border-blue-400 max-w-[160px]"
                    >
                      {speech.voices.map((v) => (
                        <option key={v.name} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                {speech.voices.length === 0 && (
                  <div className="mt-2 text-[10px] text-amber-600">
                    ⚠ 日本語の音声が見つかりません。OSの音声設定を確認してください
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-xs text-amber-700">
                ⚠ お使いのブラウザは音声読み上げに対応していません
              </div>
            )}

            {/* Mode selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex gap-1.5 overflow-x-auto">
                {[
                  { id: "furigana" as const, label: "ふりがな", icon: "漢" },
                  { id: "hiragana" as const, label: "ひらがな", icon: "あ" },
                  { id: "side" as const, label: "比較", icon: "⇄" },
                ].map((m) => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition flex-shrink-0
                      ${mode === m.id ? "bg-[#3B82F6] text-white shadow-sm" : "bg-white text-ink-600 border border-ink-200"}`}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                {mode === "furigana" && (
                  <button
                    onClick={() => {
                      setEditMode((v) => !v);
                      if (editMode) cancelEdit();
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition border
                      ${editMode
                        ? "bg-amber-100 text-amber-700 border-amber-300"
                        : "bg-white text-ink-600 border-ink-200 hover:bg-ink-50"}`}
                  >
                    {editMode ? "✅ 修正完了" : "✏️ 修正"}
                  </button>
                )}
                <button onClick={copyResult}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-ink-600 border border-ink-200 hover:bg-ink-50 transition">
                  {copied ? "✅ コピー済み" : "📋 コピー"}
                </button>
                {!imagePreview && (
                  <button onClick={reset}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-ink-600 border border-ink-200 hover:bg-ink-50 transition">
                    🔄 新規
                  </button>
                )}
              </div>
            </div>

            {/* Furigana mode */}
            {mode === "furigana" && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-ink-200 px-4 sm:px-6 py-5 sm:py-6">
                <div className="text-xl sm:text-2xl leading-[2.8rem] sm:leading-[3rem] font-serif">
                  {sentenceRanges.map((range) => {
                    const isHighlighted = highlightSentence === range.idx;
                    return (
                      <span
                        key={range.idx}
                        className={`inline transition-colors ${
                          isHighlighted ? "bg-amber-100" : ""
                        }`}
                      >
                        {speech.supported && (
                          <button
                            onClick={() => speakSentence(range.idx)}
                            disabled={readingAllMode}
                            title="この文を読む"
                            className={`inline-flex items-center justify-center w-6 h-6 mr-1 rounded-full text-[10px] align-middle transition
                              ${isHighlighted
                                ? "bg-[#3B82F6] text-white"
                                : "bg-blue-50 text-[#3B82F6] hover:bg-blue-100"}
                              ${readingAllMode ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            🔊
                          </button>
                        )}
                        {tokens.slice(range.start, range.end).map((t, i) => {
                          const globalIdx = range.start + i;
                          const isTokenHighlighted = highlightTokenIdx === globalIdx;
                          const isEditing = editingTokenIdx === globalIdx;
                          if (t.hasKanji) {
                            return (
                              <span key={globalIdx} className="relative inline-block">
                                <ruby
                                  onClick={() => {
                                    if (editMode) {
                                      startEditToken(globalIdx);
                                    } else if (speech.supported) {
                                      speakWord(t, globalIdx);
                                    }
                                  }}
                                  className={`transition-colors rounded ${
                                    editMode
                                      ? "cursor-pointer bg-amber-50 hover:bg-amber-100 outline outline-1 outline-amber-200"
                                      : speech.supported && !readingAllMode
                                      ? "cursor-pointer hover:bg-blue-50"
                                      : ""
                                  } ${isTokenHighlighted ? "bg-amber-200" : ""} ${
                                    isEditing ? "bg-amber-200" : ""
                                  }`}
                                  title={
                                    editMode
                                      ? "クリックして読みを修正"
                                      : speech.supported
                                      ? `${t.reading} を読む`
                                      : ""
                                  }
                                >
                                  {t.surface}
                                  <rt>{t.reading}</rt>
                                </ruby>
                                {/* Inline edit popover */}
                                {isEditing && (
                                  <span
                                    className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-amber-300 px-3 py-2 flex items-center gap-2"
                                    style={{ minWidth: "180px" }}
                                  >
                                    <input
                                      ref={editInputRef}
                                      type="text"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          saveEdit();
                                        } else if (e.key === "Escape") {
                                          e.preventDefault();
                                          cancelEdit();
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="読みを入力"
                                      className="px-2 py-1 text-sm border border-ink-200 rounded focus:outline-none focus:border-amber-400 font-serif min-w-0 flex-1"
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        saveEdit();
                                      }}
                                      className="text-xs px-2 py-1 rounded bg-amber-500 text-white font-bold hover:bg-amber-600 transition flex-shrink-0"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEdit();
                                      }}
                                      className="text-xs px-2 py-1 rounded text-ink-500 hover:bg-ink-100 transition flex-shrink-0"
                                    >
                                      ✕
                                    </button>
                                  </span>
                                )}
                              </span>
                            );
                          }
                          return <span key={globalIdx}>{t.surface}</span>;
                        })}
                      </span>
                    );
                  })}
                </div>
                {(speech.supported || editMode) && (
                  <div className="mt-4 pt-3 border-t border-ink-100 text-[11px] text-ink-400">
                    {editMode
                      ? "💡 漢字をクリックして読みを修正できます。Enterで保存、Escでキャンセル"
                      : "💡 漢字をクリックでその語の発音 / 🔊で文全体を読み上げ / ✏️で読みを修正"}
                  </div>
                )}
              </div>
            )}

            {/* Hiragana only */}
            {mode === "hiragana" && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-ink-200 px-4 sm:px-6 py-5 sm:py-6">
                <div className="text-xl sm:text-2xl leading-relaxed font-serif text-[#3B82F6]">{hiragana}</div>
                {speech.supported && (
                  <button
                    onClick={() => {
                      speech.stop();
                      // Use original text (with kanji) for natural TTS pronunciation
                      speech.speak(tokens.map((t) => t.surface).join(""));
                    }}
                    className="mt-4 px-4 py-2 rounded-lg bg-blue-50 text-[#3B82F6] text-xs font-bold border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1.5"
                  >
                    🔊 読み上げる
                  </button>
                )}
              </div>
            )}

            {/* Side by side */}
            {mode === "side" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-xl shadow-sm border border-ink-200 px-4 py-4">
                  <div className="text-[10px] font-bold text-ink-400 tracking-wider mb-2">原文</div>
                  <div className="text-base sm:text-lg leading-relaxed font-serif">{input}</div>
                </div>
                <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 px-4 py-4">
                  <div className="text-[10px] font-bold text-[#3B82F6] tracking-wider mb-2">ひらがな</div>
                  <div className="text-base sm:text-lg leading-relaxed font-serif text-[#1E40AF]">{hiragana}</div>
                </div>
              </div>
            )}

            {/* Word breakdown */}
            <details className="mt-5">
              <summary className="text-xs font-bold text-ink-400 cursor-pointer hover:text-ink-600 transition">
                📖 単語分解（{(tokens ?? []).filter((t) => t.hasKanji).length}個の漢字語）
              </summary>
              <div className="mt-3 bg-white rounded-xl border border-ink-200 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-ink-50 border-b border-ink-200">
                      <th className="px-4 py-2 text-[11px] font-bold text-ink-500">漢字</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-ink-500">ひらがな</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-ink-500">品詞</th>
                      {speech.supported && (
                        <th className="px-4 py-2 text-[11px] font-bold text-ink-500 w-10">音声</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((t, globalIdx) => {
                      if (!t.hasKanji) return null;
                      const isEditing = editingTokenIdx === globalIdx;
                      return (
                        <tr key={globalIdx} className="border-b border-ink-100 hover:bg-ink-50/50">
                          <td className="px-4 py-2.5 text-base font-serif">{t.surface}</td>
                          <td className="px-4 py-2.5 text-base font-serif text-[#3B82F6]">
                            {isEditing ? (
                              <span className="inline-flex items-center gap-1">
                                <input
                                  ref={editInputRef}
                                  type="text"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") { e.preventDefault(); saveEdit(); }
                                    else if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
                                  }}
                                  className="px-2 py-1 text-sm border border-amber-300 rounded focus:outline-none focus:border-amber-400 font-serif w-32"
                                />
                                <button onClick={saveEdit}
                                  className="text-xs px-2 py-1 rounded bg-amber-500 text-white font-bold hover:bg-amber-600">✓</button>
                                <button onClick={cancelEdit}
                                  className="text-xs px-2 py-1 rounded text-ink-500 hover:bg-ink-100">✕</button>
                              </span>
                            ) : (
                              <button
                                onClick={() => startEditToken(globalIdx)}
                                className="text-left hover:underline hover:text-[#2563EB] cursor-pointer"
                                title="クリックして修正"
                              >
                                {t.reading}
                                <span className="ml-1 text-[10px] opacity-50">✏️</span>
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-ink-400">{t.pos}</td>
                          {speech.supported && (
                            <td className="px-4 py-2.5">
                              <button
                                onClick={() => {
                                  speech.stop();
                                  speech.speak(t.reading || t.surface);
                                }}
                                className="w-7 h-7 rounded-full bg-blue-50 text-[#3B82F6] hover:bg-blue-100 transition text-sm"
                                title={`${t.reading} を読む`}
                              >
                                🔊
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        )}

        {/* Empty state */}
        {(tokens?.length ?? 0) === 0 && !isProcessing && !imagePreview && inputMode === "image" && (
          <div className="mt-6 text-center">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {[
                { icon: "📷", title: "写真を撮る", desc: "読めない漢字を撮影" },
                { icon: "🔍", title: "自動認識", desc: "AIがテキストを抽出" },
                { icon: "あ", title: "ふりがな", desc: "漢字の読みを表示" },
                { icon: "🔊", title: "音声で学ぶ", desc: "発音を聞いて覚える" },
              ].map((s) => (
                <div key={s.title} className="bg-white rounded-xl p-4 border border-ink-200 text-center">
                  <div className="text-2xl mb-1.5">{s.icon}</div>
                  <div className="text-xs font-bold text-ink-700 mb-0.5">{s.title}</div>
                  <div className="text-[10px] text-ink-400">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-200 bg-white mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Appori" width={28} height={28} className="rounded-lg" />
            <div>
              <div className="text-xs font-bold text-ink-700">Appori</div>
              <div className="text-[9px] text-ink-400">暮らしをもっと便利に</div>
            </div>
          </div>
          <div className="text-[10px] text-ink-400 text-right">
            <div>漢字リーダー</div>
            <div>© 2026 Appori</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
