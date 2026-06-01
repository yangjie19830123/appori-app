"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import type { WSIResult } from "../lib/types";
import type { Lang, Translations } from "../lib/i18n";
import { buildShareText } from "../lib/calc";

type Props = {
  cardRef: React.RefObject<HTMLDivElement>;
  result: WSIResult;
  countryCode: string;
  hourlyWage: number;
  weeklyHours: number;
  bgColor?: string;
  lang: Lang;
  t: Translations;
};

export default function ShareButtons({ cardRef, result, countryCode, hourlyWage, weeklyHours, bgColor = "#FFF6E5", lang, t }: Props) {
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
        backgroundColor: bgColor,
      });
      const link = document.createElement("a");
      link.download = `WSI_${countryCode}_${result.score}_${result.grade}.png`;
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

  async function handleCopyText() {
    const text = buildShareText(result, countryCode, hourlyWage, weeklyHours, lang);
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
        {savingImg ? (
          <>
            <Spinner /> {t.shareSaving}
          </>
        ) : imgDone ? (
          <>{t.shareSaved}</>
        ) : (
          <>{t.shareSaveImg}</>
        )}
      </button>
      <button
        type="button"
        onClick={handleCopyText}
        className="press-stamp py-3.5 rounded-2xl bg-pop-mint border-[3px] border-ink font-bold shadow-stamp transition flex items-center justify-center gap-2"
      >
        {textDone ? <>{t.shareCopied}</> : <>{t.shareCopyText}</>}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
