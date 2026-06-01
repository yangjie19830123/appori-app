import type { CountryConfig, WSIResult } from "./types";
import { calculateCountryProfile } from "./calc";
import { localToCny, type FXRates } from "./rates";
import { formatCny } from "./rates";

export type ComparisonStat = {
  key: string;
  label: string;
  emoji: string;
  // 用于决定胜负的数值
  leftValue: number;
  rightValue: number;
  // 显示文本（已含 CNY / 单位等）
  leftDisplay: string;
  rightDisplay: string;
  higherIsBetter: boolean;
  note?: string;
};

export type PKResult = {
  left: { country: CountryConfig; profile: WSIResult };
  right: { country: CountryConfig; profile: WSIResult };
  stats: ComparisonStat[];
  winner: "left" | "right" | "draw";
  diff: number;
  verdict: string;
};

export function buildPK(left: CountryConfig, right: CountryConfig, rates: FXRates): PKResult {
  const lProfile = calculateCountryProfile(left);
  const rProfile = calculateCountryProfile(right);

  // 时薪基准：当地不错时薪 → CNY
  const leftWageCny = localToCny(left.goodWage, left.code, rates);
  const rightWageCny = localToCny(right.goodWage, right.code, rates);

  // 月收潜力：好时薪 × 学生上限 × 4.33 → CNY
  const leftMonthlyLocal = left.goodWage * left.studentHourLimit * 4.33;
  const rightMonthlyLocal = right.goodWage * right.studentHourLimit * 4.33;
  const leftMonthlyCny = localToCny(leftMonthlyLocal, left.code, rates);
  const rightMonthlyCny = localToCny(rightMonthlyLocal, right.code, rates);

  // 实际购买力：月收 CNY × (100/COL)
  const leftPP = leftMonthlyCny * (100 / left.colIndex);
  const rightPP = rightMonthlyCny * (100 / right.colIndex);

  const stats: ComparisonStat[] = [
    {
      key: "wage",
      label: "时薪基准",
      emoji: "💰",
      leftValue: leftWageCny,
      rightValue: rightWageCny,
      leftDisplay: formatCny(leftWageCny),
      rightDisplay: formatCny(rightWageCny),
      higherIsBetter: true,
      note: "「不错时薪」换人民币后比",
    },
    {
      key: "hours",
      label: "学生工时",
      emoji: "⏱",
      leftValue: left.studentHourLimit,
      rightValue: right.studentHourLimit,
      leftDisplay: `${left.studentHourLimit}h/週`,
      rightDisplay: `${right.studentHourLimit}h/週`,
      higherIsBetter: true,
      note: "学生签证周工时上限",
    },
    {
      key: "income",
      label: "月收潜力",
      emoji: "📈",
      leftValue: leftMonthlyCny,
      rightValue: rightMonthlyCny,
      leftDisplay: formatCny(leftMonthlyCny, { compact: true }),
      rightDisplay: formatCny(rightMonthlyCny, { compact: true }),
      higherIsBetter: true,
      note: "顶格工时 × 不错时薪（人民币）",
    },
    {
      key: "power",
      label: "实际购买力",
      emoji: "🛒",
      leftValue: leftPP,
      rightValue: rightPP,
      leftDisplay: formatCny(leftPP, { compact: true }),
      rightDisplay: formatCny(rightPP, { compact: true }),
      higherIsBetter: true,
      note: "月收 × 物价调整",
    },
    {
      key: "col",
      label: "物价压力",
      emoji: "🏠",
      leftValue: left.colIndex,
      rightValue: right.colIndex,
      leftDisplay: `${left.colIndex}`,
      rightDisplay: `${right.colIndex}`,
      higherIsBetter: false,
      note: "美国 = 100，越低越省",
    },
    {
      key: "wsi",
      label: "综合 WSI",
      emoji: "🏆",
      leftValue: lProfile.score,
      rightValue: rProfile.score,
      leftDisplay: `${lProfile.score}`,
      rightDisplay: `${rProfile.score}`,
      higherIsBetter: true,
      note: "档案分（满血假设）",
    },
  ];

  let leftWins = 0;
  let rightWins = 0;
  for (const s of stats) {
    const better = s.higherIsBetter ? s.leftValue - s.rightValue : s.rightValue - s.leftValue;
    if (Math.abs(better) < 0.01) continue;
    if (better > 0) leftWins++;
    else rightWins++;
  }

  const diff = leftWins - rightWins;
  const winner: PKResult["winner"] = diff > 0 ? "left" : diff < 0 ? "right" : "draw";
  const verdict = buildVerdict(left, right, lProfile, rProfile, winner, leftWins, rightWins, leftWageCny, rightWageCny, leftPP, rightPP);

  return {
    left: { country: left, profile: lProfile },
    right: { country: right, profile: rProfile },
    stats,
    winner,
    diff,
    verdict,
  };
}

function buildVerdict(
  left: CountryConfig,
  right: CountryConfig,
  lp: WSIResult,
  rp: WSIResult,
  winner: PKResult["winner"],
  leftWins: number,
  rightWins: number,
  leftWageCny: number,
  rightWageCny: number,
  leftPP: number,
  rightPP: number,
): string {
  if (winner === "draw") {
    return `${left.name} 和 ${right.name} 各有千秋，看你更看重时薪还是合规空间。`;
  }
  const w = winner === "left" ? left : right;
  const l = winner === "left" ? right : left;
  const wWage = winner === "left" ? leftWageCny : rightWageCny;
  const lWage = winner === "left" ? rightWageCny : leftWageCny;
  const wPP = winner === "left" ? leftPP : rightPP;
  const lPP = winner === "left" ? rightPP : leftPP;
  const wp = winner === "left" ? lp : rp;
  const lpp = winner === "left" ? rp : lp;
  const score = winner === "left" ? leftWins : rightWins;
  const lscore = winner === "left" ? rightWins : leftWins;

  const advantages: string[] = [];
  if (wWage > lWage) advantages.push("时薪更高");
  if (w.studentHourLimit > l.studentHourLimit) advantages.push("学生工时更宽");
  if (wPP > lPP) advantages.push("购买力更强");
  if (wp.score > lpp.score + 5) advantages.push("综合更稳");

  const advText = advantages.slice(0, 2).join("、") || "整体更胜一筹";

  return `${w.emoji} ${w.name} 以 ${score}:${lscore} 拿下 PK ——${advText}。`;
}
