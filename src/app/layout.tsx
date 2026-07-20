import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MarketLens — วิเคราะห์หุ้นแบบรอบด้าน",
  description:
    "เครื่องมือวิเคราะห์หุ้นสหรัฐที่อธิบายข้อมูล เทคนิค พื้นฐาน และความเสี่ยงเป็นภาษาไทย",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "MarketLens", statusBarStyle: "default" },
  icons: { apple: "/icons/icon-192.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body><ServiceWorkerRegistration />{children}</body>
    </html>
  );
}
