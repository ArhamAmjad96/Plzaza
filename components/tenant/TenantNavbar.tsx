"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Zap,
  CreditCard,
  FileText,
  Wrench,
  LogOut,
  UserCheck,
} from "lucide-react";

import TenantNotificationBell from "./TenantNotificationBell";

interface TenantNavbarProps {
  tenantName: string;
  unitName?: string;
  tenantId?: string | number | null;
}

export default function TenantNavbar({ tenantName, unitName, tenantId }: TenantNavbarProps) {
  const pathname = usePathname();

  const NAV_LINKS = [
    { name: "Dashboard", href: "/tenant", icon: LayoutDashboard },
    { name: "My Space", href: "/tenant/unit", icon: Building2 },
    { name: "My Bills", href: "/tenant/bills", icon: Zap },
    { name: "My Payments", href: "/tenant/payments", icon: CreditCard },
    { name: "My Lease", href: "/tenant/lease", icon: FileText },
    { name: "My Complaints", href: "/tenant/complaints", icon: Wrench },
    { name: "Profile", href: "/tenant/profile", icon: UserCheck },
  ];

  function isActive(href: string) {
    if (href === "/tenant") return pathname === "/tenant";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 bg-[#1B2521] border-b border-[#32433B] text-[#F4F7F2] select-none shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Resident Identity */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#24332D] border border-[#32433B] flex items-center justify-center text-[#8FA66B]">
              <Building2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#F4F7F2] tracking-tight">
                  Tenant Portal
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#24332D] border border-[#32433B] text-[10px] font-mono text-[#8FA66B]">
                  {unitName || "Resident"}
                </span>
              </div>
              <p className="text-[11px] text-[#A0B0A5] truncate max-w-[180px] sm:max-w-xs">
                {tenantName}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    active
                      ? "bg-[#24332D] text-[#FF704D] shadow-xs"
                      : "text-[#A0B0A5] hover:text-[#F4F7F2] hover:bg-[#24332D]/50"
                  }`}
                >
                  <Icon size={14} className={active ? "text-[#FF704D]" : "text-[#A0B0A5]"} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Notifications & Logout */}
          <div className="flex items-center gap-2">
            <TenantNotificationBell tenantId={tenantId} />

            <a
              href="/api/auth/logout"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#32433B] bg-[#24332D] text-xs font-medium text-[#F4F7F2] hover:bg-[#2F4139] hover:text-[#FF704D] transition cursor-pointer"
              title="Sign Out of Portal"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Scrollable Sub-nav */}
      <div className="md:hidden flex items-center gap-1 px-3 py-2 border-t border-[#32433B]/60 overflow-x-auto bg-[#17211D]">
        {NAV_LINKS.map((link) => {
          const active = isActive(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition ${
                active
                  ? "bg-[#24332D] text-[#FF704D]"
                  : "text-[#85918A] hover:text-[#F4F7F2]"
              }`}
            >
              <Icon size={13} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
