"use client";

import type { Card as CardT, Color, Value } from "../lib/types";
import clsx from "./clsx";

const colorBg: Record<Color, string> = {
  red: "uno-bg-red",
  yellow: "uno-bg-yellow",
  green: "uno-bg-green",
  blue: "uno-bg-blue",
  wild: "uno-bg-black",
};

// 显示标签
function valueLabel(v: Value): string {
  switch (v) {
    case "skip":
      return "Ø";
    case "reverse":
      return "⇄";
    case "draw2":
      return "+2";
    case "wild":
      return "★";
    case "wild_draw4":
      return "+4";
    default:
      return v;
  }
}

interface Props {
  card: CardT;
  size?: "sm" | "md" | "lg" | "hand";
  faceDown?: boolean;
  playable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const sizeClass = {
  sm: "w-12 h-[72px] text-2xl",
  md: "w-20 h-[120px] text-4xl",
  lg: "w-28 h-[168px] text-5xl",
  hand: "w-[68px] h-[102px] text-3xl shrink-0",
};

const cornerSize = {
  sm: "text-[10px]",
  md: "text-sm",
  lg: "text-lg",
  hand: "text-xs",
};

export function UnoCard({
  card,
  size = "md",
  faceDown,
  playable,
  selected,
  onClick,
  className,
  style,
}: Props) {
  if (faceDown) {
    return (
      <div
        className={clsx("unoBack", sizeClass[size], className)}
        style={style}
      />
    );
  }

  const isWild = card.color === "wild";
  const valStr = valueLabel(card.value);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick || !playable && !selected}
      style={style}
      className={clsx(
        "unoCard select-none touch-manipulation cursor-default",
        sizeClass[size],
        playable && "playable cursor-pointer",
        !playable && !selected && "disabled",
        selected && "ring-4 uno-ring-yellow",
        className,
      )}
    >
      <div className={clsx("unoCard__inner", colorBg[card.color])}>
        {/* 万能牌：四色四分之一圆 */}
        {isWild && (
          <div className="absolute inset-[8%] rounded-full overflow-hidden rotate-[-30deg] shadow-[0_0_0_2px_rgba(0,0,0,0.06)_inset]">
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="uno-bg-red" />
              <div className="uno-bg-yellow" />
              <div className="uno-bg-blue" />
              <div className="uno-bg-green" />
            </div>
          </div>
        )}

        {/* 普通色：白椭圆 */}
        {!isWild && <div className="unoCard__oval" />}

        {/* 中心大值 */}
        <div className="unoCard__center">{valStr}</div>

        {/* 角标值 */}
        <div
          className={clsx(
            "unoCard__corner",
            cornerSize[size],
            "top-1.5 left-1.5",
          )}
        >
          {valStr}
        </div>
        <div
          className={clsx(
            "unoCard__corner",
            cornerSize[size],
            "bottom-1.5 right-1.5 rotate-180",
          )}
        >
          {valStr}
        </div>
      </div>
    </button>
  );
}
