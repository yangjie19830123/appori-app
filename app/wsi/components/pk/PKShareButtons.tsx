"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import type { PKResult } from "../../lib/pk";
import type { Lang, Translations } from "../../lib/i18n";
import { localizedCountry } from "../../lib/countries";

type Props = {
  cardRef: React.RefObject<HTMLDivElement>;
  pk: PKResult;
  lang: Lang;
  t: Translations;
};

export default function PKShareButtons({ cardRef, pk, lang, t }: Props) {
  const [savingImg, setSavingImg] = useState(false);
  const [imgDone, setImgDone] = useState(false);
  const [textDone, setTextDone] = useState(false);

  async function handleSaveImage() {
    if (!cardRef.current) return;
    setSavingImg(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#FFF6E5",
      });
      const link = document.createElement("a");
      link.download = `WSI_PK_${pk.left.country.code}_VS_${pk.right.country.code}.png`;
      link.href = dataUrl;
      link.click();
      setImgDone(true);
      setTimeout(() => setImgDone(false), 2000);
    } catch (err) {
      console.error("save image failed", err);
      alert(t.shareImgFailed);
    } finally {
      setSavingImg(false);
    }
  }

  function buildText(): string {
    const { left, right, winner, verdict } = pk;
    const lcLeft = localizedCountry(left.country, lang);
    const lcRight = localizedCountry(right.country, lang);
    const op = winner === "draw" ? "==" : winner === "left" ? ">" : "<";
    const lines = [
      t.sharePKTitle({
        left: { emoji: left.country.emoji, name: lcLeft.name },
        right: { emoji: right.country.emoji, name: lcRight.name },
      }),
      verdict,
      t.sharePKScore({
        leftEmoji: left.country.emoji,
        leftScore: left.profile.score,
        op,
        rightEmoji: right.country.emoji,
        rightScore: right.profile.score,
      }),
      t.sharePKCTA,
      t.sharePKHashtags,
    ];
    return lines.join("\n");
  }

  async function handleCopyText() {
    const text = buildText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setTextDone(true);
    setTimeout(() => setTextDone(false), 2000);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={handleSaveImage}
        disabled={savingImg}
        className="press-stamp py-3.5 rounded-2xl bg-pop-yellow border-[3px] border-ink font-bold shadow-stamp disabled:opacity-60 transition flex items-center justify-center gap-2"
      >
        {savingImg ? <>⏳ {t.shareSaving}</> : imgDone ? <>{t.shareSaved}</> : <>{t.shareSaveImg}</>}
      </button>
      <button
        type="button"
        onClick={handleCopyText}
        className="press-stamp py-3.5 rounded-2xl bg-pop-pink border-[3px] border-ink font-bold shadow-stamp transition flex items-center justify-center gap-2"
      >
        {textDone ? <>{t.shareCopied}</> : <>{t.shareCopyText}</>}
      </button>
    </div>
  );
}
