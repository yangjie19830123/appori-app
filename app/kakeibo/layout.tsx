import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "家計簿 — Appori",
  description: "シンプルな家族向け家計簿アプリ。収入・支出の記録、カテゴリ別統計、家族メンバー共有。",
};

export default function KakeiboLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
