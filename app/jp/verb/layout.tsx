// app/jp/verb/layout.tsx
import "./verb.css";

export const metadata = {
  title: "動詞マスター - Appori",
  description: "JLPT動詞を楽しく学ぶ・ふりがな・例文・テスト",
};

export default function VerbLayout({ children }: { children: React.ReactNode }) {
  return <div className="verb-segment">{children}</div>;
}
