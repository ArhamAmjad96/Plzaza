import Link from "next/link";
import { getTenantContext } from "@/lib/auth/tenant-context";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import StatusBadge from "@/components/ui/StatusBadge";
import TenantDueNotificationBar from "@/components/tenant/TenantDueNotificationBar";
import {
  Building2,
  Zap,
  CreditCard,
  FileText,
  Wrench,
  ArrowRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Bell,
} from "lucide-react";

export default async function TenantDashboardPage() {
  const context = await getTenantContext();
  const { tenant, lease, unit, electricity, payments, ledgers, complaints, outstandingBalance } = context;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const latestBill = electricity.latestBill;
  const recentPayments = payments.slice(0, 3);
  const recentComplaints = complaints.slice(0, 3);

  return (
    <div className="space-y-6 select-none">
      {/* ─── 10th Due Date Alert & Admin Notification Bar ─── */}
      <TenantDueNotificationBar
        outstandingBalance={outstandingBalance}
        monthlyRent={lease?.monthly_rent || 0}
        currentMonth={currentMonth}
        unitName={unit?.unit_name}
        tenantName={tenant?.full_name || context.user.fullName}
      />

      {/* ─── Hero Welcome Banner ─── */}
      <div className="rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#FF704D]">
              COMMERCIAL RESIDENT PORTAL
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#E8EDD9] text-[10px] font-mono font-bold text-[#17211D]">
              {unit?.unit_name || "Unassigned"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17211D] mt-1">
            Welcome, {tenant?.full_name || context.user.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-[#58655E] mt-1">
            {unit ? `${unit.unit_name} · ${unit.floor} Floor · ${unit.unit_type}` : "No active space assigned yet."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] text-right font-mono">
            <span className="text-[10px] uppercase text-[#58655E] block font-sans">Current Month</span>
            <span className="text-sm font-bold text-[#17211D]">{formatBillingMonth(currentMonth)}</span>
          </div>
        </div>
      </div>

      {/* ─── Key Metrics Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Monthly Base Rent */}
        <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#58655E]">
              MONTHLY RENT
            </span>
            <CreditCard size={16} className="text-[#8FA66B]" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#17211D]">
            {lease ? formatPKR(lease.monthly_rent) : "—"}
          </p>
          <p className="text-[11px] text-[#58655E]">
            {lease ? `Due 1st of each month` : "No active lease recorded"}
          </p>
        </div>

        {/* Metric 2: Latest Electricity Bill */}
        <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#58655E]">
              ELECTRICITY BILL
            </span>
            <Zap size={16} className="text-[#FF704D]" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#17211D]">
            {latestBill ? formatPKR(latestBill.bill_amount) : "—"}
          </p>
          <div className="flex items-center justify-between text-[11px] text-[#58655E]">
            <span>{latestBill ? `Due ${latestBill.due_date || "20th"}` : "No bill on file"}</span>
            {latestBill && (
              <StatusBadge
                status={latestBill.status === "paid" ? "PAID" : "UNPAID"}
                label={latestBill.status === "paid" ? "Paid" : "Unpaid"}
              />
            )}
          </div>
        </div>

        {/* Metric 3: Outstanding Balance */}
        <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#58655E]">
              CURRENT BALANCE
            </span>
            <ShieldCheck size={16} className="text-[#17211D]" />
          </div>
          <p className={`font-mono text-2xl font-bold ${outstandingBalance > 0 ? "text-[#8E3E33]" : "text-[#2D5A27]"}`}>
            {formatPKR(outstandingBalance)}
          </p>
          <p className="text-[11px] text-[#58655E]">
            {outstandingBalance > 0 ? "Total payable remaining" : "All dues settled ✓"}
          </p>
        </div>

        {/* Metric 4: Lease Status */}
        <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#58655E]">
              LEASE EXPIRY
            </span>
            <Calendar size={16} className="text-[#8FA66B]" />
          </div>
          <p className="font-mono text-base font-bold text-[#17211D] truncate">
            {lease?.end_date || "Continuous"}
          </p>
          <div className="flex items-center justify-between text-[11px] text-[#58655E]">
            <span>Status</span>
            <StatusBadge status={lease?.status || "VACANT"} />
          </div>
        </div>
      </div>

      {/* ─── Quick Access Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Link
          href="/tenant/unit"
          className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] hover:border-[#8FA66B] hover:bg-[#E8EDD9] transition shadow-2xs flex flex-col justify-between group"
        >
          <Building2 size={20} className="text-[#8FA66B] group-hover:scale-110 transition" />
          <div className="mt-3">
            <p className="text-xs font-bold text-[#17211D]">My Space</p>
            <p className="text-[10px] text-[#58655E]">Unit specifications</p>
          </div>
        </Link>

        <Link
          href="/tenant/bills"
          className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] hover:border-[#FF704D] hover:bg-[#E8EDD9] transition shadow-2xs flex flex-col justify-between group"
        >
          <Zap size={20} className="text-[#FF704D] group-hover:scale-110 transition" />
          <div className="mt-3">
            <p className="text-xs font-bold text-[#17211D]">My Bills</p>
            <p className="text-[10px] text-[#58655E]">{electricity.bills.length} IESCO bills</p>
          </div>
        </Link>

        <Link
          href="/tenant/payments"
          className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] hover:border-[#8FA66B] hover:bg-[#E8EDD9] transition shadow-2xs flex flex-col justify-between group"
        >
          <CreditCard size={20} className="text-[#8FA66B] group-hover:scale-110 transition" />
          <div className="mt-3">
            <p className="text-xs font-bold text-[#17211D]">My Payments</p>
            <p className="text-[10px] text-[#58655E]">{payments.length} Receipts</p>
          </div>
        </Link>

        <Link
          href="/tenant/lease"
          className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] hover:border-[#8FA66B] hover:bg-[#E8EDD9] transition shadow-2xs flex flex-col justify-between group"
        >
          <FileText size={20} className="text-[#17211D] group-hover:scale-110 transition" />
          <div className="mt-3">
            <p className="text-xs font-bold text-[#17211D]">My Lease</p>
            <p className="text-[10px] text-[#58655E]">Terms & Deposit</p>
          </div>
        </Link>

        <Link
          href="/tenant/complaints"
          className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] hover:border-[#8FA66B] hover:bg-[#E8EDD9] transition shadow-2xs flex flex-col justify-between group col-span-2 sm:col-span-1"
        >
          <Wrench size={20} className="text-[#8FA66B] group-hover:scale-110 transition" />
          <div className="mt-3">
            <p className="text-xs font-bold text-[#17211D]">Complaints</p>
            <p className="text-[10px] text-[#58655E]">{complaints.length} tickets</p>
          </div>
        </Link>
      </div>

      {/* ─── Two Columns: Recent Bills & Recent Payments ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Electricity Utility Summary */}
        <div className="rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[#FF704D]" />
              <h3 className="text-sm font-bold text-[#17211D]">IESCO Electricity</h3>
            </div>
            <Link
              href="/tenant/bills"
              className="text-xs font-medium text-[#FF704D] hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {electricity.reference_number ? (
            <div className="p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#58655E]">14-Digit Reference:</span>
                <strong className="font-mono text-[#17211D]">{electricity.reference_number}</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#58655E]">Meter Type:</span>
                <span className="font-medium text-[#17211D]">
                  {electricity.is_shared ? `Shared (${electricity.split_value}% Share)` : "Dedicated 1-to-1 Meter"}
                </span>
              </div>
              {latestBill && (
                <div className="pt-2 border-t border-[#CBD4BC]/60 flex items-center justify-between text-xs">
                  <span className="text-[#58655E]">Latest Bill ({formatBillingMonth(latestBill.billing_month)}):</span>
                  <strong className="font-mono text-[#FF704D]">{formatPKR(latestBill.bill_amount)}</strong>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-[#CBD4BC] text-center text-xs text-[#58655E]">
              No IESCO meter currently assigned to this space.
            </div>
          )}
        </div>

        {/* Right: Recent Payments */}
        <div className="rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-[#8FA66B]" />
              <h3 className="text-sm font-bold text-[#17211D]">Recent Payments</h3>
            </div>
            <Link
              href="/tenant/payments"
              className="text-xs font-medium text-[#8FA66B] hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-[#CBD4BC] text-center text-xs text-[#58655E]">
              No payment transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-[#CBD4BC]/60">
              {recentPayments.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="font-semibold text-[#17211D]">{p.receipt_number || `REC-${p.id}`}</span>
                    <p className="text-[10px] text-[#58655E]">{p.payment_date} · {p.payment_type}</p>
                  </div>
                  <span className="font-bold text-[#2D5A43]">{formatPKR(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
