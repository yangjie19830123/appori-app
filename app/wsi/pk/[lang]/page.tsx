import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLang } from "../../lib/i18n";
import PKClient from "./PKClient";

const META = {
  cn: {
    title: "国家 PK 大乱斗 | 打工生存指数 WSI",
    description: "选两个国家正面对决，6 项指标看哪边更适合留学打工。",
    ogTitle: "国家 PK 大乱斗 · WSI",
    ogDesc: "时薪、工时、月收、购买力、物价、综合 WSI——6 项指标对决。",
  },
  en: {
    title: "Country PK Battle | Work Survival Index (WSI)",
    description: "Pick two countries — 6 metrics decide which suits you better for student work abroad.",
    ogTitle: "Country PK Battle · WSI",
    ogDesc: "Wage, hours, income, buying power, cost of living, total WSI — 6-metric showdown.",
  },
  ja: {
    title: "国別 PK バトル | 海外バイト生存スコア WSI",
    description: "2 ヶ国を選んで対決、6 項目の指標で留学バイトに向いている国を判定。",
    ogTitle: "国別 PK バトル · WSI",
    ogDesc: "時給・労働時間・月収・購買力・物価・総合 WSI——6 項目で対決。",
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
  return <PKClient params={params} />;
}
