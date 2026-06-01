import type { CountryCode, CountryConfig } from "./types";
import type { Lang } from "./i18n";

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  JP: {
    code: "JP",
    names: { cn: "日本", en: "Japan", ja: "日本" },
    nameEn: "Japan",
    emoji: "🇯🇵",
    nicknames: { cn: "压力山大型", en: "High-pressure", ja: "プレッシャー大国型" },
    currency: "JPY",
    currencySymbol: "¥",
    minWage: 1163,
    goodWage: 1500,
    topWage: 1800,
    defaultWage: 1200,
    studentHourLimit: 28,
    studentHourNotes: { cn: "学期内 / 长假 40h", en: "Term: 28h · break: 40h", ja: "学期中：28h / 長期休暇：40h" },
    annualWall: 1_030_000,
    wallNames: { cn: "103万円", en: "¥1.03M", ja: "103万円" },
    wallDescs: { cn: "扶養控除上限", en: "tax-dependent threshold", ja: "扶養控除の上限" },
    usdRate: 150,
    colIndex: 84,
    accentColor: "#E60012",
    bgColor: "#FFE8EB",
    funFacts: {
      cn: "便利店时薪稳，深夜班 +25%",
      en: "Konbini wages are stable, late shift +25%",
      ja: "コンビニ時給は安定、深夜は +25%",
    },
  },
  US: {
    code: "US",
    names: { cn: "美国", en: "USA", ja: "アメリカ" },
    nameEn: "USA",
    emoji: "🇺🇸",
    nicknames: { cn: "高薪高压型", en: "High-pay-high-grind", ja: "高給ハードワーク型" },
    currency: "USD",
    currencySymbol: "$",
    minWage: 7.25,
    goodWage: 18,
    topWage: 28,
    defaultWage: 16,
    studentHourLimit: 20,
    studentHourNotes: { cn: "学期 on-campus / 假期 40h", en: "Term: 20h on-campus · break: 40h", ja: "学期中：学内 20h / 休暇：40h" },
    usdRate: 1,
    colIndex: 100,
    accentColor: "#1E3A8A",
    bgColor: "#DDE3F0",
    funFacts: {
      cn: "州差超大，加州 $16+，密西西比 $7.25",
      en: "Huge state spread: CA $16+, MS just $7.25",
      ja: "州ごとの差が大きい：CA は $16+、MS は $7.25",
    },
  },
  UK: {
    code: "UK",
    names: { cn: "英国", en: "UK", ja: "イギリス" },
    nameEn: "UK",
    emoji: "🇬🇧",
    nicknames: { cn: "下午茶续命型", en: "Tea-break vibes", ja: "ティータイムで一息型" },
    currency: "GBP",
    currencySymbol: "£",
    minWage: 11.44,
    goodWage: 14,
    topWage: 20,
    defaultWage: 12.5,
    studentHourLimit: 20,
    studentHourNotes: { cn: "学期内 / 假期可全职", en: "Term: 20h · break: full-time", ja: "学期中：20h / 休暇中：フルタイム可" },
    annualWall: 12_570,
    wallNames: { cn: "£12,570", en: "£12,570", ja: "£12,570" },
    wallDescs: { cn: "免税起征点", en: "personal allowance", ja: "個人所得税の非課税枠" },
    usdRate: 0.79,
    colIndex: 79,
    accentColor: "#0E7C66",
    bgColor: "#DCF1EB",
    funFacts: {
      cn: "伦敦时薪普遍 +10%",
      en: "London wages typically +10%",
      ja: "ロンドンの時給は概ね +10%",
    },
  },
  SG: {
    code: "SG",
    names: { cn: "新加坡", en: "Singapore", ja: "シンガポール" },
    nameEn: "Singapore",
    emoji: "🇸🇬",
    nicknames: { cn: "精英卷度型", en: "Elite hustle", ja: "エリート競争型" },
    currency: "SGD",
    currencySymbol: "S$",
    minWage: 10,
    goodWage: 14,
    topWage: 20,
    defaultWage: 12,
    studentHourLimit: 16,
    studentHourNotes: { cn: "公立大学 16h / 假期不限", en: "Public uni: 16h · break: unlimited", ja: "国立大学：16h / 休暇中：無制限" },
    annualWall: 22_000,
    wallNames: { cn: "S$22,000", en: "S$22,000", ja: "S$22,000" },
    wallDescs: { cn: "个税起征点", en: "personal tax threshold", ja: "個人所得税の課税基準" },
    usdRate: 1.35,
    colIndex: 95,
    accentColor: "#E91E63",
    bgColor: "#FCE4EE",
    funFacts: {
      cn: "无全国最低工资，市场普遍 S$10-14",
      en: "No national min wage; market is S$10-14",
      ja: "全国最低時給なし、市場相場は S$10-14",
    },
  },
  AU: {
    code: "AU",
    names: { cn: "澳洲", en: "Australia", ja: "オーストラリア" },
    nameEn: "Australia",
    emoji: "🇦🇺",
    nicknames: { cn: "阳光打工型", en: "Sunny worker", ja: "サンシャインバイト型" },
    currency: "AUD",
    currencySymbol: "A$",
    minWage: 24.1,
    goodWage: 28,
    topWage: 38,
    defaultWage: 26,
    studentHourLimit: 24,
    studentHourNotes: { cn: "48h/双周 / 假期不限", en: "48h/fortnight · unlimited on break", ja: "2 週で 48h / 休暇中は無制限" },
    annualWall: 18_200,
    wallNames: { cn: "A$18,200", en: "A$18,200", ja: "A$18,200" },
    wallDescs: { cn: "免税起征点", en: "tax-free threshold", ja: "非課税枠" },
    usdRate: 1.54,
    colIndex: 80,
    accentColor: "#FFCD00",
    bgColor: "#FFF7CC",
    funFacts: {
      cn: "全球最高最低时薪国之一",
      en: "One of the highest minimum wages globally",
      ja: "世界で最も最低時給が高い国の一つ",
    },
  },
  KR: {
    code: "KR",
    names: { cn: "韩国", en: "Korea", ja: "韓国" },
    nameEn: "Korea",
    emoji: "🇰🇷",
    nicknames: { cn: "卷王之国", en: "Hustle nation", ja: "ハッスル王国" },
    currency: "KRW",
    currencySymbol: "₩",
    minWage: 10_030,
    goodWage: 12_000,
    topWage: 15_000,
    defaultWage: 11_000,
    studentHourLimit: 20,
    studentHourNotes: { cn: "学期内 / TOPIK4+ 30h", en: "Term: 20h · TOPIK4+: 30h", ja: "学期中：20h / TOPIK4+：30h" },
    usdRate: 1380,
    colIndex: 76,
    accentColor: "#7C3AED",
    bgColor: "#EDE5FB",
    funFacts: {
      cn: "便利店多在最低时薪附近",
      en: "Most convenience stores hover near min wage",
      ja: "コンビニは多くが最低時給付近",
    },
  },
};

