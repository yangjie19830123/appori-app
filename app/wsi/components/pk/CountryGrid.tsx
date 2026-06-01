"use client";

import type { CountryCode } from "../../lib/types";
import type { Lang } from "../../lib/i18n";
import { COUNTRIES, COUNTRY_CODES, localizedCountry, textOnAccent } from "../../lib/countries";

type Props = {
  selectedLeft: CountryCode | null;
  selectedRight: CountryCode | null;
  lang: Lang;
  onSelect: (code: CountryCode) => void;
};

export default function CountryGrid({ selectedLeft, selectedRight, lang, onSelect }: Props) {
  function getSlot(code: CountryCode): "left" | "right" | null {
    if (selectedLeft === code) return "left";
    if (selectedRight === code) return "right";
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {COUNTRY_CODES.map((code, idx) => {
        const c = COUNTRIES[code];
        const lc = localizedCountry(c, lang);
        const slot = getSlot(code);
        const tilt = (idx % 2 === 0 ? -1 : 1) * 1;
        const txt = slot ? textOnAccent(c.accentColor) : { primary: "#1A1A1A", muted: "#6B6B6B" };
        return (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            className={`press-stamp relative rounded-2xl border-[3px] border-ink p-3 text-center transition ${
              slot ? "shadow-stamp-lg -translate-y-1" : "bg-white shadow-stamp"
            }`}
            style={{
              background: slot ? c.accentColor : "#fff",
              transform: slot ? "translateY(-4px)" : `rotate(${tilt}deg)`,
            }}
          >
            {slot && (
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ink text-cream-100 font-display text-sm flex items-center justify-center border-[2px] border-cream-100 shadow-stamp-sm">
                {slot === "left" ? "1" : "2"}
              </div>
            )}
            <div className="text-3xl leading-none mb-1">{c.emoji}</div>
            <div className="font-display text-base leading-tight" style={{ color: txt.primary }}>{lc.name}</div>
            <div className="text-[10px] mt-0.5 leading-tight" style={{ color: txt.muted }}>{lc.nickname}</div>
          </button>
        );
      })}
    </div>
  );
}
