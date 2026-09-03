"use client";

import { usePathname } from "next/navigation";
import {
  Calendar,
  LogOut,
} from "lucide-react";
import { formatBillingMonth } from "@/lib/utils/format";
import TenantNotificationBell from "./TenantNotificationBell";
import LiveClock from "@/components/navigation/LiveClock";

interface TenantTopbarProps {
  tenantName?: string;
  unitName?: string;
  tenantId?: string | number | null;
}

export default function TenantTopbar({ tenantName, unitName, tenantId }: TenantTopbarProps) {
  const pathname = usePathname();
  const currentMonth = new Date().toISOString().slice(0, 7);

  function getPageTitle() {
    if (pathname === "/tenant") return "Tenant Dashboard";
    if (pathname.startsWith("/tenant/unit")) return "My Space & Unit";
    if (pathname.startsWith("/tenant/lease")) return "Lease Agreement";
    if (pathname.startsWith("/tenant/bills")) return "Electricity Bills";
    if (pathname.startsWith("/tenant/payments")) return "Payment History & Receipts";
    if (pathname.startsWith("/tenant/complaints")) return "Maintenance Tickets";
    if (pathname.startsWith("/tenant/profile")) return "Resident Profile";
    return "Tenant Portal";
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#CBD4BC] bg-[#DDE4CF]/95 backdrop-blur-md px-6 sm:px-10 py-4 select-none">
      {/* Left Page Title & Location Breadcrumb */}
      <div className="flex items-center gap-3.5">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#58655E]">
            TENANT PORTAL · RESIDENT WORKSPACE
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-[#17211D] leading-tight mt-0.5">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right Contextual Controls & Sign Out */}
      <div className="flex items-center gap-3">
        {/* Month Badge */}
        <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-[#CBD4BC] bg-[#E8EDD9] text-sm font-mono font-semibold text-[#17211D] shadow-xs">
          <Calendar size={15} className="text-[#58655E]" />
          <span>{formatBillingMonth(currentMonth)}</span>
        </div>

        {/* Real-Time Notification Bell */}
        <TenantNotificationBell tenantId={tenantId} />

        {/* Live System Time */}
        <LiveClock />

        {/* Prominent Top Sign Out Button */}
        <a
          href="/api/auth/logout"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-[#EAC4BE] bg-[#FAECE9] text-xs font-bold text-[#8E3E33] hover:bg-[#F5D8D4] transition shadow-xs cursor-pointer"
          title="Sign Out of Portal"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign Out</span>
        </a>
      </div>
    </header>
  );
}