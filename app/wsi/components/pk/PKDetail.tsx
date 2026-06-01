"use client";

import type { PKResult } from "../../lib/pk";
import { formatRateTime, type FXRates } from "../../lib/rates";
import type { Lang, Translations } from "../../lib/i18n";
import { localizedCountry } from "../../lib/countries";
import type { CountryConfig } from "../../lib/types";

type Props = {
  pk: PKResult;
  rates: FXRates;
  lang: Lang;
  t: Translations;
};

export default function PKDetail({ pk, rates, lang, t }: Props) {
  const { left, right, stats } = pk;

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="grid grid-cols-2 gap-3">
        <CountryQuick country={left.country} lang={lang} />
        <CountryQuick country={right.country} lang={lang} />
      </div>

      <div className="rounded-2xl bg-white border-[3px] border-ink shadow-stamp p-5">
        <div className="text-xs font-display tracking-wider mb-4 flex items-center justify-between">
          <span>{t.pkDetailTitle}</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink text-cream-100">
            {rates.fallback ? t.detailRateFallback : `${t.detailRateUpdated} ${formatRateTime(rates.updatedAt)}`}
          </span>
        </div>
        <div className="space-y-4">
          {stats.map((s) => {
            const tie = Math.abs(s.leftValue - s.rightValue) < 0.01;
            const leftBetter = !tie && (s.higherIsBetter ? s.leftValue > s.rightValue : s.leftValue < s.rightValue);
            const lPct = (s.leftValue / Math.max(s.leftValue, s.rightValue)) * 100;
            const rPct = (s.rightValue / Math.max(s.leftValue, s.rightValue)) * 100;
            return (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <span>{s.emoji}</span>
                    {s.label}
                  </span>
                  {s.note && <span className="text-[10px] text-ink-mute">{s.note}</span>}
                </div>
                <div className="space-y-1.5">
                  <BarRow
                    emoji={left.country.emoji}
                    display={s.leftDisplay}
                    pct={lPct}
                    color={left.country.accentColor}
                    winner={leftBetter}
                  />
                  <BarRow
                    emoji={right.country.emoji}
                    display={s.rightDisplay}
                    pct={rPct}
                    color={right.country.accentColor}
                    winner={!tie && !leftBetter}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <details className="rounded-2xl bg-cream-200 border-[3px] border-ink shadow-stamp p-5">
        <summary className="text-xs font-display tracking-wider cursor-pointer list-none flex items-center justify-between">
          <span>{t.pkMethod}</span>
          <span className="text-ink-mute">▾</span>
        </summary>
        <div className="mt-3 text-xs text-ink-soft leading-relaxed space-y-1.5">
          {t.pkMethodLines.map((line, i) => (
            <p key={i} className={i === t.pkMethodLines.length - 1 ? "text-ink-mute pt-1" : ""}>{line}</p>
          ))}
        </div>
      </details>
    </div>
  );
}

function BarRow({ emoji, display, pct, color, winner }: { emoji: string; display: string; pct: number; color: string; winner: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base w-6 flex-shrink-0">{emoji}</span>
      <div className="flex-1 h-6 bg-cream-100 rounded-full border-2 border-ink overflow-hidden relative">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className={`font-display text-sm w-20 text-right ${winner ? "text-ink" : "text-ink-mute"}`}>
        {display}{winner && " 👑"}
      </span>
    </div>
  );
}

function CountryQuick({ country, lang }: { country: CountryConfig; lang: Lang }) {
  const lc = localizedCountry(country, lang);
  return (
    <div
      className="rounded-2xl border-[3px] border-ink shadow-stamp p-4"
      style={{ background: country.bgColor }}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-2xl">{country.emoji}</span>
        <span className="font-display text-lg leading-none">{lc.name}</span>
      </div>
      <div className="text-[10px] text-ink-mute mt-2 leading-snug">{lc.funFact}</div>
    </div>
  );
}
