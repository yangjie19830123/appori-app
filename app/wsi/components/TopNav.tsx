"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ApporiLogo from "./ApporiLogo";
import type { Lang, Translations } from "../lib/i18n";

type Props = {
  lang: Lang;
  t: Translations;
};

export default function TopNav({ lang, t }: Props) {
  const pathname = usePathname() || "";
  const isPK = pathname.includes("/pk/");

  // 切换器只在 ja ↔ en 之间切换；cn 路由仍可直访但不出现在 UI
  // 如果当前是 cn，下次切换默认去 ja
  const otherLang: Lang = lang === "ja" ? "en" : "ja";
  const switchLabel = otherLang === "ja" ? "日本語" : "EN";

  // Build the same-page-but-other-language URL by replacing trailing /cn|/en|/ja
  const switchHref = pathname.replace(/\/(cn|en|ja)$/, `/${otherLang}`) || `/wsi/${otherLang}`;

  const testHref = `/wsi/${lang}`;
  const pkHref = `/wsi/pk/${lang}`;

  return (
    <header className="sticky top-0 z-30 bg-cream-100/80 backdrop-blur-sm border-b-[3px] border-ink">
      <div className="mx-auto max-w-[440px] px-5 py-3 flex items-center justify-between gap-2">
        <ApporiLogo size={18} />
        <div className="flex items-center gap-1 bg-ink rounded-full p-1">
          <Link
            href={testHref}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              !isPK ? "bg-pop-yellow text-ink" : "text-cream-100"
            }`}
          >
            {t.navTest}
          </Link>
          <Link
            href={pkHref}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              isPK ? "bg-pop-pink text-ink" : "text-cream-100"
            }`}
          >
            {t.navPK}
          </Link>
        </div>
        <Link
          href={switchHref}
          className="press-stamp px-2 py-1 rounded-lg text-[11px] font-bold border-2 border-ink bg-white shadow-stamp-sm flex-shrink-0"
          aria-label={`Switch to ${otherLang}`}
        >
          {switchLabel}
        </Link>
      </div>
    </header>
  );
}