export const COUNTRY_CODES: CountryCode[] = ["JP", "US", "UK", "SG", "AU", "KR"];

// Convenience: per-language accessor
// 注：cn/en 必填；ja 可选，缺失时回落到 en
function pick(field: { cn: string; en: string; ja?: string } | undefined, lang: Lang): string | undefined {
  if (!field) return undefined;
  if (lang === "ja") return field.ja ?? field.en;
  return field[lang];
}

export function localizedCountry(c: CountryConfig, lang: Lang) {
  return {
    code: c.code,
    name: pick(c.names, lang)!,
    nameEn: c.nameEn,
    nickname: pick(c.nicknames, lang)!,
    emoji: c.emoji,
    currency: c.currency,
    currencySymbol: c.currencySymbol,
    minWage: c.minWage,
    goodWage: c.goodWage,
    topWage: c.topWage,
    defaultWage: c.defaultWage,
    studentHourLimit: c.studentHourLimit,
    studentHourNote: pick(c.studentHourNotes, lang)!,
    annualWall: c.annualWall,
    wallName: pick(c.wallNames, lang),
    wallDesc: pick(c.wallDescs, lang),
    usdRate: c.usdRate,
    colIndex: c.colIndex,
    accentColor: c.accentColor,
    bgColor: c.bgColor,
    funFact: pick(c.funFacts, lang)!,
  };
}

// 多字符货币符号（S$、A$）后加细空格
function withSep(symbol: string, value: string): string {
  const sep = symbol.length > 1 ? "\u2009" : "";
  return `${symbol}${sep}${value}`;
}

export function formatWage(amount: number, country: CountryConfig): string {
  if (country.code === "KR" || country.code === "JP") {
    return withSep(country.currencySymbol, Math.round(amount).toLocaleString());
  }
  return withSep(country.currencySymbol, amount.toFixed(2));
}

export function formatWageCompact(amount: number, country: CountryConfig): string {
  let value: string;
  if (amount >= 1000) value = amount.toLocaleString();
  else if (amount % 1 !== 0) value = amount.toFixed(2);
  else value = String(amount);
  return withSep(country.currencySymbol, value);
}

export function formatBigAmount(amount: number, country: CountryConfig, lang: Lang = "cn"): string {
  // CN/JA: use 万 unit for JP/KR (high-denomination currencies that read naturally with 万)
  if ((lang === "cn" || lang === "ja") && (country.code === "KR" || country.code === "JP")) {
    if (amount >= 10000) return withSep(country.currencySymbol, `${(amount / 10000).toFixed(country.code === "JP" ? 1 : 0)}万`);
  }
  // EN: use K/M suffixes for big numbers to keep width manageable
  if (lang === "en" && amount >= 100_000) {
    if (amount >= 1_000_000) {
      return withSep(country.currencySymbol, `${(amount / 1_000_000).toFixed(1)}M`);
    }
    return withSep(country.currencySymbol, `${Math.round(amount / 1000).toLocaleString()}K`);
  }
  return withSep(country.currencySymbol, Math.round(amount).toLocaleString());
}

// 计算给定背景色上文字应该用的颜色
// 用 W3C 相对亮度公式（YIQ 变体），亮度低于阈值 → 用浅色文字，否则用墨黑
export function textOnAccent(hex: string): { primary: string; muted: string } {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  // YIQ luminance: 0 (黑) ~ 255 (白)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  const isDark = yiq < 140;
  return isDark
    ? { primary: "#FFF6E5", muted: "rgba(255, 246, 229, 0.7)" } // cream-100 + 70% alpha
    : { primary: "#1A1A1A", muted: "rgba(26, 26, 26, 0.55)" };  // ink + 55% alpha
}
