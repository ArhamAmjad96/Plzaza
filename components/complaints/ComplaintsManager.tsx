"use client";

import { useState } from "react";
import { ComplaintItem, ComplaintStats } from "@/lib/complaints/service";
import { UnitItem } from "@/lib/units/service";
import { TenantLeaseView } from "@/lib/tenants/service";
import { formatPKR } from "@/lib/utils/format";
import AddComplaintModal from "./AddComplaintModal";
import ComplaintDetailModal from "./ComplaintDetailModal";
import StatMetric from "@/components/ui/StatMetric";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { Wrench, Search, Plus, ArrowUpRight, CheckCircle2, User } from "lucide-react";

import { ComplaintExpenseItem } from "@/lib/complaints/expenses-service";

interface ComplaintsManagerProps {
  complaints: ComplaintItem[];
  stats: ComplaintStats;
  units: UnitItem[];
  tenants: TenantLeaseView[];
  expenseMap?: Record<string, number>;
  expenses?: ComplaintExpenseItem[];
}

export default function ComplaintsManager({
  complaints,
  stats,
  units,
  tenants,
  expenseMap = {},
  expenses = [],
}: ComplaintsManagerProps) {
  const [selectedTab, setSelectedTab] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);

  const filteredComplaints = complaints.filter((c) => {
    if (selectedTab === "OPEN" && c.status !== "OPEN" && c.status !== "ASSIGNED") return false;
    if (selectedTab === "IN_PROGRESS" && c.status !== "IN_PROGRESS") return false;
    if (selectedTab === "RESOLVED" && c.status !== "RESOLVED" && c.status !== "CLOSED") return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !c.title.toLowerCase().includes(q) &&
        !(c.unit_name || "").toLowerCase().includes(q) &&
        !(c.tenant_name || "").toLowerCase().includes(q) &&
        !(c.assigned_to || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const totalRepairCost = Object.values(expenseMap).reduce((sum, val) => sum + val, 0);
  const openCount = stats.openCount + stats.assignedCount;

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-[#CBD4BC]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FF704D] font-mono">
            BUILDING OPERATIONS
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#17211D]">
            Maintenance & Repairs
          </h1>
          <p className="text-xs text-[#58655E] mt-0.5">
            {openCount} open issue{openCount === 1 ? "" : "s"} · {stats.inProgressCount} in progress · {stats.resolvedCount} resolved
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition shadow-xs"
        >
          <Plus size={14} />
          <span>Report Issue</span>
        </button>
      </div>

      {/* ─── Summary Stat Metrics ─── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatMetric
          label="Open Issues"
          value={openCount.toString().padStart(2, "0")}
          subValue="Awaiting contractor dispatch"
          highlight={openCount > 0}
        />
        <StatMetric
          label="In Progress"
          value={stats.inProgressCount.toString().padStart(2, "0")}
          subValue="Active repair in progress"
        />
        <StatMetric
          label="Resolved Tickets"
          value={stats.resolvedCount.toString().padStart(2, "0")}
          subValue="Completed repair jobs"
        />
        <StatMetric
          label="Total Repair Cost"
          value={formatPKR(totalRepairCost)}
          subValue="Logged maintenance expenses"
        />
      </section>

      {/* ─── Search & Status Filters ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#58655E]" />
          <input
            type="text"
            placeholder="Search issue title, unit, tenant, or worker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] placeholder-[#85918A] focus:border-[#FF704D] transition"
          />
        </div>

        <div className="flex items-center p-1 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-medium text-[#58655E]">
          <button
            type="button"
            onClick={() => setSelectedTab("ALL")}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedTab === "ALL"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            All ({complaints.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab("OPEN")}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedTab === "OPEN"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            Open ({openCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab("IN_PROGRESS")}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedTab === "IN_PROGRESS"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            In Progress ({stats.inProgressCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab("RESOLVED")}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedTab === "RESOLVED"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            Resolved ({stats.resolvedCount})
          </button>
        </div>
      </div>

      {/* ─── Complaints List ─── */}
      {filteredComplaints.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Zero maintenance issues"
          description="All plaza facilities, plumbing, lifts, and electricity lines are functioning smoothly."
          actionText="Log New Issue"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComplaints.map((c) => {
            const cost = expenseMap[c.id.toString()] || 0;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                className="rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] p-6 hover:border-[#8FA66B] transition shadow-xs flex flex-col justify-between space-y-4 cursor-pointer"
              >
                <div>
                  {/* Top: Unit & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
                        {c.unit_name || `Unit #${c.unit_id}`}
                      </span>
                      <h3 className="text-base font-semibold text-[#17211D] mt-0.5">
                        {c.title}
                      </h3>
                      <p className="text-xs text-[#58655E] mt-0.5">
                        Category: {c.category || "General"}
                      </p>
                    </div>

                    <StatusBadge status={c.status} />
                  </div>

                  {/* Description */}
                  {c.description && (
                    <p className="text-xs text-[#58655E] line-clamp-2 mt-3 pt-3 border-t border-[#CBD4BC]/60">
                      {c.description}
                    </p>
                  )}
                </div>

                {/* Bottom: Worker & Cost */}
                <div className="pt-3 border-t border-[#CBD4BC]/60 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-[#58655E]">
                    <User size={12} />
                    <span>{c.assigned_to || "Unassigned"}</span>
                  </div>

                  {cost > 0 && (
                    <span className="font-semibold text-[#17211D]">
                      Cost: {formatPKR(cost)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modals ─── */}
      {showAddModal && (
        <AddComplaintModal
          units={units}
          tenants={tenants}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          expenses={expenses.filter((e) => e.complaint_id?.toString() === selectedComplaint.id.toString())}
          totalExpense={expenseMap[selectedComplaint.id.toString()] || 0}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
    </div>
  );
}
