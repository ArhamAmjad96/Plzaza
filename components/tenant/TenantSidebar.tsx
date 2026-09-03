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
  UserCheck,
  Building,
  ShieldCheck,
} from "lucide-react";

interface TenantSidebarProps {
  tenantName: string;
  unitName?: string;
  tenantId?: string | number | null;
}

interface NavGroup {
  label: string;
  items: {
    name: string;
    href: string;
    icon: any;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/tenant", icon: LayoutDashboard },
    ],
  },
  {
    label: "MY SPACE / LEASE",
    items: [
      { name: "My Unit / Space", href: "/tenant/unit", icon: Building2 },
      { name: "Lease Agreement", href: "/tenant/lease", icon: FileText },
    ],
  },
  {
    label: "BILLS / PAYMENTS",
    items: [
      { name: "Electricity Bills", href: "/tenant/bills", icon: Zap },
      { name: "Payments & Receipts", href: "/tenant/payments", icon: CreditCard },
    ],
  },
  {
    label: "SUPPORT / ACCOUNT",
    items: [
      { name: "Maintenance Tickets", href: "/tenant/complaints", icon: Wrench },
      { name: "My Profile", href: "/tenant/profile", icon: UserCheck },
    ],
  },
];

export default function TenantSidebar({ tenantName, unitName }: TenantSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/tenant") return pathname === "/tenant";
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden lg:flex w-[272px] flex-col justify-between bg-[#1B2521] text-[#F4F7F2] border-r border-[#32433B] shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto select-none p-5">
      {/* Top Brand & Tenant Identity */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1.5 pt-1">
          <div className="h-9 w-9 rounded-xl bg-[#24332D] border border-[#32433B] flex items-center justify-center text-[#8FA66B] shadow-xs">
            <Building size={18} />
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#8FA66B]">
              RESIDENT PORTAL
            </span>
            <h2 className="text-[15px] font-bold text-[#F4F7F2] leading-tight mt-0.5">
              Tenant Space
            </h2>
            <p className="text-[11px] text-[#A0B0A5]">{unitName || "Assigned Unit"}</p>
          </div>
        </div>

        {/* Categorized Navigation */}
        <nav className="space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1.5">
              <span className="block px-2.5 text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#A0B0A5]">
                {group.label}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${
                        active
                          ? "bg-[#24332D] text-[#F4F7F2] shadow-xs"
                          : "text-[#A0B0A5] hover:text-[#F4F7F2] hover:bg-[#24332D]/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          className={
                            active
                              ? "text-[#FF704D]"
                              : "text-[#A0B0A5] group-hover:text-[#F4F7F2] transition"
                          }
                        />
                        <span>{item.name}</span>
                      </div>
                      {active && (
                        <div className="h-2 w-2 rounded-full bg-[#FF704D] shadow-xs" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Tenant User Card */}
      <div className="pt-4 border-t border-[#32433B]/80">
        <div className="p-3 rounded-2xl bg-[#24332D]/70 border border-[#32433B] flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#17211D] border border-[#32433B] flex items-center justify-center font-bold text-sm text-[#8FA66B] shrink-0">
            {tenantName ? tenantName.charAt(0).toUpperCase() : "T"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#F4F7F2] truncate">{tenantName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck size={11} className="text-[#8FA66B]" />
              <span className="text-[10px] font-mono text-[#8FA66B]">Active Lease</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}