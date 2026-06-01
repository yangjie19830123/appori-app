import { Cinzel, Plus_Jakarta_Sans } from "next/font/google";
import "./heroes.css";

const display = Cinzel({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-heroes-display",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heroes-sans",
});

export const metadata = {
  title: "英雄之路 · Appori",
  description: "单人战棋闯关，参照英雄无敌 3。",
};

export default function HeroesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${display.variable} ${sans.variable} heroes-root heroes-bg min-h-screen`}
    >
      {children}
    </div>
  );
}
