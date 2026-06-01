import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s — Appori",
    default: "Appori — Tiny tools for everyday life",
  },
  description:
    "Free, lightweight web tools for everyone. Kanji reader, shared calendar, budget tracker, and more — no sign-up required.",
  icons: { icon: "/logo.png" },
  openGraph: {
    title: "Appori — Tiny tools for everyday life",
    description:
      "Free, lightweight web tools for everyone. No sign-up, no ads, just open and use.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="font-sans text-slate-800 antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
