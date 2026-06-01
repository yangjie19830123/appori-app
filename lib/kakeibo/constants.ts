import { Category, Member, Entry } from "./types";

export const EXPENSE_CATS: Category[] = [
  { id: "food", label: "食費", icon: "🍙", color: "#F97316" },
  { id: "rent", label: "家賃", icon: "🏠", color: "#6366F1" },
  { id: "utility", label: "光熱費", icon: "💡", color: "#EAB308" },
  { id: "transport", label: "交通費", icon: "🚃", color: "#22C55E" },
  { id: "entertain", label: "娯楽", icon: "🎮", color: "#A855F7" },
  { id: "education", label: "教育費", icon: "📚", color: "#14B8A6" },
  { id: "medical", label: "医療費", icon: "🏥", color: "#EC4899" },
  { id: "daily", label: "日用品", icon: "🧴", color: "#0EA5E9" },
  { id: "clothing", label: "衣服", icon: "👕", color: "#F43F5E" },
  { id: "telecom", label: "通信費", icon: "📱", color: "#8B5CF6" },
  { id: "other", label: "その他", icon: "📦", color: "#64748B" },
];

export const INCOME_CATS: Category[] = [
  { id: "salary", label: "給料", icon: "💰", color: "#10B981" },
  { id: "bonus", label: "ボーナス", icon: "🎉", color: "#22C55E" },
  { id: "side", label: "副収入", icon: "💼", color: "#0EA5E9" },
  { id: "invest", label: "投資", icon: "📈", color: "#EAB308" },
  { id: "other_in", label: "その他", icon: "🎁", color: "#64748B" },
];

export const MEMBERS: Member[] = [
  { id: "papa", name: "パパ", avatar: "👨", color: "#3B82F6" },
  { id: "mama", name: "ママ", avatar: "👩", color: "#EC4899" },
  { id: "child1", name: "子供", avatar: "👧", color: "#F97316" },
  { id: "shared", name: "家族共通", avatar: "🏠", color: "#6366F1" },
];

export const MONTHS_JP = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export const DAYS_JP = ["日", "月", "火", "水", "木", "金", "土"];

export const ALL_CATS = [...EXPENSE_CATS, ...INCOME_CATS];

export const SEED_DATA: Entry[] = [
  { id: 1, type: "expense", cat: "rent", amount: 85000, note: "家賃", date: "2026-04-01", member: "shared" },
  { id: 2, type: "income", cat: "salary", amount: 320000, note: "4月給料", date: "2026-04-01", member: "papa" },
  { id: 3, type: "income", cat: "salary", amount: 180000, note: "4月パート", date: "2026-04-01", member: "mama" },
  { id: 4, type: "expense", cat: "food", amount: 4580, note: "スーパー まとめ買い", date: "2026-04-02", member: "mama" },
  { id: 5, type: "expense", cat: "transport", amount: 12000, note: "定期代", date: "2026-04-03", member: "papa" },
  { id: 6, type: "expense", cat: "utility", amount: 8500, note: "電気代", date: "2026-04-05", member: "shared" },
  { id: 7, type: "expense", cat: "utility", amount: 4200, note: "水道代", date: "2026-04-05", member: "shared" },
  { id: 8, type: "expense", cat: "food", amount: 3200, note: "お弁当の材料", date: "2026-04-07", member: "mama" },
  { id: 9, type: "expense", cat: "education", amount: 15000, note: "塾代", date: "2026-04-08", member: "child1" },
  { id: 10, type: "expense", cat: "entertain", amount: 4500, note: "映画", date: "2026-04-10", member: "shared" },
  { id: 11, type: "expense", cat: "food", amount: 6800, note: "週末の買い出し", date: "2026-04-12", member: "mama" },
  { id: 12, type: "expense", cat: "clothing", amount: 3900, note: "子供の靴", date: "2026-04-14", member: "child1" },
  { id: 13, type: "expense", cat: "medical", amount: 2800, note: "小児科", date: "2026-04-15", member: "child1" },
  { id: 14, type: "expense", cat: "telecom", amount: 12000, note: "スマホ代 2台", date: "2026-04-16", member: "shared" },
  { id: 15, type: "expense", cat: "daily", amount: 2100, note: "ドラッグストア", date: "2026-04-18", member: "mama" },
  { id: 16, type: "expense", cat: "food", amount: 5400, note: "スーパー", date: "2026-04-20", member: "mama" },
  { id: 17, type: "expense", cat: "entertain", amount: 1500, note: "漫画", date: "2026-04-22", member: "child1" },
  { id: 18, type: "income", cat: "side", amount: 25000, note: "フリマ売上", date: "2026-04-20", member: "mama" },
  { id: 101, type: "income", cat: "salary", amount: 490000, note: "3月収入", date: "2026-03-01", member: "shared" },
  { id: 102, type: "expense", cat: "other", amount: 320000, note: "3月支出", date: "2026-03-15", member: "shared" },
  { id: 103, type: "income", cat: "salary", amount: 510000, note: "2月収入", date: "2026-02-01", member: "shared" },
  { id: 104, type: "expense", cat: "other", amount: 355000, note: "2月支出", date: "2026-02-15", member: "shared" },
  { id: 105, type: "income", cat: "salary", amount: 485000, note: "1月収入", date: "2026-01-01", member: "shared" },
  { id: 106, type: "expense", cat: "other", amount: 410000, note: "1月支出", date: "2026-01-15", member: "shared" },
];

export function formatYen(n: number): string {
  return (n < 0 ? "-" : "") + "¥" + Math.abs(n).toLocaleString();
}

export function formatDate(dateStr: string): string {
  const dt = new Date(dateStr + "T00:00:00");
  return `${dt.getMonth() + 1}/${dt.getDate()}（${DAYS_JP[dt.getDay()]}）`;
}
