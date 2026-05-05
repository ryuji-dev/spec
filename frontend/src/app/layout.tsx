import type { Metadata } from "next";
import {
  Noto_Serif_KR,
  Noto_Sans_KR,
  Inter,
  Cormorant_Garamond,
} from "next/font/google";
import "./globals.css";

const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-serif-kr",
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "서경노회 교육위원회 웹진",
  description:
    "서경노회 교육위원회 공식 웹진 — 교사 강습회·성경고사·찬양대회·주일학교 자료를 제공하는 노회 차원의 교육 행정 포털.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSerifKr.variable} ${notoSansKr.variable} ${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
