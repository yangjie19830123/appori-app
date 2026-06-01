import type { Grade, Risk, WSIInput, WSIResult, CountryConfig } from "./types";
import { COUNTRIES } from "./countries";

const WEEKS_PER_MONTH = 4.33;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// 标准正态 CDF 近似
function normalCDF(x: number, mean: number, std: number): number {
  const z = (x - mean) / std;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return p;
}

// 时薪分（满分 40）：分段插值，min→18, good→32, top→40
function wageScore(hourlyWage: number, c: CountryConfig): number {
  if (hourlyWage >= c.topWage) return 40;
  if (hourlyWage >= c.goodWage) return 32 + ((hourlyWage - c.goodWage) / (c.topWage - c.goodWage)) * 8;
  if (hourlyWage >= c.minWage) return 18 + ((hourlyWage - c.minWage) / (c.goodWage - c.minWage)) * 14;
  return clamp((hourlyWage / c.minWage) * 18, 0, 18);
}

// 月收分（满分 30）：换算成 USD 并按 COL 调整后做评分（跨国可比）
function incomeScore(monthlyLocal: number, c: CountryConfig): number {
  const monthlyUSD = monthlyLocal / c.usdRate;
  // COL 调整：低物价国家同样 USD 收入价值更高
  const adjustedUSD = monthlyUSD * (100 / c.colIndex);
  if (adjustedUSD >= 1500) return 30;
  if (adjustedUSD >= 1000) return 22 + ((adjustedUSD - 1000) / 500) * 8;
  if (adjustedUSD >= 700) return 14 + ((adjustedUSD - 700) / 300) * 8;
  if (adjustedUSD >= 400) return 6 + ((adjustedUSD - 400) / 300) * 8;
  return clamp((adjustedUSD / 400) * 6, 0, 6);
}

// 安全分（满分 30）
function safetyScore(weeklyHours: number, annualLocal: number, c: CountryConfig, isStudent: boolean): { score: number; risks: Risk[] } {
  let score = 30;
  const risks: Risk[] = [];

  if (isStudent && weeklyHours > c.studentHourLimit) {
    const over = weeklyHours - c.studentHourLimit;
    score -= clamp(over * 3, 0, 22);
    risks.push({
      type: "hours",
      level: over > 7 ? "high" : over > 3 ? "medium" : "medium",
      title: `超过 ${c.studentHourLimit}h 上限`,
      desc: `周工时 ${weeklyHours}h，超出${c.name}留学生工签上限 ${over}h，被查到可能影响签证。`,
    });
  }

  if (c.annualWall && annualLocal > c.annualWall) {
    const overRatio = (annualLocal - c.annualWall) / c.annualWall;
    score -= clamp(overRatio * 12, 0, 12);
    risks.push({
      type: "income",
      level: overRatio > 0.3 ? "high" : "medium",
      title: `突破 ${c.wallName}`,
      desc: `年收预估 ${c.currencySymbol}${annualLocal.toLocaleString()}，超过${c.wallDesc}，可能涉及税务处理。`,
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

function buildSuggestions(input: WSIInput, c: CountryConfig, result: { score: number; monthlyIncome: number; annualIncome: number }): string[] {
  const out: string[] = [];
  const { hourlyWage, weeklyHours, isStudent } = input;

  if (hourlyWage < c.minWage) {
    out.push(`时薪低于${c.name}最低时薪 ${c.currencySymbol}${c.minWage}，先看看其他岗位。`);
  } else if (hourlyWage < c.goodWage) {
    out.push(`时薪一般，可以多对比同地区岗位，深夜 / 周末班通常加 15-25%。`);
  }

  if (isStudent && weeklyHours > c.studentHourLimit) {
    out.push(`先把周工时压回 ${c.studentHourLimit}h 内，${c.studentHourNote.includes("假期") ? "长假期可以申请放宽" : "周期性合规更重要"}。`);
  } else if (isStudent && weeklyHours >= c.studentHourLimit - 2 && weeklyHours <= c.studentHourLimit) {
    out.push(`已在 ${c.studentHourLimit}h 红线附近，注意交叉周不要超出。`);
  }

  if (c.annualWall && result.annualIncome > c.annualWall) {
    out.push(`年收已超 ${c.wallName}，建议确认${c.wallDesc}对你和家人的影响。`);
  }

  if (result.score >= 85) out.push("整体很健康，保持节奏。");
  else if (result.score >= 70 && out.length === 0) out.push("状态不错，可以小幅优化时薪。");
  else if (result.score < 55 && out.length === 0) out.push("综合分偏低，先优先提升时薪而非堆工时。");

  return out.slice(0, 3);
}

export function calculateWSI(input: WSIInput): WSIResult {
  const c = COUNTRIES[input.country];
  const hourlyWage = clamp(input.hourlyWage, 0, c.topWage * 5);
  const weeklyHours = clamp(Math.round(input.weeklyHours), 0, 80);
  const isStudent = input.isStudent;

  const monthlyIncome = Math.round(hourlyWage * weeklyHours * WEEKS_PER_MONTH);
  const annualIncome = monthlyIncome * 12;
  const monthlyUSD = monthlyIncome / c.usdRate;

  const w = wageScore(hourlyWage, c);
  const i = incomeScore(monthlyIncome, c);
  const { score: s, risks } = safetyScore(weeklyHours, annualIncome, c, isStudent);

  const score = clamp(Math.round(w + i + s), 0, 100);
  const grade = gradeOf(score);
  const beatPercent = clamp(Math.round(normalCDF(score, 58, 14) * 100), 1, 99);
  const suggestions = buildSuggestions(input, c, { score, monthlyIncome, annualIncome });

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

// 国家"档案分"（满血假设：当地 goodWage × 学生上限工时，看出国家底子）
export function calculateCountryProfile(country: CountryConfig): WSIResult {
  return calculateWSI({
    country: country.code,
    hourlyWage: country.goodWage,
    weeklyHours: country.studentHourLimit,
    isStudent: true,
  });
}

export const GRADE_META: Record<Grade, { label: string; tagline: string; bg: string; emoji: string }> = {
  S: { label: "S", tagline: "打工神级", bg: "#FFD93D", emoji: "🔥" },
  A: { label: "A", tagline: "状态拉满", bg: "#98E2C6", emoji: "✨" },
  B: { label: "B", tagline: "中规中矩", bg: "#7DD3FC", emoji: "👌" },
  C: { label: "C", tagline: "略显疲惫", bg: "#C4B5FD", emoji: "😮‍💨" },
  D: { label: "D", tagline: "亟需调整", bg: "#FCA5A5", emoji: "⚠️" },
};

export function buildShareText(result: WSIResult, countryCode: string, hourlyWage: number, weeklyHours: number): string {
  const c = COUNTRIES[countryCode as keyof typeof COUNTRIES];
  const lines = [
    `${c.emoji} 我在${c.name}的打工生存指数 WSI = ${result.score}/100（${result.grade} 级）`,
    `💴 月收 ${c.currencySymbol}${result.monthlyIncome.toLocaleString()} · 击败 ${result.beatPercent}% 打工人`,
  ];
  if (result.risks.length > 0) lines.push(`⚠️ ${result.risks[0].title}`);
  lines.push("👉 测测你的打工生存指数 / 还能 PK 不同国家");
  lines.push("#留学生打工 #打工生存指数 #" + c.name + "打工");
  return lines.join("\n");
}
