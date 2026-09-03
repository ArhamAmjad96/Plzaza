import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/navigation/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plaza Manager — Commercial Property Management",
  description: "Architectural property and electricity management for commercial plazas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#DDE4CF] text-[#17211D] font-sans selection:bg-[#FF704D]/25 selection:text-[#17211D]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
