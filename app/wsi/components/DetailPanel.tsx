"use client";

import type { WSIResult, CountryConfig } from "../lib/types";
import type { Lang, Translations } from "../lib/i18n";
import { localizedCountry } from "../lib/countries";
import { localToDisplay, formatDisplay, formatRateTime, isSameAsDisplayCurrency, type FXRates } from "../lib/rates";

type Props = {
  result: WSIResult;
  country: CountryConfig;
  hourlyWage: number;
  rates: FXRates;
  lang: Lang;
  t: Translations;
};

export default function DetailPanel({ result, country, hourlyWage, rates, lang, t }: Props) {
  const lc = localizedCountry(country, lang);
  const sameCurrency = isSameAsDisplayCurrency(country.code, lang);
  const wageDisplay = localToDisplay(hourlyWage, country.code, rates, lang);
  const monthlyDisplay = localToDisplay(result.monthlyIncome, country.code, rates, lang);
  const annualDisplay = localToDisplay(result.annualIncome, country.code, rates, lang);

  const methodLines = t.detailMethodLines({
    name: lc.name,
    studentHourLimit: country.studentHourLimit,
    wallName: lc.wallName,
  });

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="rounded-2xl bg-white border-[3px] border-ink shadow-stamp p-5">
        <div className="text-xs font-display tracking-wider mb-3 flex items-center justify-between">
          <span>{t.detailBreakdown}</span>
          <span className="text-ink-mute text-[10px] font-sans">{t.detailBreakdownEn}</span>
        </div>
        <BreakdownRow label={t.detailWageScore} value={result.breakdown.wage} max={40} color={country.accentColor} />
        <BreakdownRow label={t.detailIncomeScore} value={result.breakdown.income} max={30} color="#FFE66D" />
        <BreakdownRow label={t.detailSafetyScore} value={result.breakdown.safety} max={30} color="#98E2C6" />
      </div>

      {/* 货币换算面板：当本币 = 展示币（如日语用户看日本）时隐藏整块 */}
      {!sameCurrency && (
        <div className="rounded-2xl bg-pop-mint border-[3px] border-ink shadow-stamp p-5">
          <div className="text-xs font-display tracking-wider mb-3 flex items-center justify-between">
            <span>{t.detailCNYConvert}</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink text-cream-100">
              {rates.fallback ? t.detailRateFallback : `${t.detailRateUpdated} ${formatRateTime(rates.updatedAt)}`}
            </span>
          </div>
          <div className="space-y-2">
            <CnyRow label={t.detailWage} cny={formatDisplay(wageDisplay, { lang })} />
            <CnyRow label={t.detailMonthly} cny={formatDisplay(monthlyDisplay, { lang })} />
            <CnyRow label={t.detailAnnual} cny={formatDisplay(annualDisplay, { lang })} />
          </div>
        </div>
      )}

      {result.suggestions.length > 0 && (
        <div className="rounded-2xl bg-pop-yellow border-[3px] border-ink shadow-stamp p-5">
          <div className="text-xs font-display tracking-wider mb-3">{t.detailSuggestions}</div>
          <ul className="space-y-2.5">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-ink text-cream-100 text-xs font-display flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-ink leading-relaxed font-medium">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl bg-cream-200 border-[3px] border-ink shadow-stamp p-5">
        <div className="text-xs font-display tracking-wider mb-2">{t.detailFunFact(lc.name)}</div>
        <p className="text-sm text-ink leading-relaxed">{lc.funFact}</p>
      </div>

      <details className="rounded-2xl bg-white border-[3px] border-ink shadow-stamp p-5">
        <summary className="text-xs font-display tracking-wider cursor-pointer list-none flex items-center justify-between">
          <span>{t.detailMethod}</span>
          <span className="text-ink-mute">▾</span>
        </summary>
        <div className="mt-3 text-xs text-ink-soft leading-relaxed space-y-1.5">
          {methodLines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
          <p className="text-ink-mute pt-1">{t.disclaimer}</p>
        </div>
      </details>
    </div>
  );
}

function BreakdownRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-display text-ink">
          {value}<span className="text-ink-mute text-xs"> / {max}</span>
        </span>
      </div>
      <div className="h-2.5 bg-cream-200 rounded-full overflow-hidden border-2 border-ink">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function CnyRow({ label, cny }: { label: string; cny: string }) {
  return (
    <div className="flex items-center justify-between text-sm bg-white/70 rounded-xl px-3 py-2 border-2 border-ink">
      <span className="font-medium">{label}</span>
      <span className="font-display">{cny}</span>
    </div>
  );
}
