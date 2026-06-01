"use client";

import { useMemo, useRef, useState } from "react";
import { notFound } from "next/navigation";
import TopNav from "../../components/TopNav";
import CountryGrid from "../../components/pk/CountryGrid";
import BattleCard from "../../components/pk/BattleCard";
import PKDetail from "../../components/pk/PKDetail";
import PKShareButtons from "../../components/pk/PKShareButtons";
import { COUNTRIES, localizedCountry, textOnAccent } from "../../lib/countries";
import { buildPK } from "../../lib/pk";
import { useRates } from "../../lib/useRates";
import { getT, isValidLang, type Lang } from "../../lib/i18n";
import type { CountryCode } from "../../lib/types";

type Props = {
  params: { lang: string };
};

export default function PKPage({ params }: Props) {
  const rawLang = params.lang;
  if (!isValidLang(rawLang)) notFound();
  const lang = rawLang as Lang;
  const t = getT(lang);

  const rates = useRates();

  const [left, setLeft] = useState<CountryCode | null>("JP");
  const [right, setRight] = useState<CountryCode | null>("KR");
  const [revealed, setRevealed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const battleRef = useRef<HTMLDivElement>(null);

  function handleSelect(code: CountryCode) {
    if (left === code) {
      setLeft(null);
      setRevealed(false);
      return;
    }
    if (right === code) {
      setRight(null);
      setRevealed(false);
      return;
    }
    if (!left) {
      setLeft(code);
      return;
    }
    if (!right) {
      setRight(code);
      return;
    }
    setRight(code);
    setRevealed(false);
  }

  const pk = useMemo(() => {
    if (!left || !right || left === right) return null;
    return buildPK(COUNTRIES[left], COUNTRIES[right], rates, lang);
  }, [left, right, rates, lang]);

  function handleStart() {
    if (!pk) return;
    setRevealed(true);
    setTimeout(() => {
      battleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleSwap() {
    if (!left || !right) return;
    setLeft(right);
    setRight(left);
  }

  function handleReset() {
    setRevealed(false);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  return (
    <main className="min-h-screen bg-cream-100 relative">
      <div className="fixed inset-0 bg-dots-light pointer-events-none" />

      <div className="relative">
        <TopNav lang={lang} t={t} />

        <div className="mx-auto max-w-[440px] px-5 pb-16">
          <section className="pt-8 pb-4 relative">
            <div className="inline-block px-3 py-1 rounded-full bg-pop-pink border-[2px] border-ink shadow-stamp-sm font-bold text-xs mb-3 rotate-2">
              {t.pkHeroBadge}
            </div>
            <h1 className="font-display text-[42px] leading-[0.95] tracking-tight">
              {t.pkHeroTitle1}<br />
              <span className="text-country-sg">{t.pkHeroTitle2}</span>
            </h1>
            <p className="mt-3 text-sm text-ink-soft leading-relaxed">
              {t.pkHeroSub1}<br />
              <span className="text-ink-mute">{t.pkHeroSub2}</span>
            </p>
            <div className="absolute top-6 right-2 text-3xl animate-spin-slow">★</div>
            <div className="absolute top-20 right-14 text-xl animate-bounce-soft">⚔️</div>
          </section>

          <div className="mb-4 overflow-hidden rounded-full bg-ink py-2">
            <div className="flex marquee whitespace-nowrap text-cream-100 text-xs font-bold">
              {Array.from({ length: 2 }).map((_, i) => (
                <span key={i} className="px-4 flex items-center gap-3">
                  {t.pkMarquee.flatMap((m, j) => [
                    <span key={`m-${j}`}>{m}</span>,
                    j < t.pkMarquee.length - 1 ? <span key={`d-${j}`}>·</span> : null,
                  ])}
                  <span className="w-8" />
                </span>
              ))}
            </div>
          </div>

          <section className="mb-5">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-display tracking-wider">
                {!left ? t.pkStepSelect1 : !right ? t.pkStepSelect2 : t.pkStepReady}
              </span>
              {left && right && (
                <button
                  onClick={handleSwap}
                  className="text-xs font-bold text-ink-mute hover:text-ink"
                >
                  {t.pkSwap}
                </button>
              )}
            </div>
            <CountryGrid selectedLeft={left} selectedRight={right} lang={lang} onSelect={handleSelect} />
          </section>

          {(left || right) && (
            <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-3 rounded-2xl bg-white border-[3px] border-ink shadow-stamp">
              <SlotPreview code={left} num="1" lang={lang} t={t} />
              <div className="font-display text-xl bg-pop-yellow px-2 py-1 rounded-lg border-[2px] border-ink shadow-stamp-sm">
                {t.pkVS}
              </div>
              <SlotPreview code={right} num="2" lang={lang} t={t} />
            </div>
          )}

          {pk && !revealed && (
            <button
              type="button"
              onClick={handleStart}
              className="press-stamp w-full py-4 rounded-2xl bg-ink text-cream-100 font-display text-lg shadow-stamp transition mb-6 animate-fade-up"
            >
              {t.pkStart}
            </button>
          )}

          {!left || !right ? (
            <div className="mb-6 rounded-2xl bg-cream-200 border-[3px] border-dashed border-ink/40 p-5 text-center">
              <div className="text-3xl mb-2">👆</div>
              <div className="text-sm font-bold">{t.pkNeedSelect(!left ? 2 : 1)}</div>
            </div>
          ) : null}

          {pk && revealed && (
            <section ref={battleRef} className="space-y-4 animate-fade-up">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-xs font-display tracking-wider">{t.pkBattleResult}</span>
                <button
                  onClick={handleReset}
                  className="text-xs text-ink-mute font-bold hover:text-ink"
                >
                  {t.pkReselect}
                </button>
              </div>

              <BattleCard ref={cardRef} pk={pk} lang={lang} t={t} />

              <PKShareButtons cardRef={cardRef} pk={pk} lang={lang} t={t} />

              <PKDetail pk={pk} rates={rates} lang={lang} t={t} />
            </section>
          )}

          <footer className="pt-12 pb-2 text-center">
            <div className="text-[10px] text-ink-mute">{t.footerCopyrightPK}</div>
          </footer>
        </div>
      </div>
    </main>
  );
}

function SlotPreview({ code, num, lang, t }: { code: CountryCode | null; num: string; lang: Lang; t: ReturnType<typeof getT> }) {
  if (!code) {
    return (
      <div className="h-16 rounded-xl border-[2px] border-dashed border-ink/40 flex flex-col items-center justify-center text-ink-mute">
        <div className="text-xs font-display">{t.pkSlot(num)}</div>
        <div className="text-[10px]">{t.pkSlotHint}</div>
      </div>
    );
  }
  const c = COUNTRIES[code];
  const lc = localizedCountry(c, lang);
  const txt = textOnAccent(c.accentColor);
  return (
    <div
      className="h-16 rounded-xl border-[2px] border-ink flex flex-col items-center justify-center"
      style={{ background: c.accentColor, color: txt.primary }}
    >
      <div className="text-xl leading-none">{c.emoji}</div>
      <div className="font-display text-xs mt-0.5">{lc.name}</div>
    </div>
  );
}
