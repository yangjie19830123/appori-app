"use client";

import type { Color } from "../lib/types";
import clsx from "./clsx";

interface Props {
  open: boolean;
  onPick: (c: Color) => void;
  onCancel: () => void;
}

const items: { color: Exclude<Color, "wild">; bg: string; label: string }[] = [
  { color: "red", bg: "uno-bg-red", label: "红" },
  { color: "yellow", bg: "uno-bg-yellow", label: "黄" },
  { color: "green", bg: "uno-bg-green", label: "绿" },
  { color: "blue", bg: "uno-bg-blue", label: "蓝" },
];

export function ColorPicker({ open, onPick, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="uno-bg-ink border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="uno-font-display text-2xl text-center mb-1 italic">
          选个颜色
        </h3>
        <p className="text-center uno-text-cream/60 text-sm mb-5">
          下家必须出这个色，或同样的牌面
        </p>
        <div className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <button
              key={it.color}
              type="button"
              onClick={() => onPick(it.color)}
              className={clsx(
                "aspect-square rounded-2xl flex items-center justify-center",
                "uno-font-display italic text-3xl text-white",
                "border-4 border-white/90 shadow-xl",
                "active:scale-95 transition",
                it.bg,
              )}
              style={{
                textShadow:
                  "-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000",
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full py-2 text-sm uno-text-cream/60 hover:uno-text-cream"
        >
          取消
        </button>
      </div>
    </div>
  );
}
