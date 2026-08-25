"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FinancialOverviewReport } from "@/lib/reports/service";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import StatMetric from "@/components/ui/StatMetric";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  FileBarChart,
  Calendar,
  Printer,
  TrendingUp,
  Building2,
  Zap,
  ShieldCheck,
  Receipt,
} from "lucide-react";

interface ReportsManagerProps {
  report: FinancialOverviewReport;
}

type ReportTab = "PNL" | "RENT" | "ELECTRICITY" | "SECURITY";

export default function ReportsManager({ report }: ReportsManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ReportTab>("PNL");

  function handleMonthChange(newMonth: string) {
    router.push(`/reports?month=${newMonth}`);
  }

  function handlePrint() {
    window.print();
  }

  const grossIncome = report.grossRevenue;
  const totalOutflows = report.totalOperatingExpenses;
  const netIncome = report.netProfit;

  return (
    <div className="space-y-8">
      {/* ─── Header & Period Selector ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-[#CBD4BC] print:hidden">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FF704D] font-mono">
            EXECUTIVE AUDIT & P&L
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#17211D]">
            Financial Reports
          </h1>
          <p className="text-xs text-[#58655E] mt-0.5">
            Net income statement and ledger audit for {formatBillingMonth(report.selectedMonth)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D]">
            <Calendar size={13} className="text-[#58655E]" />
            <input
              type="month"
              value={report.selectedMonth === "ALL" ? "" : report.selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="border-none bg-transparent font-mono text-xs text-[#17211D] focus:ring-0 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition shadow-xs"
          >
            <Printer size={14} />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* ─── Visual Net Income Equation Hero ─── */}
      <section className="rounded-3xl border border-[#D9C4AC] bg-[#E7D4BE] p-8 sm:p-12 text-[#17211D] space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#D9C4AC]/80 pb-3">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#7D6F5D]">
            MONTHLY NET PLAZA EARNINGS
          </span>
          <span className="text-xs font-mono font-semibold text-[#17211D]">
            {formatBillingMonth(report.selectedMonth).toUpperCase()}
          </span>
        </div>

        {/* Visual Equation Banner */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center text-center font-mono">
          {/* 1. Gross Inflows */}
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#D9C4AC] space-y-1">
            <span className="text-[10px] uppercase font-sans text-[#58655E] block">Gross Revenue</span>
            <p className="text-xl sm:text-2xl font-bold text-[#17211D]">
              {formatPKR(grossIncome)}
            </p>
            <p className="text-[11px] text-[#58655E] font-sans">Rent + Utilities</p>
          </div>

          <div className="text-2xl font-bold text-[#7D6F5D] hidden md:block">−</div>

          {/* 2. Total Outflows */}
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#D9C4AC] space-y-1">
            <span className="text-[10px] uppercase font-sans text-[#58655E] block">Total Expenses</span>
            <p className="text-xl sm:text-2xl font-bold text-[#8E3E33]">
              {formatPKR(totalOutflows)}
            </p>
            <p className="text-[11px] text-[#58655E] font-sans">Diesel, Guards, Repairs</p>
          </div>

          <div className="text-2xl font-bold text-[#7D6F5D] hidden md:block">=</div>

          {/* 3. Net Profit */}
          <div className="p-4 rounded-2xl bg-[#17211D] border border-[#24332D] text-[#F4F7F2] space-y-1 shadow-sm">
            <span className="text-[10px] uppercase font-sans text-[#8FA66B] block">Net Income</span>
            <p className="text-2xl sm:text-3xl font-bold text-[#F4F7F2]">
              {formatPKR(netIncome)}
            </p>
            <p className="text-[11px] text-[#85918A] font-sans">Net Cash Retained</p>
          </div>
        </div>
      </section>

      {/* ─── Audit Report Tabs ─── */}
      <div className="flex items-center p-1 rounded-2xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-medium text-[#58655E] print:hidden max-w-xl">
        <button
          type="button"
          onClick={() => setActiveTab("PNL")}
          className={`flex-1 py-2 rounded-xl transition ${
            activeTab === "PNL" ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold" : "hover:text-[#17211D]"
          }`}
        >
          P&L Summary
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("RENT")}
          className={`flex-1 py-2 rounded-xl transition ${
            activeTab === "RENT" ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold" : "hover:text-[#17211D]"
          }`}
        >
          Rent Roll ({report.rentLedgers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ELECTRICITY")}
          className={`flex-1 py-2 rounded-xl transition ${
            activeTab === "ELECTRICITY" ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold" : "hover:text-[#17211D]"
          }`}
        >
          Electricity ({report.electricityBills.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("SECURITY")}
          className={`flex-1 py-2 rounded-xl transition ${
            activeTab === "SECURITY" ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold" : "hover:text-[#17211D]"
          }`}
        >
          Security Deposits ({report.securityDeposits.length})
        </button>
      </div>

      {/* ─── Tab 1: P&L Statement ─── */}
      {activeTab === "PNL" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inflows Breakdown */}
          <div className="rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-[#17211D] border-b border-[#CBD4BC]/60 pb-3 flex items-center justify-between">
              <span>Operating Income (Inflows)</span>
              <span className="font-mono text-[#2D5A43]">{formatPKR(grossIncome)}</span>
            </h3>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[#58655E]">Monthly Rent Collected</span>
                <span className="font-semibold text-[#17211D]">{formatPKR(report.rentCollected)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[#58655E]">Electricity Utility Recoveries</span>
                <span className="font-semibold text-[#17211D]">{formatPKR(report.otherIncome)}</span>
              </div>
            </div>
          </div>

          {/* Outflows Breakdown */}
          <div className="rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-[#17211D] border-b border-[#CBD4BC]/60 pb-3 flex items-center justify-between">
              <span>Operating Outflows (Expenses)</span>
              <span className="font-mono text-[#8E3E33]">{formatPKR(totalOutflows)}</span>
            </h3>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[#58655E]">General Plaza Overheads</span>
                <span className="font-semibold text-[#17211D]">{formatPKR(report.generalExpensesTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[#58655E]">Maintenance & Repair Costs</span>
                <span className="font-semibold text-[#17211D]">{formatPKR(report.maintenanceExpensesTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 2: Rent Roll ─── */}
      {activeTab === "RENT" && (
        <div className="rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#E8EDD9] text-[10px] uppercase font-semibold text-[#58655E] border-b border-[#CBD4BC]">
              <tr>
                <th className="py-3.5 px-4">Space</th>
                <th className="py-3.5 px-4">Tenant</th>
                <th className="py-3.5 px-4 text-right">Rent</th>
                <th className="py-3.5 px-4 text-right">Electricity</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD4BC]/60">
              {report.rentLedgers.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#E8EDD9]/40 transition">
                  <td className="py-3.5 px-4 font-sans font-semibold text-[#17211D]">{item.shop_name}</td>
                  <td className="py-3.5 px-4 text-[#58655E] font-sans">{item.tenant_name}</td>
                  <td className="py-3.5 px-4 text-right text-[#58655E]">{formatPKR(item.rent_amount)}</td>
                  <td className="py-3.5 px-4 text-right text-[#58655E]">{formatPKR(item.electricity_amount)}</td>
                  <td className="py-3.5 px-4 text-right text-[#2D5A43] font-semibold">{formatPKR(item.rent_paid)}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-[#8E3E33]">{formatPKR(item.remaining_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Tab 3: Electricity Register ─── */}
      {activeTab === "ELECTRICITY" && (
        <div className="rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#E8EDD9] text-[10px] uppercase font-semibold text-[#58655E] border-b border-[#CBD4BC]">
              <tr>
                <th className="py-3.5 px-4">Meter Name</th>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4 text-right">Units</th>
                <th className="py-3.5 px-4 text-right">Bill Amount</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD4BC]/60">
              {report.electricityBills.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#E8EDD9]/40 transition">
                  <td className="py-3.5 px-4 font-sans font-semibold text-[#17211D]">{item.connection_name}</td>
                  <td className="py-3.5 px-4 text-[#58655E]">{item.reference_number}</td>
                  <td className="py-3.5 px-4 text-right text-[#58655E]">{item.units_consumed || 165} kWh</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-[#17211D]">{formatPKR(item.bill_amount)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <StatusBadge status={item.status === "paid" ? "PAID" : "UNPAID"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Tab 4: Security Registry ─── */}
      {activeTab === "SECURITY" && (
        <div className="rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#E8EDD9] text-[10px] uppercase font-semibold text-[#58655E] border-b border-[#CBD4BC]">
              <tr>
                <th className="py-3.5 px-4">Space</th>
                <th className="py-3.5 px-4">Tenant</th>
                <th className="py-3.5 px-4 text-right">Required</th>
                <th className="py-3.5 px-4 text-right">Paid Advance</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD4BC]/60">
              {report.securityDeposits.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#E8EDD9]/40 transition">
                  <td className="py-3.5 px-4 font-sans font-semibold text-[#17211D]">{item.unit_name}</td>
                  <td className="py-3.5 px-4 text-[#58655E] font-sans">{item.tenant_name}</td>
                  <td className="py-3.5 px-4 text-right text-[#58655E]">{formatPKR(item.security_amount)}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-[#2D5A43]">{formatPKR(item.security_paid)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-[10px] text-[#2D5A43]">
                      {item.security_paid >= item.security_amount ? "Fully Held ✓" : "Partial"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
