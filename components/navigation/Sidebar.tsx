"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Receipt,
  FileBarChart,
  Zap,
  Wrench,
  Sliders,
  Sparkles,
} from "lucide-react";

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
      { name: "Overview", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "PROPERTY",
    items: [
      { name: "Shops & Rooms", href: "/units", icon: Building2 },
      { name: "Tenants", href: "/tenants", icon: Users },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { name: "Rent & Payments", href: "/rent", icon: CreditCard },
      { name: "Expenses", href: "/expenses", icon: Receipt },
      { name: "Reports", href: "/reports", icon: FileBarChart },
    ],
  },
  {
    label: "UTILITIES",
    items: [
      { name: "Electricity", href: "/connections", icon: Zap },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { name: "Maintenance", href: "/complaints", icon: Wrench },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { name: "Plaza Setup", href: "/settings", icon: Sliders },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden lg:flex w-64 flex-col justify-between bg-[#1B2521] text-[#F4F7F2] border-r border-[#32433B] shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto select-none p-5">
      {/* ─── Top Brand & Plaza Identity ─── */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="h-8 w-8 rounded-xl bg-[#24332D] border border-[#32433B] flex items-center justify-center text-[#FF704D]">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#8FA66B]">
              PROPERTY MANAGER
            </span>
            <h2 className="text-sm font-semibold text-[#F4F7F2] leading-tight">
              Plaza Workspace
            </h2>
            <p className="text-[11px] text-[#85918A]">Commercial Property System</p>
          </div>
        </div>

        {/* ─── Categorized Navigation ─── */}
        <nav className="space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              <span className="block px-2 text-[9px] font-mono font-semibold uppercase tracking-widest text-[#85918A]">
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
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        active
                          ? "bg-[#24332D] text-[#F4F7F2] shadow-xs"
                          : "text-[#85918A] hover:text-[#F4F7F2] hover:bg-[#24332D]/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          size={14}
                          className={
                            active
                              ? "text-[#FF704D]"
                              : "text-[#85918A] group-hover:text-[#F4F7F2] transition"
                          }
                        />
                        <span>{item.name}</span>
                      </div>
                      {active && (
                        <div className="h-1.5 w-1.5 rounded-full bg-[#FF704D]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* ─── Bottom Status & Manager Profile ─── */}
      <div className="pt-4 border-t border-[#32433B] space-y-2">
        <div className="flex items-center justify-between px-2 text-[10px] font-mono text-[#85918A]">
          <span>SYSTEM ACTIVE</span>
          <span className="flex items-center gap-1 text-[#8FA66B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8FA66B] animate-pulse" />
            IESCO LIVE
          </span>
        </div>
      </div>
    </aside>
  );
}
