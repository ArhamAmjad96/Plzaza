import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/navigation/Sidebar";
import Topbar from "@/components/navigation/Topbar";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
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
        <div className="flex min-h-screen">
          {/* Desktop Left Deep Forest Architectural Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
            {/* Topbar */}
            <Topbar />

            {/* Page Content Viewport */}
            <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>

        {/* Mobile Bottom Bar Navigation */}
        <MobileBottomNav />
      </body>
    </html>
  );
}
