import type { CountryCode, CountryConfig } from "./types";

export type FXRates = {
  base: "USD";
  CNY: number; // 1 USD = X CNY
  JPY: number;
  GBP: number;
  HKD: number;
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
  HKD: 7.8,
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
  HK: "HKD",
  AU: "AUD",
  KR: "KRW",
};

// 1 USD = X 当地货币
export function getUsdRate(code: CountryCode, rates: FXRates): number {
  const key = FX_KEY[code];
  if (!key) return 1;
  return rates[key] as number;
}

// 当地货币 → 人民币
export function localToCny(amount: number, code: CountryCode, rates: FXRates): number {
  const usdAmount = amount / getUsdRate(code, rates);
  return usdAmount * rates.CNY;
}

// 当地 → USD（用于 WSI 内部归一化，可不实时）
export function localToUsdStatic(amount: number, c: CountryConfig): number {
  return amount / c.usdRate;
}

// 格式化人民币金额（智能用 万 单位）
export function formatCny(amount: number, opts: { compact?: boolean } = {}): string {
  const { compact = false } = opts;
  if (compact && amount >= 10000) {
    return `¥${(amount / 10000).toFixed(1)}万`;
  }
  if (amount >= 1000) {
    return `¥${Math.round(amount).toLocaleString()}`;
  }
  return `¥${amount.toFixed(0)}`;
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
