"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPKR } from "@/lib/utils/format";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
  CreditCard,
  Zap,
  Wrench,
  ArrowUpRight,
  ExternalLink,
  Phone,
  Building2,
} from "lucide-react";

export interface AttentionTenantItem {
  tenant_id?: string | number | null;
  tenant_name: string;
  unit_id?: string | number | null;
  shop_name: string;
  amount_due: number;
  phone?: string | null;
}

export interface AttentionConnectionItem {
  connection_id: string | number;
  unit_name: string;
  reference_number: string;
}

export interface AttentionComplaintItem {
  id: string | number;
  title: string;
  unit_name?: string;
  priority: string;
  status: string;
}

export interface AttentionNeededCardProps {
  unpaidRentTenants: AttentionTenantItem[];
  overdueRentTenants: AttentionTenantItem[];
  pendingBillsConnections: AttentionConnectionItem[];
  openComplaintsList: AttentionComplaintItem[];
}

export default function AttentionNeededCard({
  unpaidRentTenants,
  overdueRentTenants,
  pendingBillsConnections,
  openComplaintsList,
}: AttentionNeededCardProps) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    unpaidRent: true, // Expand unpaid rent by default so admin sees it immediately
    overdueRent: false,
    pendingBills: false,
    openComplaints: false,
  });

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  const hasAnyItems =
    unpaidRentTenants.length > 0 ||
    overdueRentTenants.length > 0 ||
    pendingBillsConnections.length > 0 ||
    openComplaintsList.length > 0;

  return (
    <section className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] p-6 shadow-xs space-y-4 select-none">
      <div className="border-b border-[#CBD4BC]/60 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-[#17211D]">
          Attention Needed
        </h2>
        <p className="text-xs text-[#58655E]">
          Items requiring operational awareness · Click on any item to view details
        </p>
      </div>

      {!hasAnyItems ? (
        <div className="py-6 flex items-center gap-3 text-[#2D5A43]">
          <div className="h-9 w-9 rounded-xl bg-[#E3EFE8] border border-[#BCD8C7] flex items-center justify-center shrink-0">
            <Check size={18} />
          </div>
          <div>
            <p className="font-semibold text-sm text-[#17211D]">Everything looks up to date.</p>
            <p className="text-xs text-[#58655E]">No urgent rent, utility, or maintenance issues.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 1. Unpaid Rent Accordion */}
          {unpaidRentTenants.length > 0 && (
            <div className="rounded-2xl border border-[#FDE68A] bg-[#FFF9EB] overflow-hidden transition-all shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection("unpaidRent")}
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#FEF3C7]/60 transition cursor-pointer text-[#92400E]"
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle size={16} className="shrink-0 text-[#D97706]" />
                  <span className="font-semibold text-xs text-[#92400E]">
                    {unpaidRentTenants.length} {unpaidRentTenants.length === 1 ? "tenant has" : "tenants have"} unpaid rent for this month
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                  <span className="text-[11px] text-[#B45309]">
                    {expandedSections.unpaidRent ? "Hide Details" : "View Tenants"}
                  </span>
                  {expandedSections.unpaidRent ? (
                    <ChevronUp size={15} className="text-[#92400E]" />
                  ) : (
                    <ChevronDown size={15} className="text-[#92400E]" />
                  )}
                </div>
              </button>

              {expandedSections.unpaidRent && (
                <div className="border-t border-[#FDE68A] bg-[#FAF6F0] p-3 space-y-2">
                  <div className="divide-y divide-[#CBD4BC]/50">
                    {unpaidRentTenants.map((t, idx) => (
                      <div
                        key={idx}
                        className="py-2.5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-[#17211D] text-[#8FA66B] flex items-center justify-center font-bold text-xs shrink-0">
                            {t.tenant_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[#17211D] truncate">
                              {t.tenant_id ? (
                                <Link
                                  href={`/tenants/${t.tenant_id}`}
                                  className="hover:text-[#FF704D] hover:underline"
                                >
                                  {t.tenant_name}
                                </Link>
                              ) : (
                                t.tenant_name
                              )}
                            </p>
                            <p className="text-[11px] font-mono text-[#58655E] truncate">
                              {t.shop_name} {t.phone ? `· ${t.phone}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 font-mono shrink-0">
                          <span className="font-bold text-xs text-[#92400E]">
                            {formatPKR(t.amount_due)}
                          </span>
                          <Link
                            href={t.tenant_id ? `/rent?search=${encodeURIComponent(t.tenant_name)}` : "/rent"}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#17211D] text-[#F4F7F2] text-[11px] font-sans font-medium hover:bg-[#24332D] transition shadow-2xs"
                          >
                            <span>Record</span>
                            <ArrowUpRight size={11} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Overdue Rent Accordion */}
          {overdueRentTenants.length > 0 && (
            <div className="rounded-2xl border border-[#EBC1BA] bg-[#FAECE9] overflow-hidden transition-all shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection("overdueRent")}
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#F5D8D4]/60 transition cursor-pointer text-[#8E3E33]"
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle size={16} className="shrink-0 text-[#8E3E33]" />
                  <span className="font-semibold text-xs text-[#8E3E33]">
                    {overdueRentTenants.length} {overdueRentTenants.length === 1 ? "tenant has" : "tenants have"} overdue rent
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                  <span className="text-[11px]">
                    {expandedSections.overdueRent ? "Hide Details" : "View Tenants"}
                  </span>
                  {expandedSections.overdueRent ? (
                    <ChevronUp size={15} className="text-[#8E3E33]" />
                  ) : (
                    <ChevronDown size={15} className="text-[#8E3E33]" />
                  )}
                </div>
              </button>

              {expandedSections.overdueRent && (
                <div className="border-t border-[#EBC1BA] bg-[#FAF6F0] p-3 space-y-2">
                  <div className="divide-y divide-[#CBD4BC]/50">
                    {overdueRentTenants.map((t, idx) => (
                      <div
                        key={idx}
                        className="py-2.5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-[#8E3E33] text-[#FAF6F0] flex items-center justify-center font-bold text-xs shrink-0">
                            {t.tenant_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[#17211D] truncate">
                              {t.tenant_id ? (
                                <Link
                                  href={`/tenants/${t.tenant_id}`}
                                  className="hover:text-[#FF704D] hover:underline"
                                >
                                  {t.tenant_name}
                                </Link>
                              ) : (
                                t.tenant_name
                              )}
                            </p>
                            <p className="text-[11px] font-mono text-[#58655E] truncate">
                              {t.shop_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 font-mono shrink-0">
                          <span className="font-bold text-xs text-[#8E3E33]">
                            {formatPKR(t.amount_due)}
                          </span>
                          <Link
                            href={t.tenant_id ? `/rent?search=${encodeURIComponent(t.tenant_name)}` : "/rent"}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8E3E33] text-[#FAF6F0] text-[11px] font-sans font-medium hover:bg-[#723229] transition shadow-2xs"
                          >
                            <span>Clear Due</span>
                            <ArrowUpRight size={11} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Pending Electricity Bills Accordion */}
          {pendingBillsConnections.length > 0 && (
            <div className="rounded-2xl border border-[#CBD4BC] bg-[#E8EDD9]/60 overflow-hidden transition-all shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection("pendingBills")}
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#E8EDD9] transition cursor-pointer text-[#17211D]"
              >
                <div className="flex items-center gap-2.5">
                  <Zap size={16} className="shrink-0 text-[#FF704D]" />
                  <span className="font-semibold text-xs text-[#17211D]">
                    {pendingBillsConnections.length} electricity {pendingBillsConnections.length === 1 ? "bill has" : "bills have"} not been received yet
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                  <span className="text-[11px] text-[#58655E]">
                    {expandedSections.pendingBills ? "Hide Meters" : "View Meters"}
                  </span>
                  {expandedSections.pendingBills ? (
                    <ChevronUp size={15} />
                  ) : (
                    <ChevronDown size={15} />
                  )}
                </div>
              </button>

              {expandedSections.pendingBills && (
                <div className="border-t border-[#CBD4BC] bg-[#FAF6F0] p-3 space-y-2">
                  <div className="divide-y divide-[#CBD4BC]/50">
                    {pendingBillsConnections.map((c, idx) => (
                      <div
                        key={idx}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-bold text-xs text-[#17211D]">
                            {c.unit_name}
                          </p>
                          <p className="text-[11px] font-mono text-[#58655E]">
                            IESCO Ref: {c.reference_number || "No Ref"}
                          </p>
                        </div>

                        <Link
                          href={`/connections/${c.connection_id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#CBD4BC] bg-[#E8EDD9] text-[#17211D] text-[11px] font-sans font-medium hover:bg-[#DDE4CF] transition shadow-2xs"
                        >
                          <span>Fetch Bill</span>
                          <ArrowUpRight size={11} />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Open Maintenance Complaints Accordion */}
          {openComplaintsList.length > 0 && (
            <div className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] overflow-hidden transition-all shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection("openComplaints")}
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#E8EDD9]/40 transition cursor-pointer text-[#17211D]"
              >
                <div className="flex items-center gap-2.5">
                  <Wrench size={16} className="shrink-0 text-[#8FA66B]" />
                  <span className="font-semibold text-xs text-[#17211D]">
                    {openComplaintsList.length} maintenance {openComplaintsList.length === 1 ? "complaint is" : "complaints are"} currently open
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                  <span className="text-[11px] text-[#58655E]">
                    {expandedSections.openComplaints ? "Hide" : "View"}
                  </span>
                  {expandedSections.openComplaints ? (
                    <ChevronUp size={15} />
                  ) : (
                    <ChevronDown size={15} />
                  )}
                </div>
              </button>

              {expandedSections.openComplaints && (
                <div className="border-t border-[#CBD4BC] bg-[#FAF6F0] p-3 space-y-2">
                  <div className="divide-y divide-[#CBD4BC]/50">
                    {openComplaintsList.map((c, idx) => (
                      <div
                        key={idx}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-bold text-xs text-[#17211D]">
                            {c.title}
                          </p>
                          <p className="text-[11px] font-mono text-[#58655E]">
                            {c.unit_name || "Plaza"} · {c.priority} Priority
                          </p>
                        </div>

                        <Link
                          href="/complaints"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#CBD4BC] bg-[#E8EDD9] text-[#17211D] text-[11px] font-sans font-medium hover:bg-[#DDE4CF] transition shadow-2xs"
                        >
                          <span>Manage</span>
                          <ArrowUpRight size={11} />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
