"use client";

import { usePathname } from "next/navigation";
import { formatBillingMonth } from "@/lib/utils/format";
import NotificationBell from "./NotificationBell";
import LiveClock from "./LiveClock";
import {
  Calendar,
  Building2,
} from "lucide-react";

export default function Topbar() {
  const pathname = usePathname();

  if (pathname.startsWith("/login") || pathname === "/tenant" || pathname.startsWith("/tenant/")) {
    return null;
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  function getPageTitle() {
    if (pathname === "/") return "Overview";
    if (pathname.startsWith("/units")) return "Shops & Rooms";
    if (pathname.startsWith("/tenants")) return "Tenants";
    if (pathname.startsWith("/rent")) return "Rent & Payments";
    if (pathname.startsWith("/connections")) return "Electricity Meters";
    if (pathname.startsWith("/complaints")) return "Maintenance";
    if (pathname.startsWith("/expenses")) return "Plaza Expenses";
    if (pathname.startsWith("/logs")) return "Activity & Audit Logs";
    if (pathname.startsWith("/settings")) return "Plaza Setup";
    return "Property Workspace";
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#CBD4BC] bg-[#DDE4CF]/95 backdrop-blur-md px-6 sm:px-10 py-4 select-none">
      {/* ─── Left Page Title & Location Breadcrumb ─── */}
      <div className="flex items-center gap-3.5">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#58655E]">
            PLAZA MANAGER · COMMERCIAL PROPERTY SYSTEM
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-[#17211D] leading-tight mt-0.5">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* ─── Right Contextual Controls ─── */}
      <div className="flex items-center gap-3">
        {/* Month Badge */}
        <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-[#CBD4BC] bg-[#E8EDD9] text-sm font-mono font-semibold text-[#17211D] shadow-xs">
          <Calendar size={15} className="text-[#58655E]" />
          <span>{formatBillingMonth(currentMonth)}</span>
        </div>

        {/* Real-Time Notification Bell */}
        <NotificationBell />

        {/* Live System Time */}
        <LiveClock />
      </div>
    </header>
  );
}
