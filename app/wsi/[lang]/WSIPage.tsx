"use client";

import { useEffect, useRef, useState } from "react";
import { notFound } from "next/navigation";
import TopNav from "../components/TopNav";
import CountryPicker from "../components/CountryPicker";
import InputCard from "../components/InputCard";
import ResultCard from "../components/ResultCard";
import ShareButtons from "../components/ShareButtons";
import DetailPanel from "../components/DetailPanel";
import { calculateWSI } from "../lib/calc";
import { COUNTRIES } from "../lib/countries";
import { useRates } from "../lib/useRates";
import { getT, isValidLang, type Lang } from "../lib/i18n";
import type { CountryCode, WSIResult } from "../lib/types";

type Props = {
  params: { lang: string };
};

export default function Page({ params }: Props) {
  const rawLang = params.lang;
  if (!isValidLang(rawLang)) notFound();
  const lang = rawLang as Lang;
  const t = getT(lang);

  const rates = useRates();

  const [countryCode, setCountryCode] = useState<CountryCode>("JP");
  const country = COUNTRIES[countryCode];

  const [hourlyWage, setHourlyWage] = useState<number>(country.defaultWage);
  const [weeklyHours, setWeeklyHours] = useState<number>(20);
  const [isStudent, setIsStudent] = useState<boolean>(true);
  const [result, setResult] = useState<WSIResult | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const resultSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHourlyWage(country.defaultWage);
    setResult(null);
  }, [countryCode, country.defaultWage]);

  function handleSubmit() {
    const r = calculateWSI({ country: countryCode, hourlyWage, weeklyHours, isStudent, lang });
    setResult(r);
    setTimeout(() => {
      resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleReset() {
    setResult(null);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  return (
    <main className="min-h-screen bg-cream-100 relative">
      <div className="fixed inset-0 bg-dots-light pointer-events-none" />

      <div className="relative">
        <TopNav lang={lang} t={t} />

        <div className="mx-auto max-w-[440px] px-5 pb-16">
          {/* Hero */}
          <section className="pt-8 pb-6 relative">
            <div className="inline-block px-3 py-1 rounded-full bg-pop-yellow border-[2px] border-ink shadow-stamp-sm font-bold text-xs mb-3 -rotate-2">
              {t.heroBadge}
            </div>
            <h1 className="font-display text-[44px] leading-[0.95] tracking-tight whitespace-pre-line">
              {t.heroTitle}
            </h1>
            <p className="mt-3 text-sm text-ink-soft leading-relaxed">
              {t.heroSub1}<br />
              <span className="text-ink-mute">{t.heroSub2}</span>
            </p>

            <div className="absolute top-8 right-2 text-3xl animate-spin-slow">✦</div>
            <div className="absolute top-20 right-12 text-xl">✧</div>
          </section>

          <section className="mb-5">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-display tracking-wider">{t.step1}</span>
              <span className="text-[10px] text-ink-mute">{t.step1Hint}</span>
            </div>
            <CountryPicker selected={countryCode} lang={lang} onSelect={setCountryCode} />
          </section>

          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-display tracking-wider">{t.step2}</span>
            </div>
            <InputCard
              country={country}
              hourlyWage={hourlyWage}
              weeklyHours={weeklyHours}
              isStudent={isStudent}
              rates={rates}
              lang={lang}
              t={t}
              onWageChange={setHourlyWage}
              onHoursChange={setWeeklyHours}
              onStudentChange={setIsStudent}
              onSubmit={handleSubmit}
            />
          </section>

          {result && (
            <section ref={resultSectionRef} className="mt-8 space-y-4">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-xs font-display tracking-wider">{t.step3}</span>
                <button
                  onClick={handleReset}
                  className="text-xs text-ink-mute font-bold hover:text-ink"
                >
                  {t.retest}
                </button>
              </div>
              <ResultCard
                ref={cardRef}
                result={result}
                country={country}
                hourlyWage={hourlyWage}
                weeklyHours={weeklyHours}
                rates={rates}
                lang={lang}
                t={t}
              />
              <ShareButtons
                cardRef={cardRef}
                result={result}
                countryCode={countryCode}
                hourlyWage={hourlyWage}
                weeklyHours={weeklyHours}
                bgColor={country.bgColor}
                lang={lang}
                t={t}
              />
              <DetailPanel result={result} country={country} hourlyWage={hourlyWage} rates={rates} lang={lang} t={t} />
            </section>
          )}

          <section className="mt-10">
            <a
              href={`/wsi/pk/${lang}`}
              className="press-stamp block py-5 rounded-2xl bg-pop-pink border-[3px] border-ink shadow-stamp text-center"
            >
              <div className="font-display text-xl">{t.ctaPKTitle}</div>
              <div className="text-xs mt-1 font-medium">{t.ctaPKDesc}</div>
            </a>
          </section>

          <footer className="pt-12 pb-2 text-center">
            <div className="text-[10px] text-ink-mute">{t.footerCopyright}</div>
          </footer>
        </div>
      </div>
    </main>
  );
}
