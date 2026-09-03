"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Zap,
  CreditCard,
  Wrench,
} from "lucide-react";

const MOBILE_ITEMS = [
  { name: "Overview", href: "/tenant", icon: LayoutDashboard },
  { name: "Space", href: "/tenant/unit", icon: Building2 },
  { name: "Bills", href: "/tenant/bills", icon: Zap },
  { name: "Payments", href: "/tenant/payments", icon: CreditCard },
  { name: "Support", href: "/tenant/complaints", icon: Wrench },
];

export default function TenantMobileNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/tenant") return pathname === "/tenant";
    return pathname.startsWith(href);
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1B2521]/95 backdrop-blur-md border-t border-[#32433B] px-2 py-1.5">
      <div className="flex items-center justify-around">
        {MOBILE_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold transition ${
                active ? "text-[#FF704D] bg-[#24332D]" : "text-[#A0B0A5] hover:text-[#F4F7F2]"
              }`}
            >
              <Icon size={17} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}