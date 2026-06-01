import type { Lang } from "./i18n";

export type CountryCode = "JP" | "US" | "UK" | "SG" | "AU" | "KR";

export type Grade = "S" | "A" | "B" | "C" | "D";

export type RiskLevel = "low" | "medium" | "high";

export type Risk = {
  type: "hours" | "income" | "wage";
  level: RiskLevel;
  title: string;
  desc: string;
};

export type CountryNames = {
  cn: string;
  en: string;
  ja?: string;  // 可选——如果某些字段没有 ja 翻译，运行时回落到 en
};

export type CountryConfig = {
  code: CountryCode;
  // 多语言名 / 昵称 / 备注 / 趣闻 / 小贴士
  names: CountryNames;
  nameEn: string; // ISO-style English name (always shown, e.g. "Japan")
  emoji: string;
  nicknames: CountryNames;
  studentHourNotes: CountryNames;
  funFacts: CountryNames;
  // Money + rules
  currency: string;
  currencySymbol: string;
  minWage: number;
  goodWage: number;
  topWage: number;
  defaultWage: number;
  studentHourLimit: number;
  // Annual income wall
  annualWall?: number;
  wallNames?: CountryNames;
  wallDescs?: CountryNames;
  // FX (1 USD = X local) — used as static fallback
  usdRate: number;
  colIndex: number;
  // Vibe
  accentColor: string;
  bgColor: string;
};

export type WSIInput = {
  country: CountryCode;
  hourlyWage: number;
  weeklyHours: number;
  isStudent: boolean;
  lang: Lang;
};

export type WSIResult = {
  score: number;
  grade: Grade;
  monthlyIncome: number;
  annualIncome: number;
  monthlyUSD: number;
  beatPercent: number;
  risks: Risk[];
  suggestions: string[];
  breakdown: {
    wage: number;
    income: number;
    safety: number;
  };
};
