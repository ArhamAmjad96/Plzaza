"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  History,
  Search,
  Building2,
  Users,
  CreditCard,
  Zap,
  Wrench,
  Receipt,
  Sparkles,
  Trash2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { clearAllLogsAction } from "@/app/logs/actions";
import { ActivityLogItem } from "@/lib/logs/service";

interface AuditLogManagerProps {
  initialLogs: ActivityLogItem[];
  totalLogs: number;
}

const CATEGORIES = [
  { id: "ALL", label: "All Activity", icon: History },
  { id: "PLAZA", label: "Plaza Setup", icon: Building2 },
  { id: "UNITS", label: "Shops & Units", icon: Building2 },
  { id: "TENANTS", label: "Tenants & Leases", icon: Users },
  { id: "PAYMENTS", label: "Rent & Payments", icon: CreditCard },
  { id: "ELECTRICITY", label: "Electricity Meters", icon: Zap },
  { id: "MAINTENANCE", label: "Maintenance", icon: Wrench },
  { id: "EXPENSES", label: "Plaza Expenses", icon: Receipt },
];

export default function AuditLogManager({
  initialLogs,
  totalLogs,
}: AuditLogManagerProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [clearing, setClearing] = useState(false);

  const filteredLogs = initialLogs.filter((log) => {
    const matchesCategory =
      selectedCategory === "ALL" ||
      log.category.toUpperCase() === selectedCategory.toUpperCase();

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.title.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.actor && log.actor.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  async function handleClearLogs() {
    if (!confirm("Are you sure you want to clear all activity and audit logs? This cannot be undone.")) {
      return;
    }
    setClearing(true);
    try {
      await clearAllLogsAction();
      router.refresh();
    } finally {
      setClearing(false);
    }
  }

  function getCategoryColor(cat: string) {
    switch (cat?.toUpperCase()) {
      case "PLAZA":
        return { bg: "bg-[#FF704D]/15", text: "text-[#FF704D]", border: "border-[#FF704D]/30" };
      case "UNITS":
        return { bg: "bg-[#2D5A27]/15", text: "text-[#2D5A27]", border: "border-[#2D5A27]/30" };
      case "TENANTS":
        return { bg: "bg-[#3B82F6]/15", text: "text-[#3B82F6]", border: "border-[#3B82F6]/30" };
      case "PAYMENTS":
        return { bg: "bg-[#10B981]/15", text: "text-[#10B981]", border: "border-[#10B981]/30" };
      case "ELECTRICITY":
        return { bg: "bg-[#F59E0B]/15", text: "text-[#F59E0B]", border: "border-[#F59E0B]/30" };
      case "MAINTENANCE":
        return { bg: "bg-[#EF4444]/15", text: "text-[#EF4444]", border: "border-[#EF4444]/30" };
      case "EXPENSES":
        return { bg: "bg-[#8B5CF6]/15", text: "text-[#8B5CF6]", border: "border-[#8B5CF6]/30" };
      default:
        return { bg: "bg-[#8FA66B]/15", text: "text-[#8FA66B]", border: "border-[#8FA66B]/30" };
    }
  }

  function getCategoryIcon(cat: string) {
    switch (cat?.toUpperCase()) {
      case "PLAZA":
        return <Building2 size={18} className="text-[#FF704D]" />;
      case "UNITS":
        return <Building2 size={18} className="text-[#2D5A27]" />;
      case "TENANTS":
        return <Users size={18} className="text-[#3B82F6]" />;
      case "PAYMENTS":
        return <CreditCard size={18} className="text-[#10B981]" />;
      case "ELECTRICITY":
        return <Zap size={18} className="text-[#F59E0B]" />;
      case "MAINTENANCE":
        return <Wrench size={18} className="text-[#EF4444]" />;
      case "EXPENSES":
        return <Receipt size={18} className="text-[#8B5CF6]" />;
      default:
        return <History size={18} className="text-[#58655E]" />;
    }
  }

  function formatLogTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function getTargetLink(log: ActivityLogItem): string {
    switch (log.category) {
      case "PLAZA":
        return "/settings";
      case "UNITS":
        return log.metadata && log.metadata.unitNumber ? `/units/${log.metadata.unitNumber}` : "/units";
      case "TENANTS":
        return "/tenants";
      case "PAYMENTS":
        return "/rent";
      case "ELECTRICITY":
        return "/connections";
      case "MAINTENANCE":
        return "/complaints";
      case "EXPENSES":
        return "/expenses";
      default:
        return "/";
    }
  }

  const plazaCount = initialLogs.filter((l) => l.category === "PLAZA").length;
  const unitsCount = initialLogs.filter((l) => l.category === "UNITS").length;
  const tenantsCount = initialLogs.filter((l) => l.category === "TENANTS").length;
  const paymentsCount = initialLogs.filter((l) => l.category === "PAYMENTS").length;

  return (
    <div className="space-y-8">
      {/* ─── Header Banner ─── */}
      <section className="rounded-3xl bg-[#E8EDD9] border border-[#CBD4BC] p-6 sm:p-10 shadow-xs space-y-6 text-[#17211D]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#CBD4BC] pb-6">
          <div className="space-y-1.5">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF704D]">
              SECURITY & OPERATIONS AUDIT
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17211D]">
              System Activity & Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-[#58655E] max-w-xl">
              Complete historical record of all actions performed across your plaza: structural setups, unit creation, tenant onboardings, payments, and meter connections.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {initialLogs.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                disabled={clearing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] hover:border-red-400 text-xs font-bold text-[#58655E] hover:text-red-600 transition shadow-xs"
              >
                <Trash2 size={15} />
                <span>{clearing ? "Clearing..." : "Clear Log History"}</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── Metric Cards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs">
            <span className="text-[11px] font-mono uppercase text-[#58655E]">Total Events</span>
            <p className="text-2xl font-bold font-mono text-[#17211D] mt-1">{totalLogs}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs">
            <span className="text-[11px] font-mono uppercase text-[#58655E]">Plaza Events</span>
            <p className="text-2xl font-bold font-mono text-[#FF704D] mt-1">{plazaCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs">
            <span className="text-[11px] font-mono uppercase text-[#58655E]">Tenant & Unit Actions</span>
            <p className="text-2xl font-bold font-mono text-[#3B82F6] mt-1">{tenantsCount + unitsCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs">
            <span className="text-[11px] font-mono uppercase text-[#58655E]">Payments Logged</span>
            <p className="text-2xl font-bold font-mono text-[#10B981] mt-1">{paymentsCount}</p>
          </div>
        </div>
      </section>

      {/* ─── Search and Category Tabs ─── */}
      <section className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#58655E]" />
          <input
            type="text"
            placeholder="Search audit logs by keyword, tenant name, unit number, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-sm text-[#17211D] placeholder-[#85918A] focus:outline-hidden focus:ring-2 focus:ring-[#8FA66B] shadow-xs"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition shadow-xs ${
                  active
                    ? "bg-[#17211D] text-[#F4F7F2]"
                    : "bg-[#FAF6F0] border border-[#CBD4BC] text-[#58655E] hover:bg-[#E8EDD9] hover:text-[#17211D]"
                }`}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Activity Log Timeline Feed ─── */}
      <section className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] p-12 text-center space-y-3 shadow-xs">
            <div className="h-12 w-12 rounded-2xl bg-[#E8EDD9] text-[#58655E] mx-auto flex items-center justify-center">
              <History size={24} />
            </div>
            <h3 className="text-base font-bold text-[#17211D]">No activity logs found</h3>
            <p className="text-xs text-[#58655E] max-w-sm mx-auto">
              {searchQuery || selectedCategory !== "ALL"
                ? "No log entries match your selected filter criteria."
                : "Activity will automatically record here whenever you configure plaza details, add units, onboard tenants, or record payments."}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const colors = getCategoryColor(log.category);
            const targetHref = getTargetLink(log);

            return (
              <div
                key={log.id}
                className="group rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] p-5 sm:p-6 shadow-xs hover:border-[#8FA66B] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {/* Category Icon Square */}
                  <div className="mt-0.5 h-11 w-11 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] flex items-center justify-center shrink-0 shadow-xs">
                    {getCategoryIcon(log.category)}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold font-mono uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border}`}>
                        {log.category}
                      </span>
                      <span className="text-[11px] font-mono text-[#85918A]">
                        {log.action}
                      </span>
                      <span className="hidden sm:inline-block text-[#CBD4BC]">·</span>
                      <span className="text-[11px] text-[#58655E] font-mono inline-flex items-center gap-1">
                        <Clock size={12} className="text-[#85918A]" />
                        {formatLogTime(log.created_at)}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#17211D] leading-snug">
                      {log.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#58655E] leading-relaxed">
                      {log.description}
                    </p>
                  </div>
                </div>

                {/* Right Action Link */}
                <div className="shrink-0 flex items-center justify-end">
                  <Link
                    href={targetHref}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#E8EDD9] hover:bg-[#17211D] hover:text-[#F4F7F2] text-[#17211D] transition shadow-xs group-hover:scale-102"
                  >
                    <span>View Module</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
