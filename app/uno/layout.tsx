import { Bowlby_One, Plus_Jakarta_Sans } from "next/font/google";
import "./uno.css";

// 显示字：Bowlby One —— UNO 大数字专用
const display = Bowlby_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-uno-display",
});

// 正文：Plus Jakarta（仅作用于 /uno/* 内部）
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-uno-sans",
});

export const metadata = {
  title: "UNO · Appori",
  description: "在线 UNO 多人对战，输入房间号即可加入",
};

export default function UnoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${display.variable} ${sans.variable} uno-root uno-bg min-h-screen`}
    >
      {children}
    </div>
  );
}
