import type { CountryConfig, WSIResult } from "./types";
import { calculateCountryProfile } from "./calc";
import { localizedCountry } from "./countries";
import { localToDisplay, formatDisplay, type FXRates } from "./rates";
import { getT, type Lang } from "./i18n";

export type ComparisonStat = {
  key: string;
  label: string;
  emoji: string;
  leftValue: number;
  rightValue: number;
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

export function buildPK(left: CountryConfig, right: CountryConfig, rates: FXRates, lang: Lang): PKResult {
  const t = getT(lang);
  const lProfile = calculateCountryProfile(left, lang);
  const rProfile = calculateCountryProfile(right, lang);

  // 把当地货币换算成"展示币"（cn → CNY，ja → JPY，en → USD）后做横向对比
  const leftWageDisplay = localToDisplay(left.goodWage, left.code, rates, lang);
  const rightWageDisplay = localToDisplay(right.goodWage, right.code, rates, lang);

  const leftMonthlyLocal = left.goodWage * left.studentHourLimit * 4.33;
  const rightMonthlyLocal = right.goodWage * right.studentHourLimit * 4.33;
  const leftMonthlyDisplay = localToDisplay(leftMonthlyLocal, left.code, rates, lang);
  const rightMonthlyDisplay = localToDisplay(rightMonthlyLocal, right.code, rates, lang);

  const leftPP = leftMonthlyDisplay * (100 / left.colIndex);
  const rightPP = rightMonthlyDisplay * (100 / right.colIndex);

  const stats: ComparisonStat[] = [
    {
      key: "wage",
      label: t.statKeyWage,
      emoji: "💰",
      leftValue: leftWageDisplay,
      rightValue: rightWageDisplay,
      leftDisplay: formatDisplay(leftWageDisplay, { lang }),
      rightDisplay: formatDisplay(rightWageDisplay, { lang }),
      higherIsBetter: true,
      note: t.statNoteWage,
    },
    {
      key: "hours",
      label: t.statKeyHours,
      emoji: "⏱",
      leftValue: left.studentHourLimit,
      rightValue: right.studentHourLimit,
      leftDisplay: `${left.studentHourLimit}${t.statHoursPerWeek}`,
      rightDisplay: `${right.studentHourLimit}${t.statHoursPerWeek}`,
      higherIsBetter: true,
      note: t.statNoteHours,
    },
    {
      key: "income",
      label: t.statKeyIncome,
      emoji: "📈",
      leftValue: leftMonthlyDisplay,
      rightValue: rightMonthlyDisplay,
      leftDisplay: formatDisplay(leftMonthlyDisplay, { compact: true, lang }),
      rightDisplay: formatDisplay(rightMonthlyDisplay, { compact: true, lang }),
      higherIsBetter: true,
      note: t.statNoteIncome,
    },
    {
      key: "power",
      label: t.statKeyPower,
      emoji: "🛒",
      leftValue: leftPP,
      rightValue: rightPP,
      leftDisplay: formatDisplay(leftPP, { compact: true, lang }),
      rightDisplay: formatDisplay(rightPP, { compact: true, lang }),
      higherIsBetter: true,
      note: t.statNotePower,
    },
    {
      key: "col",
      label: t.statKeyCol,
      emoji: "🏠",
      leftValue: left.colIndex,
      rightValue: right.colIndex,
      leftDisplay: `${left.colIndex}`,
      rightDisplay: `${right.colIndex}`,
      higherIsBetter: false,
      note: t.statNoteCol,
    },
    {
      key: "wsi",
      label: t.statKeyWSI,
      emoji: "🏆",
      leftValue: lProfile.score,
      rightValue: rProfile.score,
      leftDisplay: `${lProfile.score}`,
      rightDisplay: `${rProfile.score}`,
      higherIsBetter: true,
      note: t.statNoteWSI,
    },
  ];

  // 胜负判定（B 方案：WSI 主导 + 数票辅助）
  //   - WSI 差距 >= 5 分：直接由综合 WSI 决定胜负
  //   - WSI 差距 < 5 分（势均力敌）：用其他 5 项指标数票决出
  // 这样既保证"高 WSI 应该赢"的直觉，又让其他维度在势均力敌时起作用。
  const WSI_DOMINANT_GAP = 5;
  const wsiDiff = lProfile.score - rProfile.score;

  let leftWins = 0;
  let rightWins = 0;
  let winner: PKResult["winner"];

  if (Math.abs(wsiDiff) >= WSI_DOMINANT_GAP) {
    // WSI 差距足够大：直接由 WSI 决定
    winner = wsiDiff > 0 ? "left" : "right";
    // 票数仍按 6 项实际比较累加（用于战报里的 "X:Y" 文案）
    for (const s of stats) {
      const better = s.higherIsBetter ? s.leftValue - s.rightValue : s.rightValue - s.leftValue;
      if (Math.abs(better) < 0.01) continue;
      if (better > 0) leftWins++;
      else rightWins++;
    }
  } else {
    // WSI 接近：除 WSI 外 5 项数票
    for (const s of stats) {
      if (s.key === "wsi") continue; // 跳过综合分本身，避免双重计算
      const better = s.higherIsBetter ? s.leftValue - s.rightValue : s.rightValue - s.leftValue;
      if (Math.abs(better) < 0.01) continue;
      if (better > 0) leftWins++;
      else rightWins++;
    }
    const tieBreak = leftWins - rightWins;
    winner = tieBreak > 0 ? "left" : tieBreak < 0 ? "right" : "draw";
  }

  const diff = leftWins - rightWins;

  const lcLeft = localizedCountry(left, lang);
  const lcRight = localizedCountry(right, lang);

  let verdict: string;
  if (winner === "draw") {
    verdict = t.verdictDraw(lcLeft.name, lcRight.name);
  } else {
    const w = winner === "left" ? left : right;
    const l = winner === "left" ? right : left;
    const wp = winner === "left" ? lProfile : rProfile;
    const lpp = winner === "left" ? rProfile : lProfile;
    const wWageDisp = winner === "left" ? leftWageDisplay : rightWageDisplay;
    const lWageDisp = winner === "left" ? rightWageDisplay : leftWageDisplay;
    const wPP = winner === "left" ? leftPP : rightPP;
    const lPPv = winner === "left" ? rightPP : leftPP;

    // Build advantages list (used in both verdict templates)
    const advantages: string[] = [];
    if (wWageDisp > lWageDisp) advantages.push(t.advWageHigher);
    if (w.studentHourLimit > l.studentHourLimit) advantages.push(t.advHoursWider);
    if (wPP > lPPv) advantages.push(t.advPowerStronger);
    const sep = (lang === "cn" || lang === "ja") ? "、" : ", ";
    const advText = advantages.slice(0, 2).join(sep);

    const wLc = localizedCountry(w, lang);
    const wsiGap = Math.abs(wp.score - lpp.score);
    const wsiDominant = wsiGap >= WSI_DOMINANT_GAP;

    if (wsiDominant) {
      // 综合 WSI 大幅领先：用 WSI 主导的判词
      verdict = t.verdictWSIDominant({ emoji: w.emoji, name: wLc.name }, wsiGap, advText);
    } else {
      // WSI 接近：用数票判词
      const wsScore = winner === "left" ? leftWins : rightWins;
      const lsScore = winner === "left" ? rightWins : leftWins;
      const advWithFallback = advText || t.advFallback;
      verdict = t.verdictWinner({ emoji: w.emoji, name: wLc.name }, wsScore, lsScore, advWithFallback);
    }
  }

  return {
    left: { country: left, profile: lProfile },
    right: { country: right, profile: rProfile },
    stats,
    winner,
    diff,
    verdict,
  };
}
