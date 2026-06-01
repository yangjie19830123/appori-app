import type { Grade, Risk, WSIInput, WSIResult, CountryConfig } from "./types";
import { COUNTRIES, localizedCountry } from "./countries";
import { getT, type Lang, type Translations } from "./i18n";

const WEEKS_PER_MONTH = 4.33;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function normalCDF(x: number, mean: number, std: number): number {
  const z = (x - mean) / std;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return p;
}

function wageScore(hourlyWage: number, c: CountryConfig): number {
  if (hourlyWage >= c.topWage) return 40;
  if (hourlyWage >= c.goodWage) return 32 + ((hourlyWage - c.goodWage) / (c.topWage - c.goodWage)) * 8;
  if (hourlyWage >= c.minWage) return 18 + ((hourlyWage - c.minWage) / (c.goodWage - c.minWage)) * 14;
  return clamp((hourlyWage / c.minWage) * 18, 0, 18);
}

function incomeScore(monthlyLocal: number, c: CountryConfig): number {
  const monthlyUSD = monthlyLocal / c.usdRate;
  const adjustedUSD = monthlyUSD * (100 / c.colIndex);
  if (adjustedUSD >= 1500) return 30;
  if (adjustedUSD >= 1000) return 22 + ((adjustedUSD - 1000) / 500) * 8;
  if (adjustedUSD >= 700) return 14 + ((adjustedUSD - 700) / 300) * 8;
  if (adjustedUSD >= 400) return 6 + ((adjustedUSD - 400) / 300) * 8;
  return clamp((adjustedUSD / 400) * 6, 0, 6);
}

function safetyScore(
  weeklyHours: number,
  annualLocal: number,
  c: CountryConfig,
  isStudent: boolean,
  lang: Lang,
  ignoreWall: boolean = false,
): { score: number; risks: Risk[] } {
  const t = getT(lang);
  const lc = localizedCountry(c, lang);
  let score = 30;
  const risks: Risk[] = [];

  if (isStudent && weeklyHours > c.studentHourLimit) {
    const over = weeklyHours - c.studentHourLimit;
    score -= clamp(over * 3, 0, 22);
    risks.push({
      type: "hours",
      level: over > 7 ? "high" : "medium",
      title: t.riskHoursTitle(c.studentHourLimit),
      desc: t.riskHoursDesc({ hours: weeklyHours, over, countryName: lc.name }),
    });
  }

  if (!ignoreWall && c.annualWall && annualLocal > c.annualWall && lc.wallName && lc.wallDesc) {
    const overRatio = (annualLocal - c.annualWall) / c.annualWall;
    score -= clamp(overRatio * 12, 0, 12);
    const annualStr = `${c.currencySymbol}${annualLocal.toLocaleString()}`;
    risks.push({
      type: "income",
      level: overRatio > 0.3 ? "high" : "medium",
      title: t.riskWallTitle(lc.wallName),
      desc: t.riskWallDesc({ annual: annualStr, wallDesc: lc.wallDesc }),
    });
  }

  return { score: clamp(score, 0, 30), risks };
}

function gradeOf(score: number): Grade {
  if (score >= 85) return "S";
  if (score >= 70) return "A";
  if (score >= 55) return "B";
  if (score >= 40) return "C";
  return "D";
}

function buildSuggestions(
  input: WSIInput,
  c: CountryConfig,
  result: { score: number; monthlyIncome: number; annualIncome: number },
  t: Translations,
): string[] {
  const out: string[] = [];
  const { hourlyWage, weeklyHours, isStudent, lang } = input;
  const lc = localizedCountry(c, lang);

  if (hourlyWage < c.minWage) {
    out.push(t.sugBelowMin({ countryName: lc.name, symbol: c.currencySymbol, min: c.minWage }));
  } else if (hourlyWage < c.goodWage) {
    out.push(t.sugWageOk);
  }

  if (isStudent && weeklyHours > c.studentHourLimit) {
    const longBreak = lc.studentHourNote.includes("假期") || lc.studentHourNote.toLowerCase().includes("break");
    out.push(t.sugOverHours(c.studentHourLimit, longBreak));
  } else if (isStudent && weeklyHours >= c.studentHourLimit - 2 && weeklyHours <= c.studentHourLimit) {
    out.push(t.sugNearLimit(c.studentHourLimit));
  }

  if (c.annualWall && result.annualIncome > c.annualWall && lc.wallName && lc.wallDesc) {
    out.push(t.sugWallExceeded(lc.wallName, lc.wallDesc));
  }

  if (result.score >= 85) out.push(t.sugHealthy);
  else if (result.score >= 70 && out.length === 0) out.push(t.sugStable);
  else if (result.score < 55 && out.length === 0) out.push(t.sugLow);

  return out.slice(0, 3);
}

