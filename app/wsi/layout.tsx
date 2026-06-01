import type { Metadata, Viewport } from "next";
import { DM_Sans, Archivo_Black, JetBrains_Mono } from "next/font/google";
import "./wsi.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-wsi-dmsans",
  display: "swap",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-wsi-archivo",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-wsi-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "打工生存指数 WSI | 6 国 PK 出国打工选哪个",
  description: "测一测你在日 / 美 / 英 / 新 / 澳 / 韩的打工生存指数，6 国 PK 看哪边更适合。",
  openGraph: {
    title: "打工生存指数 WSI · 6 国 PK",
    description: "你出国能不能活下去？输入时薪和工时立刻出分，还能 PK 不同国家。",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFF6E5",
};

export default function WSILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`wsi-segment ${dmSans.variable} ${archivoBlack.variable} ${jetbrains.variable}`}>
      {children}
    </div>
  );
}
