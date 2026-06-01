"use client";

import { forwardRef } from "react";
import type { WSIResult, CountryConfig } from "../lib/types";
import type { Lang, Translations } from "../lib/i18n";
import { GRADE_COLOR, gradeTagline } from "../lib/calc";
import { formatWage, formatBigAmount, localizedCountry } from "../lib/countries";
import { localToDisplay, formatDisplay, isSameAsDisplayCurrency, type FXRates } from "../lib/rates";

type Props = {
  result: WSIResult;
  country: CountryConfig;
  hourlyWage: number;
  weeklyHours: number;
  rates: FXRates;
  lang: Lang;
  t: Translations;
};

const ResultCard = forwardRef<HTMLDivElement, Props>(function ResultCard(
  { result, country, hourlyWage, weeklyHours, rates, lang, t },
  ref,
) {
  const lc = localizedCountry(country, lang);
  const sameCurrency = isSameAsDisplayCurrency(country.code, lang);
  const monthlyDisplay = localToDisplay(result.monthlyIncome, country.code, rates, lang);
  const gradeColor = GRADE_COLOR[result.grade];
  const tagline = gradeTagline(result.grade, t);

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-3xl border-[3px] border-ink shadow-stamp-xl animate-pop-in"
      style={{
        aspectRatio: "9 / 14",
        background: country.bgColor,
      }}
    >
      <div className="absolute inset-0 bg-dots-light" />
      <div className="absolute inset-0 bg-grain opacity-60" />

      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full border-[3px] border-ink"
        style={{ background: country.accentColor }}
      />
      <div className="absolute top-6 right-8 w-3 h-3 rounded-full bg-ink" />
      <div className="absolute top-14 right-4 w-2 h-2 rounded-full bg-ink" />

      <div className="relative h-full flex flex-col p-5">
        <div className="flex items-center justify-between text-[10px] font-bold tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-ink text-cream-100 font-display flex items-center justify-center text-[10px]">A</div>
            <span>APPORI · WSI</span>
          </div>
          <span className="text-ink-mute uppercase">{lang === "cn" ? "打工生存指数" : lang === "ja" ? "海外バイト生存スコア" : "WORK SURVIVAL INDEX"}</span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-5xl leading-none">{country.emoji}</span>
          <div>
            <div className="font-display text-3xl leading-none">{lc.name}</div>
            <div className="text-xs font-bold text-ink-mute">{lc.nickname}</div>
          </div>
        </div>

        <div className="mt-5 relative">
          <div className="text-[11px] uppercase tracking-[0.3em] font-bold text-ink-mute mb-1">{t.yourWSI}</div>
          <div className="flex items-end gap-2">
            <span className="font-display text-[120px] leading-[0.85] tracking-tight text-ink">
              {result.score}
            </span>
            <span className="font-display text-3xl text-ink-mute mb-3">/100</span>
          </div>
        </div>

        <div className="-mt-1 flex items-center gap-3">
          <div
            className="px-4 py-2 rounded-2xl border-[3px] border-ink shadow-stamp-sm font-display flex items-center gap-1.5 -rotate-2"
            style={{ background: gradeColor.bg }}
          >
            <span className="text-2xl leading-none">{result.grade}</span>
            <span className="text-sm">{tagline}</span>
          </div>
          <div className="font-bold text-xs text-ink-mute leading-tight">
            {t.beat}<br />
            <span className="font-display text-2xl text-ink">{result.beatPercent}%</span>
            <br />{t.beatPeople}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label={t.statWage} value={formatWage(hourlyWage, country)} bg="#fff" tilt={-1.5} />
          <Stat label={t.statHours} value={`${weeklyHours}h`} bg="#fff" tilt={1} />
          <Stat
            label={t.statMonthly}
            value={formatBigAmount(result.monthlyIncome, country, lang)}
            sub={sameCurrency ? undefined : `${t.cnyApprox} ${formatDisplay(monthlyDisplay, { compact: true, lang })}`}
            bg="#fff"
            tilt={-0.5}
          />
        </div>

        <div className="mt-4 space-y-2 flex-1 overflow-hidden">
          {result.risks.length > 0 ? (
            result.risks.slice(0, 2).map((r, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-xl bg-pop-coral border-[2px] border-ink shadow-stamp-sm px-3 py-2"
              >
                <span className="text-base leading-none mt-0.5">⚠️</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold leading-tight">{r.title}</div>
                  <div className="text-[11px] leading-snug mt-0.5">{r.desc}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-start gap-2 rounded-xl bg-pop-mint border-[2px] border-ink shadow-stamp-sm px-3 py-2">
              <span className="text-base leading-none mt-0.5">✅</span>
              <div className="flex-1">
                <div className="text-sm font-bold">{t.riskFreeTitle}</div>
                <div className="text-[11px] leading-snug mt-0.5">{t.riskFreeDesc}</div>
              </div>
            </div>
          )}

          {result.suggestions[0] && (
            <div className="flex items-start gap-2 rounded-xl bg-pop-yellow border-[2px] border-ink shadow-stamp-sm px-3 py-2">
              <span className="text-base leading-none mt-0.5">💡</span>
              <div className="text-[12px] leading-snug font-medium flex-1">{result.suggestions[0]}</div>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t-2 border-dashed border-ink/30 flex items-center justify-between text-[10px] font-bold">
          <span>appori.app/wsi/{lang}</span>
          <span className="bg-ink text-cream-100 px-2 py-0.5 rounded-full">{t.shareCardFooter}</span>
        </div>
      </div>
    </div>
  );
});

function Stat({ label, value, sub, bg, tilt }: { label: string; value: string; sub?: string; bg: string; tilt: number }) {
  return (
    <div
      className="rounded-xl border-[2px] border-ink shadow-stamp-sm px-2 py-2 text-center min-w-0"
      style={{ background: bg, transform: `rotate(${tilt}deg)` }}
    >
      <div className="text-[9px] font-bold tracking-wider text-ink-mute mb-0.5">{label}</div>
      <div className="font-display text-sm leading-none truncate">{value}</div>
      {sub && <div className="text-[9px] text-ink-mute mt-0.5 leading-none">{sub}</div>}
    </div>
  );
}

export default ResultCard;