export function calculateWSI(input: WSIInput, opts: { ignoreWall?: boolean } = {}): WSIResult {
  const c = COUNTRIES[input.country];
  const t = getT(input.lang);
  const hourlyWage = clamp(input.hourlyWage, 0, c.topWage * 5);
  const weeklyHours = clamp(Math.round(input.weeklyHours), 0, 80);

  const monthlyIncome = Math.round(hourlyWage * weeklyHours * WEEKS_PER_MONTH);
  const annualIncome = monthlyIncome * 12;
  const monthlyUSD = monthlyIncome / c.usdRate;

  const w = wageScore(hourlyWage, c);
  const i = incomeScore(monthlyIncome, c);
  const { score: s, risks } = safetyScore(weeklyHours, annualIncome, c, input.isStudent, input.lang, opts.ignoreWall);

  const score = clamp(Math.round(w + i + s), 0, 100);
  const grade = gradeOf(score);
  const beatPercent = clamp(Math.round(normalCDF(score, 58, 14) * 100), 1, 99);
  const suggestions = buildSuggestions(input, c, { score, monthlyIncome, annualIncome }, t);

  return {
    score,
    grade,
    monthlyIncome,
    annualIncome,
    monthlyUSD,
    beatPercent,
    risks,
    suggestions,
    breakdown: {
      wage: Math.round(w),
      income: Math.round(i),
      safety: Math.round(s),
    },
  };
}

// 国家档案分（PK 用）：忽略个体维度的免税点 / 扶养控除等税务红线，
// 这些是个人税务规划层面的事，不影响"国家底子好不好"的判断。
export function calculateCountryProfile(country: CountryConfig, lang: Lang): WSIResult {
  return calculateWSI(
    {
      country: country.code,
      hourlyWage: country.goodWage,
      weeklyHours: country.studentHourLimit,
      isStudent: true,
      lang,
    },
    { ignoreWall: true },
  );
}

// Grade tagline lookup is done via t.gradeS etc. — we just expose colors here.
export const GRADE_COLOR: Record<Grade, { bg: string; emoji: string }> = {
  S: { bg: "#FFD93D", emoji: "🔥" },
  A: { bg: "#98E2C6", emoji: "✨" },
  B: { bg: "#7DD3FC", emoji: "👌" },
  C: { bg: "#C4B5FD", emoji: "😮‍💨" },
  D: { bg: "#FCA5A5", emoji: "⚠️" },
};

export function gradeTagline(grade: Grade, t: Translations): string {
  return { S: t.gradeS, A: t.gradeA, B: t.gradeB, C: t.gradeC, D: t.gradeD }[grade];
}

export function buildShareText(
  result: WSIResult,
  countryCode: string,
  hourlyWage: number,
  weeklyHours: number,
  lang: Lang,
): string {
  const c = COUNTRIES[countryCode as keyof typeof COUNTRIES];
  const lc = localizedCountry(c, lang);
  const t = getT(lang);
  const lines = [
    t.shareWSITitle({ emoji: c.emoji, country: lc.name, score: result.score, grade: result.grade }),
    t.shareWSIIncome({
      symbol: c.currencySymbol,
      income: result.monthlyIncome.toLocaleString(),
      pct: result.beatPercent,
    }),
  ];
  if (result.risks.length > 0) lines.push(`⚠️ ${result.risks[0].title}`);
  lines.push(t.shareCTA);
  lines.push(t.shareWSIHashtags(lc.name));
  return lines.join("\n");
}
