import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Plaza Electricity Manager",
  description:
    "Manage electricity bills, connections, and tenants with a clean dashboard.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900 font-sans">
        <div className="flex min-h-full flex-col">
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-blue-600">
                  Plaza
                </p>
                <h1 className="text-xl font-semibold text-slate-900">
                  Electricity Manager
                </h1>
              </div>
              <nav className="flex flex-wrap gap-3 text-sm text-slate-700">
                <a
                  href="/"
                  className="rounded-full px-4 py-2 transition hover:bg-slate-100"
                >
                  Dashboard
                </a>
                <a
                  href="/connections"
                  className="rounded-full px-4 py-2 transition hover:bg-slate-100"
                >
                  Connections
                </a>
                <a
                  href="/tenants"
                  className="rounded-full px-4 py-2 transition hover:bg-slate-100"
                >
                  Tenants
                </a>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
