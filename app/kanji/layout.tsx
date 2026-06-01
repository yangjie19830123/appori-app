import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "漢字リーダー",
  description: "日本語テキストの漢字にふりがなを付けるツール",
};

export default function KanjiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
