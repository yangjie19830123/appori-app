import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLang } from "../lib/i18n";
import WSIPage from "./WSIPage";

const META = {
  cn: {
    title: "打工生存指数 WSI | 6 国 PK 出国打工选哪个",
    description: "测一测你在日 / 美 / 英 / 新 / 澳 / 韩的打工生存指数，6 国 PK 看哪边更适合。",
    ogTitle: "打工生存指数 WSI · 6 国 PK",
    ogDesc: "你出国能不能活下去？输入时薪和工时立刻出分，还能 PK 不同国家。",
  },
  en: {
    title: "Work Survival Index (WSI) | Compare 6 Countries for Working Abroad",
    description: "See your work survival score in JP / US / UK / SG / AU / KR — compare any two countries head-to-head.",
    ogTitle: "Work Survival Index · 6-Country PK",
    ogDesc: "Can you survive working abroad? Enter wage and hours, get scored, then PK any two countries.",
  },
  ja: {
    title: "海外バイト生存スコア WSI | 6 ヶ国対決でどこが向いてる？",
    description: "日本 / 米 / 英 / シンガポール / 豪 / 韓の海外バイト生存スコアを診断。6 ヶ国の PK バトルで最適な選択を。",
    ogTitle: "海外バイト生存スコア WSI · 6 ヶ国 PK",
    ogDesc: "海外で本当に生活できる？時給と労働時間を入力するだけ。国別 PK もできる。",
  },
};

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isValidLang(params.lang) ? params.lang : "ja";
  const m = META[lang];
  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.ogTitle,
      description: m.ogDesc,
      type: "website",
    },
  };
}

export default function Page({ params }: { params: { lang: string } }) {
  if (!isValidLang(params.lang)) notFound();
  return <WSIPage params={params} />;
}
