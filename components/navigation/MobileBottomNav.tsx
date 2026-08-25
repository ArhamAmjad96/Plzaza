"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  MoreHorizontal,
  Users,
  Zap,
  Wrench,
  Receipt,
  FileBarChart,
  Sliders,
  X,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  const TABS = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Units", href: "/units", icon: Building2 },
    { name: "Rent", href: "/rent", icon: CreditCard },
  ];

  const MORE_LINKS = [
    { name: "Tenants Directory", href: "/tenants", icon: Users },
    { name: "Electricity Meters", href: "/connections", icon: Zap },
    { name: "Maintenance & Repairs", href: "/complaints", icon: Wrench },
    { name: "Plaza Expenses", href: "/expenses", icon: Receipt },
    { name: "Financial Reports", href: "/reports", icon: FileBarChart },
    { name: "Plaza Setup Wizard", href: "/settings", icon: Sliders },
  ];

  return (
    <>
      {/* ─── Floating Larger Mobile Navigation Pill / Bar ─── */}
      <nav className="lg:hidden fixed bottom-3 left-4 right-4 z-40 bg-[#1B2521]/95 backdrop-blur-md border border-[#32433B] shadow-2xl rounded-2xl px-4 py-3 flex items-center justify-around text-[#F4F7F2]">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-xl transition-all ${
                active
                  ? "text-[#FF704D] bg-[#24332D] font-bold scale-105"
                  : "text-[#85918A] hover:text-[#F4F7F2]"
              }`}
            >
              <Icon size={22} className="shrink-0" />
              <span className="text-xs font-medium mt-1">{tab.name}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setShowMoreDrawer(true)}
          className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-xl transition-all ${
            showMoreDrawer
              ? "text-[#FF704D] bg-[#24332D] font-bold scale-105"
              : "text-[#85918A] hover:text-[#F4F7F2]"
          }`}
        >
          <MoreHorizontal size={22} className="shrink-0" />
          <span className="text-xs font-medium mt-1">More</span>
        </button>
      </nav>

      {/* Expanded More Drawer */}
      {showMoreDrawer && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setShowMoreDrawer(false)}
        >
          <div
            className="w-full bg-[#1B2521] border-t border-[#32433B] rounded-t-3xl p-6 sm:p-8 space-y-5 text-[#F4F7F2] max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#32433B] pb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-[#8FA66B] font-semibold">
                ALL PROPERTY MODULES
              </span>
              <button
                type="button"
                onClick={() => setShowMoreDrawer(false)}
                className="h-8 w-8 rounded-full bg-[#24332D] text-[#85918A] hover:text-[#F4F7F2] flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {MORE_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setShowMoreDrawer(false)}
                    className="p-4 rounded-2xl bg-[#24332D] border border-[#32433B] flex flex-col items-start gap-2.5 hover:border-[#FF704D] transition"
                  >
                    <div className="h-9 w-9 rounded-xl bg-[#1B2521] border border-[#32433B] flex items-center justify-center text-[#FF704D]">
                      <Icon size={18} />
                    </div>
                    <span className="text-xs font-medium text-[#F4F7F2]">
                      {link.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
