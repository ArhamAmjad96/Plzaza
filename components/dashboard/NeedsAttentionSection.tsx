"use client";

import Link from "next/link";
import { formatPKR } from "@/lib/utils/format";
import { LedgerItem } from "@/lib/ledgers/service";
import { ComplaintItem } from "@/lib/complaints/service";
import {
  CheckCircle2,
  AlertCircle,
  Zap,
  Wrench,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

interface NeedsAttentionSectionProps {
  overdueLedgers: LedgerItem[];
  openComplaints: ComplaintItem[];
  unpaidBillsCount?: number;
}

export default function NeedsAttentionSection({
  overdueLedgers,
  openComplaints,
  unpaidBillsCount = 0,
}: NeedsAttentionSectionProps) {
  const totalActionable =
    overdueLedgers.length + openComplaints.length + unpaidBillsCount;

  return (
    <div className="rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] p-6 sm:p-8 space-y-6 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#CBD4BC]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#FF704D]">
              PRIORITY ACTION ITEMS
            </span>
            {totalActionable > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#FFF0EB] border border-[#FFD4C7] text-[#FF704D] text-[10px] font-mono font-semibold">
                {totalActionable} Action{totalActionable > 1 ? "s" : ""} Required
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-medium text-[#17211D] mt-0.5">
            Needs Attention
          </h2>
          <p className="text-xs text-[#58655E]">
            Only the items that require immediate manager intervention.
          </p>
        </div>
      </div>

      {/* Actionable Rows */}
      {totalActionable === 0 ? (
        <div className="py-8 px-4 text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E3EFE8] border border-[#BCD8C7] text-[#2D5A43]">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-base font-semibold text-[#17211D]">
            Everything is clear.
          </h3>
          <p className="text-xs text-[#58655E] max-w-sm mx-auto">
            All tenant rent, utility bills, and maintenance repair tickets are completely up to date.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#CBD4BC]/60">
          {/* Overdue Rent Items */}
          {overdueLedgers.map((item) => (
            <div
              key={`rent-${item.tenant_id}-${item.unit_id}`}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#E8EDD9]/40 rounded-xl px-3 transition"
            >
              <div className="flex items-start gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-[#8E3E33] mt-1.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#17211D]">
                      {item.shop_name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FAECE9] text-[#8E3E33] border border-[#EBC1BA]">
                      Rent Due
                    </span>
                  </div>
                  <p className="text-xs text-[#58655E] mt-0.5">
                    Tenant: <strong className="text-[#17211D]">{item.tenant_name}</strong> · Dues: {formatPKR(item.remaining_balance)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pl-5 sm:pl-0 font-mono">
                <span className="text-sm font-semibold text-[#8E3E33]">
                  {formatPKR(item.remaining_balance)}
                </span>
                <Link
                  href={`/units/${item.unit_id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] hover:bg-[#17211D] hover:text-[#F4F7F2] text-xs font-medium text-[#17211D] transition shadow-xs"
                >
                  <span>Record Payment</span>
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          ))}

          {/* Open Maintenance Complaints */}
          {openComplaints.map((c) => (
            <div
              key={`complaint-${c.id}`}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#E8EDD9]/40 rounded-xl px-3 transition"
            >
              <div className="flex items-start gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-[#8C6B32] mt-1.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#17211D]">
                      {c.unit_name || `Unit #${c.unit_id}`}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F9F1E2] text-[#8C6B32] border border-[#E8D3B0]">
                      {c.category || "Maintenance"}
                    </span>
                  </div>
                  <p className="text-xs text-[#58655E] mt-0.5">
                    {c.title || c.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pl-5 sm:pl-0 font-mono">
                <span className="text-xs text-[#8C6B32]">
                  {c.priority} Priority
                </span>
                <Link
                  href="/complaints"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] hover:bg-[#17211D] hover:text-[#F4F7F2] text-xs font-medium text-[#17211D] transition shadow-xs"
                >
                  <span>View Issue</span>
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
