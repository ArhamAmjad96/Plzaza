"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectionViewItem } from "@/lib/electricity/service";
import { UnitItem } from "@/lib/units/service";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import ConnectionUnitMappingModal from "./ConnectionUnitMappingModal";
import ViewBillModal from "@/components/bills/ViewBillModal";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { Zap, Search, ArrowUpRight, Sliders, FileText, Layers, Download } from "lucide-react";

interface ConnectionsManagerProps {
  connections: ConnectionViewItem[];
  allUnits: UnitItem[];
}

export default function ConnectionsManager({
  connections,
  allUnits,
}: ConnectionsManagerProps) {
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "DEDICATED" | "SHARED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [mappingConnection, setMappingConnection] = useState<ConnectionViewItem | null>(null);
  const [viewingBill, setViewingBill] = useState<{
    id?: number | string;
    referenceNumber: string;
    meterNumber?: string;
    consumerName?: string;
    billingMonth?: string;
    billAmount: number;
    unitsConsumed?: number;
    dueDate?: string;
    billStatus?: string;
  } | null>(null);

  const filteredConnections = connections.filter((conn) => {
    if (selectedFilter === "DEDICATED" && conn.is_shared) return false;
    if (selectedFilter === "SHARED" && !conn.is_shared) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = conn.name.toLowerCase().includes(q);
      const matchRef = conn.reference_number.toLowerCase().includes(q);
      const matchMeter = (conn.meter_number || "").toLowerCase().includes(q);
      const matchUnit = conn.mappings.some((m) =>
        m.unit?.unit_name.toLowerCase().includes(q) || m.unit?.unit_number.toLowerCase().includes(q)
      );
      if (!matchName && !matchRef && !matchMeter && !matchUnit) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ─── Filter & Search Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#58655E]" />
          <input
            type="text"
            placeholder="Search meter name, 14-digit reference, or shop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] placeholder-[#85918A] focus:border-[#FF704D] transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center p-1 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-medium text-[#58655E]">
          <button
            type="button"
            onClick={() => setSelectedFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedFilter === "ALL"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            All Meters ({connections.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter("DEDICATED")}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedFilter === "DEDICATED"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            Dedicated ({connections.filter((c) => !c.is_shared).length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter("SHARED")}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedFilter === "SHARED"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            Shared ({connections.filter((c) => c.is_shared).length})
          </button>
        </div>
      </div>

      {/* ─── Connections Grid ─── */}
      {filteredConnections.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No electricity meters found"
          description="Try modifying your search or connect a new IESCO reference number."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredConnections.map((conn) => {
            const bill = conn.latest_bill;
            const isShared = conn.is_shared;

            return (
              <div
                key={conn.id}
                className="rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] p-6 hover:border-[#8FA66B] transition shadow-xs flex flex-col justify-between space-y-5"
              >
                <div>
                  {/* Top: Meter Type & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
                        {isShared ? "SHARED SUB-METER" : "DEDICATED SHOP METER"}
                      </span>
                      <h3 className="text-base font-semibold text-[#17211D] mt-0.5">
                        {conn.name}
                      </h3>
                      <p className="text-xs font-mono text-[#58655E] mt-0.5">
                        Ref: {conn.reference_number}
                      </p>
                    </div>

                    <StatusBadge
                      status={bill ? (bill.status === "paid" ? "PAID" : "UNPAID") : "PENDING"}
                      label={bill ? (bill.status === "paid" ? "Paid" : "Due") : "No Bill"}
                    />
                  </div>

                  {/* Bill Details */}
                  {bill ? (
                    <div className="mt-4 p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-1 font-mono">
                      <span className="text-[10px] uppercase font-sans text-[#58655E]">
                        Latest IESCO Bill ({formatBillingMonth(bill.billing_month)})
                      </span>
                      <p className="text-2xl font-bold text-[#17211D]">
                        {formatPKR(bill.bill_amount)}
                      </p>
                      <p className="text-xs text-[#58655E]">
                        {bill.units_consumed || 165} kWh · Due {bill.due_date || "20th"}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] text-xs text-[#58655E]">
                      Zero monthly bills synced yet for this reference.
                    </div>
                  )}

                  {/* Connected Units / Shared Allocation Diagram */}
                  <div className="mt-4 space-y-1.5 text-xs">
                    <span className="text-[10px] font-mono uppercase font-semibold text-[#58655E]">
                      {isShared ? `Split Across ${conn.mappings.length} Spaces` : "Attached Unit"}
                    </span>
                    <div className="space-y-1">
                      {conn.mappings.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC] font-mono text-[11px]"
                        >
                          <span className="font-sans font-medium text-[#17211D]">
                            {m.unit?.unit_name || `Unit #${m.unit_id}`}
                          </span>
                          <span className="text-[#8FA66B] font-semibold">
                            {m.split_value ? `${m.split_value}%` : "100%"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-[#CBD4BC]/60 flex items-center justify-between gap-2 flex-wrap">
                  {bill ? (
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setViewingBill({
                            id: bill.id,
                            referenceNumber: conn.reference_number,
                            meterNumber: conn.meter_number || undefined,
                            consumerName: conn.name,
                            billingMonth: bill.billing_month,
                            billAmount: bill.bill_amount,
                            unitsConsumed: bill.units_consumed || 165,
                            dueDate: bill.due_date,
                            billStatus: bill.status,
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF704D] hover:underline cursor-pointer"
                      >
                        <FileText size={13} />
                        <span>View Bill</span>
                      </button>

                      <a
                        href={`/api/bills/${bill.id}/download?ref=${encodeURIComponent(conn.reference_number)}&month=${encodeURIComponent(bill.billing_month)}`}
                        download
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] hover:bg-[#E8EDD9] text-xs font-medium text-[#17211D] transition shadow-2xs cursor-pointer"
                        title="Download Bill Document"
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-[#58655E]">No bill file</span>
                  )}

                  {isShared && (
                    <button
                      type="button"
                      onClick={() => setMappingConnection(conn)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-medium text-[#17211D] hover:bg-[#DDE4CF] transition shadow-xs"
                    >
                      <Sliders size={12} />
                      <span>Configure Split</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modals ─── */}
      {mappingConnection && (
        <ConnectionUnitMappingModal
          connection={mappingConnection}
          allUnits={allUnits}
          onClose={() => setMappingConnection(null)}
        />
      )}

      {viewingBill && (
        <ViewBillModal
          billData={viewingBill}
          onClose={() => setViewingBill(null)}
        />
      )}
    </div>
  );
}
