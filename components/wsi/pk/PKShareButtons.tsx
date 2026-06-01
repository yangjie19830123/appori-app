"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import type { PKResult } from "@/lib/wsi/pk";

type Props = {
  cardRef: React.RefObject<HTMLDivElement>;
  pk: PKResult;
};

export default function PKShareButtons({ cardRef, pk }: Props) {
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
      alert("生成图片失败，长按结果卡截图也可以。");
    } finally {
      setSavingImg(false);
    }
  }

  function buildText(): string {
    const { left, right, winner, verdict } = pk;
    const lines = [
      `⚔️ 出国打工 PK：${left.country.emoji}${left.country.name} VS ${right.country.emoji}${right.country.name}`,
      `${verdict}`,
      `综合 WSI：${left.country.emoji} ${left.profile.score} ${winner === "draw" ? "==" : winner === "left" ? ">" : "<"} ${right.country.emoji} ${right.profile.score}`,
      "👉 测测你出国打工能拿几分 / 任意 2 国 PK",
      "#出国打工 #打工生存指数 #留学生兼职",
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
        {savingImg ? <>⏳ 生成中</> : imgDone ? <>✓ 已保存</> : <>📸 保存对决图</>}
      </button>
      <button
        type="button"
        onClick={handleCopyText}
        className="press-stamp py-3.5 rounded-2xl bg-pop-pink border-[3px] border-ink font-bold shadow-stamp transition flex items-center justify-center gap-2"
      >
        {textDone ? <>✓ 已复制</> : <>📝 复制战报</>}
      </button>
    </div>
  );
}
