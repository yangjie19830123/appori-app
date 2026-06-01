import type { CountryCode, CountryConfig } from "./types";

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  JP: {
    code: "JP",
    name: "日本",
    nameEn: "Japan",
    emoji: "🇯🇵",
    nickname: "压力山大型",
    currency: "日元",
    currencySymbol: "¥",
    minWage: 1163,
    goodWage: 1500,
    topWage: 1800,
    defaultWage: 1200,
    studentHourLimit: 28,
    studentHourNote: "学期内 / 长假 40h",
    annualWall: 1_030_000,
    wallName: "103万円",
    wallDesc: "扶養控除上限",
    usdRate: 150,
    colIndex: 84,
    accentColor: "#FF6B6B",
    bgColor: "#FFF0F0",
    funFact: "便利店时薪稳，深夜班 +25%",
  },
  US: {
    code: "US",
    name: "美国",
    nameEn: "USA",
    emoji: "🇺🇸",
    nickname: "高薪高压型",
    currency: "美元",
    currencySymbol: "$",
    minWage: 7.25,
    goodWage: 18,
    topWage: 28,
    defaultWage: 16,
    studentHourLimit: 20,
    studentHourNote: "学期 on-campus / 假期 40h",
    usdRate: 1,
    colIndex: 100,
    accentColor: "#4F86F7",
    bgColor: "#EAF2FE",
    funFact: "州差超大，加州 $16+，密西西比 $7.25",
  },
  UK: {
    code: "UK",
    name: "英国",
    nameEn: "UK",
    emoji: "🇬🇧",
    nickname: "下午茶续命型",
    currency: "英镑",
    currencySymbol: "£",
    minWage: 11.44,
    goodWage: 14,
    topWage: 20,
    defaultWage: 12.5,
    studentHourLimit: 20,
    studentHourNote: "学期内 / 假期可全职",
    annualWall: 12_570,
    wallName: "£12,570",
    wallDesc: "免税起征点",
    usdRate: 0.79,
    colIndex: 79,
    accentColor: "#84CC16",
    bgColor: "#F4FBE2",
    funFact: "伦敦时薪普遍 +10%",
  },
  HK: {
    code: "HK",
    name: "香港",
    nameEn: "HK",
    emoji: "🇭🇰",
    nickname: "搵食艰难型",
    currency: "港币",
    currencySymbol: "HK$",
    minWage: 42.1,
    goodWage: 60,
    topWage: 90,
    defaultWage: 55,
    studentHourLimit: 20,
    studentHourNote: "学期内（需许可）",
    usdRate: 7.8,
    colIndex: 92,
    accentColor: "#EC4899",
    bgColor: "#FDE8F1",
    funFact: "兼职普遍 HK$50-70",
  },
  AU: {
    code: "AU",
    name: "澳洲",
    nameEn: "Australia",
    emoji: "🇦🇺",
    nickname: "阳光打工型",
    currency: "澳元",
    currencySymbol: "A$",
    minWage: 24.1,
    goodWage: 28,
    topWage: 38,
    defaultWage: 26,
    studentHourLimit: 24,
    studentHourNote: "48h/双周 / 假期不限",
    annualWall: 18_200,
    wallName: "A$18,200",
    wallDesc: "免税起征点",
    usdRate: 0.65,
    colIndex: 80,
    accentColor: "#FB923C",
    bgColor: "#FFF1E0",
    funFact: "全球最高最低时薪国之一",
  },
  KR: {
    code: "KR",
    name: "韩国",
    nameEn: "Korea",
    emoji: "🇰🇷",
    nickname: "卷王之国",
    currency: "韩元",
    currencySymbol: "₩",
    minWage: 10_030,
    goodWage: 12_000,
    topWage: 15_000,
    defaultWage: 11_000,
    studentHourLimit: 20,
    studentHourNote: "学期内 / TOPIK4+ 30h",
    usdRate: 1380,
    colIndex: 76,
    accentColor: "#A78BFA",
    bgColor: "#F2EDFE",
    funFact: "便利店多在最低时薪附近",
  },
};

export const COUNTRY_CODES: CountryCode[] = ["JP", "US", "UK", "HK", "AU", "KR"];

// 多字符货币符号（HK$、A$）后加细空格，避免与数字粘连
function withSep(symbol: string, value: string): string {
  const sep = symbol.length > 1 ? "\u2009" : ""; // U+2009 thin space
  return `${symbol}${sep}${value}`;
}

// Format wage with appropriate decimal places
export function formatWage(amount: number, country: CountryConfig): string {
  if (country.code === "KR" || country.code === "JP") {
    return withSep(country.currencySymbol, Math.round(amount).toLocaleString());
  }
  return withSep(country.currencySymbol, amount.toFixed(2));
}

// 用于 chip / 紧凑场景：整数化时薪
export function formatWageCompact(amount: number, country: CountryConfig): string {
  let value: string;
  if (amount >= 1000) {
    value = amount.toLocaleString();
  } else if (amount % 1 !== 0) {
    value = amount.toFixed(2);
  } else {
    value = String(amount);
  }
  return withSep(country.currencySymbol, value);
}

// Format big numbers smartly (e.g., 月收入)
export function formatBigAmount(amount: number, country: CountryConfig): string {
  if (country.code === "KR") {
    if (amount >= 10000) return withSep(country.currencySymbol, `${(amount / 10000).toFixed(0)}万`);
    return withSep(country.currencySymbol, Math.round(amount).toLocaleString());
  }
  if (country.code === "JP") {
    if (amount >= 10000) return withSep(country.currencySymbol, `${(amount / 10000).toFixed(1)}万`);
    return withSep(country.currencySymbol, Math.round(amount).toLocaleString());
  }
  return withSep(country.currencySymbol, Math.round(amount).toLocaleString());
}
