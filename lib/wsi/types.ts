export type CountryCode = "JP" | "US" | "UK" | "HK" | "AU" | "KR";

export type Grade = "S" | "A" | "B" | "C" | "D";

export type RiskLevel = "low" | "medium" | "high";

export type Risk = {
  type: "hours" | "income" | "wage";
  level: RiskLevel;
  title: string;
  desc: string;
};

export type CountryConfig = {
  code: CountryCode;
  name: string;
  nameEn: string;
  emoji: string;
  nickname: string;
  currency: string;
  currencySymbol: string;
  // Wage benchmarks (local currency / hour)
  minWage: number;
  goodWage: number;
  topWage: number;
  defaultWage: number;
  // Student rules
  studentHourLimit: number;
  studentHourNote: string;
  // Annual income wall
  annualWall?: number;
  wallName?: string;
  wallDesc?: string;
  // FX (1 USD = X local)
  usdRate: number;
  // Cost of living index (USA = 100, lower = cheaper)
  colIndex: number;
  // Vibe
  accentColor: string;
  bgColor: string;
  funFact: string;
};

export type WSIInput = {
  country: CountryCode;
  hourlyWage: number;
  weeklyHours: number;
  isStudent: boolean;
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
