import type { CountryCode, CountryConfig } from "./types";
import type { Lang } from "./i18n";

export type FXRates = {
  base: "USD";
  CNY: number; // 1 USD = X CNY
  JPY: number;
  GBP: number;
  SGD: number;
  AUD: number;
  KRW: number;
  updatedAt: number; // unix ms; 0 if fallback
  fallback: boolean;
};

// 兜底汇率（API 失败 / 离线时使用，定期更新即可）
export const FALLBACK_RATES: FXRates = {
  base: "USD",
  CNY: 7.20,
  JPY: 150,
  GBP: 0.79,
  SGD: 1.35,
  AUD: 1.54,
  KRW: 1380,
  updatedAt: 0,
  fallback: true,
};

// 国家代码 → ER-API 货币 key
const FX_KEY: Record<CountryCode, keyof FXRates | null> = {
  US: null, // 本身就是 USD
  JP: "JPY",
  UK: "GBP",
  SG: "SGD",
  AU: "AUD",
  KR: "KRW",
};

// 1 USD = X 当地货币
export function getUsdRate(code: CountryCode, rates: FXRates): number {
  const key = FX_KEY[code];
  if (!key) return 1;
  return rates[key] as number;
}

// 当地货币 → 人民币（保留供老代码使用）
export function localToCny(amount: number, code: CountryCode, rates: FXRates): number {
  const usdAmount = amount / getUsdRate(code, rates);
  return usdAmount * rates.CNY;
}

// 当地 → USD（用于 WSI 内部归一化，可不实时）
export function localToUsdStatic(amount: number, c: CountryConfig): number {
  return amount / c.usdRate;
}

// ============================================================================
// 通用：根据语言决定换算货币
// cn → 人民币 CNY（¥）
// ja → 日元 JPY（¥）
// en → 美元 USD（$）
// ============================================================================

// 当前语言对应的"展示货币"代码（仅这 3 种）
export type DisplayCurrency = "CNY" | "JPY" | "USD";

export function displayCurrencyForLang(lang: Lang): DisplayCurrency {
  switch (lang) {
    case "cn": return "CNY";
    case "ja": return "JPY";
    case "en":
    default:   return "USD";
  }
}

// 国家代码 → 它的本币（仅 6 国）
const COUNTRY_CCY: Record<CountryCode, DisplayCurrency | string> = {
  US: "USD",
  JP: "JPY",
  UK: "GBP",
  SG: "SGD",
  AU: "AUD",
  KR: "KRW",
};

// 当本地币 = 展示币时，不需要换算（比如日语用户看日本）
export function isSameAsDisplayCurrency(code: CountryCode, lang: Lang): boolean {
  return COUNTRY_CCY[code] === displayCurrencyForLang(lang);
}

// 通用换算：当地货币 → 展示币（按 lang 决定）
export function localToDisplay(
  amount: number,
  code: CountryCode,
  rates: FXRates,
  lang: Lang,
): number {
  const target = displayCurrencyForLang(lang);
  if (target === "USD") {
    // 直接 → USD
    return amount / getUsdRate(code, rates);
  }
  // 先 → USD，再 → 目标币（CNY 或 JPY）
  const usd = amount / getUsdRate(code, rates);
  return usd * (rates[target] as number);
}

// 展示币的符号
export function displayCurrencySymbol(lang: Lang): string {
  switch (lang) {
    case "cn": return "¥";
    case "ja": return "¥";
    case "en":
    default:   return "$";
  }
}

// 通用格式化：根据 lang 决定单位（万 vs K/M）和符号
// cn / ja：紧凑模式 ≥ 10000 用「万」
// en (USD)：紧凑模式 ≥ 100000 用 K，≥ 1000000 用 M
export function formatDisplay(amount: number, opts: { compact?: boolean; lang?: Lang } = {}): string {
  const { compact = false, lang = "cn" } = opts;
  const symbol = displayCurrencySymbol(lang);

  // USD: 通常带两位小数（< 1000），上千整数化
  if (lang === "en") {
    if (compact && amount >= 1_000_000) {
      return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (compact && amount >= 100_000) {
      return `${symbol}${Math.round(amount / 1000).toLocaleString()}K`;
    }
    if (amount >= 1000) {
      return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
    if (amount >= 100) {
      return `${symbol}${amount.toFixed(0)}`;
    }
    // 小金额（时薪等）保留两位小数
    return `${symbol}${amount.toFixed(2)}`;
  }

  // cn / ja: 大额用「万」
  if (compact && amount >= 10000) {
    return `${symbol}${(amount / 10000).toFixed(1)}万`;
  }
  if (amount >= 1000) {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${symbol}${amount.toFixed(0)}`;
}

// 格式化时间戳
export function formatRateTime(updatedAt: number): string {
  if (!updatedAt) return "参考汇率";
  const d = new Date(updatedAt);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${hh}:${mm}`;
}
