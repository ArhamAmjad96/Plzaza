"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileBottomNav from "./MobileBottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login");
  const isTenantPortal = pathname === "/tenant" || pathname.startsWith("/tenant/");

  if (isAuthPage || isTenantPortal) {
    return (
      <div className="min-h-screen w-full">
        {children}
      </div>
    );
  }

  return (
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

      {/* Mobile Bottom Bar Navigation */}
      <MobileBottomNav />
    </div>
  );
}
