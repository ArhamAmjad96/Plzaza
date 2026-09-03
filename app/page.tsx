import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import { getAllUnits } from "@/lib/units/service";
import { getTenantsWithLeases } from "@/lib/tenants/service";
import { getMonthlyLedgers, normalizeBillingMonth, LedgerItem } from "@/lib/ledgers/service";
import { getPlazaExpenses } from "@/lib/expenses/service";
import { getAllComplaints } from "@/lib/complaints/service";
import { getConnectionsWithMappings } from "@/lib/electricity/service";
import AttentionNeededCard from "@/components/dashboard/AttentionNeededCard";
import {
  Building2,
  Users,
  Percent,
  DoorOpen,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileText,
  Wrench,
  Check,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentMonth = normalizeBillingMonth(new Date().toISOString().slice(0, 7));
  const monthKey = currentMonth.slice(0, 7); // e.g. "2026-09"

  // 1. Fetch live data in parallel using existing services (Read-Only)
  const [
    { units, plaza },
    { stats: tenantStats },
    { items: ledgers, stats: ledgerStats },
    { stats: expenseStats },
    { complaints },
    connections,
  ] = await Promise.all([
    getAllUnits(),
    getTenantsWithLeases(),
    getMonthlyLedgers(currentMonth),
    getPlazaExpenses(currentMonth),
    getAllComplaints(),
    getConnectionsWithMappings(),
  ]);

  // ─── Section 1: Property Snapshot Calculations ───
  const totalUnitsCount = units.length;
  const occupiedUnitsCount = units.filter((u) => u.status === "OCCUPIED").length;
  const activeTenantsCount = tenantStats.activeTenants;
  const occupancyPct = totalUnitsCount > 0 ? Math.round((occupiedUnitsCount / totalUnitsCount) * 100) : 0;

  // ─── Section 2: Financial Snapshot Calculations ───
  const expectedRent = ledgerStats.total_expected || 0;
  const rentCollected = ledgerStats.total_collected || 0;
  const outstandingRent = ledgerStats.total_outstanding || 0;
  const expensesThisMonth = expenseStats.totalExpenses || 0;

  // ─── Section 3: Rent Status Counts ───
  const paidRentCount = ledgerStats.paid_count || 0;
  const partialRentCount = ledgerStats.partial_count || 0;
  const unpaidRentCount = ledgerStats.unpaid_count || 0;
  const overdueRentCount = ledgerStats.overdue_count || 0;
  const totalRentAccounts = paidRentCount + partialRentCount + unpaidRentCount + overdueRentCount;

  // ─── Section 4: Electricity Status Calculations ───
  const totalConnectionsCount = connections.length;
  const billsReceivedCount = connections.filter(
    (c) => c.latest_bill && c.latest_bill.billing_month === monthKey
  ).length;
  const billsPendingCount = Math.max(0, totalConnectionsCount - billsReceivedCount);
  const totalElectricityDue = ledgerStats.electricity_outstanding || 0;
  const totalElectricityBilled = connections.reduce((sum, c) => {
    if (c.latest_bill && c.latest_bill.billing_month === monthKey) {
      return sum + Number(c.latest_bill.bill_amount || (c.latest_bill as any).amount || 0);
    }
    return sum;
  }, 0);

  // ─── Section 6: Attention Needed Detailed Lists ───
  const unpaidRentTenants = ledgers
    .filter((l: LedgerItem) => l.remaining_balance > 0 && l.paid_amount === 0)
    .map((l: LedgerItem) => ({
      tenant_id: l.tenant_id,
      tenant_name: l.tenant_name || "Unassigned Tenant",
      unit_id: l.unit_id,
      shop_name: l.shop_name,
      amount_due: l.remaining_balance,
      phone: null,
    }));

  const overdueRentTenants = ledgers
    .filter((l: LedgerItem) => (l as any).is_overdue || (l.remaining_balance > 0 && l.paid_amount > 0))
    .map((l: LedgerItem) => ({
      tenant_id: l.tenant_id,
      tenant_name: l.tenant_name || "Unassigned Tenant",
      unit_id: l.unit_id,
      shop_name: l.shop_name,
      amount_due: l.remaining_balance,
      phone: null,
    }));

  const pendingBillsConnections = connections
    .filter((c) => !c.latest_bill || c.latest_bill.billing_month !== monthKey)
    .map((c) => ({
      connection_id: c.id,
      unit_name: c.name || "Meter Connection",
      reference_number: c.reference_number || "",
    }));

  const openComplaintsList = complaints
    .filter((c) => c.status === "OPEN" || c.status === "ASSIGNED" || c.status === "IN_PROGRESS")
    .map((c) => ({
      id: c.id,
      title: c.title || c.description || "Maintenance Ticket",
      unit_name: c.unit_name,
      priority: c.priority,
      status: c.status,
    }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none">
      {/* ─── PAGE HEADER ─── */}
      <header className="border-b border-[#CBD4BC] pb-6">
        <div className="space-y-1">
          <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#FF704D]">
            {plaza?.name ? plaza.name.toUpperCase() : "PLAZA MANAGEMENT SYSTEM"}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#17211D]">
            {formatBillingMonth(currentMonth)} Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#58655E] pt-0.5">
            Property, rent and utility summary
          </p>
        </div>
      </header>

      {/* ─── SECTION 1: PROPERTY SNAPSHOT (4 KPI CARDS) ─── */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#58655E]">
          Property Snapshot
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-[#58655E]">
              <span className="text-xs font-medium">Total Units</span>
              <Building2 size={16} className="text-[#58655E]" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold font-mono text-[#17211D]">
              {totalUnitsCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-[#58655E]">
              <span className="text-xs font-medium">Occupied Units</span>
              <DoorOpen size={16} className="text-[#2D5A43]" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold font-mono text-[#17211D]">
              {occupiedUnitsCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-[#58655E]">
              <span className="text-xs font-medium">Active Tenants</span>
              <Users size={16} className="text-[#8FA66B]" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold font-mono text-[#17211D]">
              {activeTenantsCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-[#58655E]">
              <span className="text-xs font-medium">Occupancy Rate</span>
              <Percent size={16} className="text-[#FF704D]" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold font-mono text-[#17211D]">
              {occupancyPct}%
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: FINANCIAL SNAPSHOT (4 KPI CARDS) ─── */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#58655E]">
          Financial Snapshot
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[#58655E]">
              <span className="text-xs font-medium">Expected Rent This Month</span>
              <DollarSign size={16} className="text-[#58655E]" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-[#17211D]">
              {formatPKR(expectedRent)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[#58655E]">
              <span className="text-xs font-medium">Rent Collected</span>
              <TrendingUp size={16} className="text-[#2D5A43]" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-[#2D5A43]">
              {formatPKR(rentCollected)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[#58655E]">
              <span className="text-xs font-medium">Outstanding Rent</span>
              <AlertCircle size={16} className="text-[#8E3E33]" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-[#8E3E33]">
              {formatPKR(outstandingRent)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[#58655E]">
              <span className="text-xs font-medium">Expenses This Month</span>
              <Receipt size={16} className="text-[#58655E]" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-[#17211D]">
              {formatPKR(expensesThisMonth)}
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3 & 4: RENT STATUS & ELECTRICITY STATUS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 3: Rent Status */}
        <section className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] p-6 shadow-xs space-y-5">
          <div className="border-b border-[#CBD4BC]/60 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-[#17211D]">
              Rent Status
            </h2>
            <p className="text-xs text-[#58655E]">Current month tenant payment breakdown</p>
          </div>

          {/* Simple Visual Indicator Bar */}
          {totalRentAccounts > 0 && (
            <div className="space-y-1.5">
              <div className="h-2 w-full bg-[#E8EDD9] rounded-full overflow-hidden flex">
                {paidRentCount > 0 && (
                  <div
                    style={{ width: `${(paidRentCount / totalRentAccounts) * 100}%` }}
                    className="bg-[#2D5A43] h-full"
                    title={`Paid: ${paidRentCount}`}
                  />
                )}
                {partialRentCount > 0 && (
                  <div
                    style={{ width: `${(partialRentCount / totalRentAccounts) * 100}%` }}
                    className="bg-[#D97706] h-full"
                    title={`Partially Paid: ${partialRentCount}`}
                  />
                )}
                {unpaidRentCount > 0 && (
                  <div
                    style={{ width: `${(unpaidRentCount / totalRentAccounts) * 100}%` }}
                    className="bg-[#85918A] h-full"
                    title={`Unpaid: ${unpaidRentCount}`}
                  />
                )}
                {overdueRentCount > 0 && (
                  <div
                    style={{ width: `${(overdueRentCount / totalRentAccounts) * 100}%` }}
                    className="bg-[#8E3E33] h-full"
                    title={`Overdue: ${overdueRentCount}`}
                  />
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#E8EDD9]/60 border border-[#CBD4BC]/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#2D5A43]" />
                <span className="font-medium text-[#17211D]">Paid</span>
              </div>
              <span className="font-mono font-bold text-[#17211D] text-sm">{paidRentCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC]/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#D97706]" />
                <span className="font-medium text-[#17211D]">Partially Paid</span>
              </div>
              <span className="font-mono font-bold text-[#17211D] text-sm">{partialRentCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC]/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#85918A]" />
                <span className="font-medium text-[#17211D]">Unpaid</span>
              </div>
              <span className="font-mono font-bold text-[#17211D] text-sm">{unpaidRentCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAECE9] border border-[#EBC1BA]/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#8E3E33]" />
                <span className="font-medium text-[#8E3E33]">Overdue</span>
              </div>
              <span className="font-mono font-bold text-[#8E3E33] text-sm">{overdueRentCount}</span>
            </div>
          </div>
        </section>

        {/* Section 4: Electricity Status */}
        <section className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] p-6 shadow-xs space-y-5">
          <div className="border-b border-[#CBD4BC]/60 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-[#17211D]">
              Electricity Status
            </h2>
            <p className="text-xs text-[#58655E]">Utility connections and billing progress</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC]/60 space-y-1">
              <span className="text-[11px] text-[#58655E] block">Total Connections</span>
              <span className="font-mono font-bold text-[#17211D] text-lg block">{totalConnectionsCount}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#E8EDD9]/60 border border-[#CBD4BC]/60 space-y-1">
              <span className="text-[11px] text-[#58655E] block">Bills Received</span>
              <span className="font-mono font-bold text-[#2D5A43] text-lg block">{billsReceivedCount}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC]/60 space-y-1">
              <span className="text-[11px] text-[#58655E] block">Bills Pending</span>
              <span className="font-mono font-bold text-[#FF704D] text-lg block">{billsPendingCount}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC]/60 space-y-1">
              <span className="text-[11px] text-[#58655E] block">Total Electricity Due</span>
              <span className="font-mono font-bold text-[#17211D] text-sm block truncate" title={formatPKR(totalElectricityDue)}>
                {formatPKR(totalElectricityDue)}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ─── SECTION 5 & 6: CURRENT MONTH SUMMARY & ATTENTION NEEDED ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 5: Current Month Summary */}
        <section className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] p-6 shadow-xs space-y-4">
          <div className="border-b border-[#CBD4BC]/60 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-[#17211D]">
              {formatBillingMonth(currentMonth)} Summary
            </h2>
            <p className="text-xs text-[#58655E]">High-level financial flow for the month</p>
          </div>

          <div className="divide-y divide-[#CBD4BC]/50 text-xs font-mono">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#58655E] font-sans">Rent Generated</span>
              <span className="font-bold text-[#17211D]">{formatPKR(expectedRent)}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#58655E] font-sans">Rent Collected</span>
              <span className="font-bold text-[#2D5A43]">{formatPKR(rentCollected)}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#58655E] font-sans">Electricity Billed</span>
              <span className="font-bold text-[#17211D]">{formatPKR(totalElectricityBilled)}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#58655E] font-sans">Expenses</span>
              <span className="font-bold text-[#17211D]">{formatPKR(expensesThisMonth)}</span>
            </div>
          </div>
        </section>

        {/* Section 6: Interactive Attention Needed Card with Expandable Dropdowns */}
        <AttentionNeededCard
          unpaidRentTenants={unpaidRentTenants}
          overdueRentTenants={overdueRentTenants}
          pendingBillsConnections={pendingBillsConnections}
          openComplaintsList={openComplaintsList}
        />
      </div>
    </div>
  );
}