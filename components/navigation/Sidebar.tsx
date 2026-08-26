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
    <aside className="hidden lg:flex w-72 flex-col justify-between bg-[#1B2521] text-[#F4F7F2] border-r border-[#32433B] shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto select-none p-6">
      {/* ─── Top Brand & Plaza Identity ─── */}
      <div className="space-y-7">
        <div className="flex items-center gap-3.5 px-2 pt-1">
          <div className="h-10 w-10 rounded-2xl bg-[#24332D] border border-[#32433B] flex items-center justify-center text-[#FF704D] shadow-xs">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#8FA66B]">
              PROPERTY MANAGER
            </span>
            <h2 className="text-base font-semibold text-[#F4F7F2] leading-tight mt-0.5">
              Plaza Workspace
            </h2>
            <p className="text-xs text-[#98A89F]">Commercial Property System</p>
          </div>
        </div>

        {/* ─── Categorized Navigation ─── */}
        <nav className="space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1.5">
              <span className="block px-3 text-[10px] font-mono font-semibold uppercase tracking-widest text-[#98A89F]">
                {group.label}
              </span>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? "bg-[#24332D] text-[#F4F7F2] shadow-xs"
                          : "text-[#98A89F] hover:text-[#F4F7F2] hover:bg-[#24332D]/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={17}
                          className={
                            active
                              ? "text-[#FF704D]"
                              : "text-[#98A89F] group-hover:text-[#F4F7F2] transition"
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

      {/* ─── Bottom Status & Manager Profile ─── */}
      <div className="pt-4 border-t border-[#32433B] space-y-2">
        <div className="flex items-center justify-between px-2 text-[11px] font-mono text-[#98A89F]">
          <span>SYSTEM ACTIVE</span>
          <span className="flex items-center gap-1.5 text-[#8FA66B]">
            <span className="h-2 w-2 rounded-full bg-[#8FA66B] animate-pulse" />
            IESCO LIVE
          </span>
        </div>
      </div>
    </aside>
  );
}
