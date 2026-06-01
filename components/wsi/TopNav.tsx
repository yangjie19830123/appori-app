"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ApporiLogo from "./ApporiLogo";

export default function TopNav() {
  const pathname = usePathname();
  const isPK = pathname?.startsWith("/wsi/pk");

  return (
    <header className="sticky top-0 z-30 bg-cream-100/80 backdrop-blur-sm border-b-[3px] border-ink">
      <div className="mx-auto max-w-[440px] px-5 py-3 flex items-center justify-between">
        <ApporiLogo size={18} />
        <div className="flex items-center gap-1 bg-ink rounded-full p-1">
          <Link
            href="/wsi"
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              !isPK ? "bg-pop-yellow text-ink" : "text-cream-100"
            }`}
          >
            🎯 测指数
          </Link>
          <Link
            href="/wsi/pk"
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              isPK ? "bg-pop-pink text-ink" : "text-cream-100"
            }`}
          >
            ⚔️ 国家 PK
          </Link>
        </div>
      </div>
    </header>
  );
}
