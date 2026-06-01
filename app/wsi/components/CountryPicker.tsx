"use client";

import type { CountryCode } from "../lib/types";
import type { Lang } from "../lib/i18n";
import { COUNTRIES, COUNTRY_CODES, localizedCountry, textOnAccent } from "../lib/countries";

type Props = {
  selected: CountryCode;
  lang: Lang;
  onSelect: (code: CountryCode) => void;
};

export default function CountryPicker({ selected, lang, onSelect }: Props) {
  return (
    <div className="-mx-5 px-5">
      <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
        {COUNTRY_CODES.map((code) => {
          const c = COUNTRIES[code];
          const lc = localizedCountry(c, lang);
          const active = selected === code;
          const txt = active ? textOnAccent(c.accentColor) : { primary: "#1A1A1A", muted: "#6B6B6B" };
          return (
            <button
              key={code}
              type="button"
              onClick={() => onSelect(code)}
              className={`flex-shrink-0 snap-start press-stamp rounded-2xl border-[3px] border-ink px-4 py-3 min-w-[88px] text-center transition ${
                active ? "shadow-stamp -translate-y-0.5" : "shadow-stamp-sm bg-white"
              }`}
              style={active ? { background: c.accentColor } : undefined}
            >
              <div className="text-2xl leading-none mb-1">{c.emoji}</div>
              <div className="font-display text-sm leading-none" style={{ color: txt.primary }}>
                {lc.name}
              </div>
              <div className="text-[10px] mt-1 leading-none" style={{ color: txt.muted }}>
                {c.nameEn}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
