import Link from "next/link";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import { getAllUnits } from "@/lib/units/service";
import { getMonthlyLedgersAll, normalizeBillingMonth, LedgerItem } from "@/lib/ledgers/service";
import { getAllComplaints, ComplaintItem } from "@/lib/complaints/service";
import { getConnectionsWithMappings } from "@/lib/electricity/service";
import HeroStorytelling from "@/components/dashboard/HeroStorytelling";
import NeedsAttentionSection from "@/components/dashboard/NeedsAttentionSection";
import StatMetric from "@/components/ui/StatMetric";
import {
  Building2,
  Users,
  CreditCard,
  Zap,
  Wrench,
  Plus,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentMonth = normalizeBillingMonth(new Date().toISOString().slice(0, 7));

  // Fetch all live data in parallel
  const [{ units, plaza }, allLedgers, { complaints }, connections] = await Promise.all([
    getAllUnits(),
    getMonthlyLedgersAll(currentMonth),
    getAllComplaints(),
    getConnectionsWithMappings(),
  ]);

  // Derived financial & operational metrics
  const totalRentExpected = allLedgers.reduce(
    (sum: number, item: LedgerItem) => sum + Number(item.total_payable || item.rent_amount || 0),
    0
  );

  const totalRentCollected = allLedgers.reduce(
    (sum: number, item: LedgerItem) => sum + Number(item.paid_amount || 0),
    0
  );

  const totalElectricityDue = allLedgers.reduce(
    (sum: number, item: LedgerItem) => sum + Number(item.electricity_amount || 0) - Number(item.electricity_paid || 0),
    0
  );

  const totalUnitsCount = units.length;
  const occupiedUnitsCount = units.filter((u) => u.status === "OCCUPIED").length;
  const vacantUnitsCount = totalUnitsCount - occupiedUnitsCount;
  const occupancyPct = totalUnitsCount > 0 ? Math.round((occupiedUnitsCount / totalUnitsCount) * 100) : 0;

  // Filter overdue and attention items
  const overdueLedgers = allLedgers.filter((l: LedgerItem) => l.remaining_balance > 0);
  const openComplaintsList = complaints.filter(
    (c: ComplaintItem) => c.status === "OPEN" || c.status === "ASSIGNED" || c.status === "IN_PROGRESS"
  );
  const totalAttentionCount = overdueLedgers.length + openComplaintsList.length;

  const floorsList = plaza?.floors && plaza.floors.length > 0
    ? plaza.floors
    : Array.from(new Set(units.map((u) => u.floor).filter(Boolean)));

  const unpaidBillsCount = connections.filter((c) => c.latest_bill && c.latest_bill.status !== "paid").length;

  return (
    <div className="space-y-10">
      {/* ─── Apple-Inspired Storytelling & Digital Plaza Hero ─── */}
      <HeroStorytelling
        totalUnits={totalUnitsCount}
        occupiedCount={occupiedUnitsCount}
        rentCollected={totalRentCollected}
        rentExpected={totalRentExpected}
        electricityPending={totalElectricityDue}
        units={units}
        floors={floorsList}
      />

      {/* ─── Operational Executive Greeting & Overview ─── */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#CBD4BC]">
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#FF704D]">
              DAILY MANAGEMENT
            </p>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#17211D]">
              {totalAttentionCount === 0
                ? "Your Plaza Is In Perfect Order."
                : `${totalAttentionCount} Items Need Your Attention.`}
            </h2>
            <p className="text-xs sm:text-sm text-[#58655E] mt-1">
              Live status for {formatBillingMonth(currentMonth)} · {occupiedUnitsCount} of {totalUnitsCount} units occupied ({occupancyPct}%)
            </p>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/units"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs sm:text-sm font-medium hover:bg-[#24332D] transition shadow-xs"
            >
              <Plus size={15} />
              <span>Add Unit</span>
            </Link>

            <Link
              href="/tenants"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8EDD9] border border-[#CBD4BC] text-[#17211D] text-xs sm:text-sm font-medium hover:bg-[#FAF6F0] transition shadow-xs"
            >
              <Users size={15} />
              <span>Add Tenant</span>
            </Link>

            <Link
              href="/rent"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8EDD9] border border-[#CBD4BC] text-[#17211D] text-xs sm:text-sm font-medium hover:bg-[#FAF6F0] transition shadow-xs"
            >
              <CreditCard size={15} />
              <span>Record Payment</span>
            </Link>

            <Link
              href="/complaints"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8EDD9] border border-[#CBD4BC] text-[#17211D] text-xs sm:text-sm font-medium hover:bg-[#FAF6F0] transition shadow-xs"
            >
              <Wrench size={15} />
              <span>Report Issue</span>
            </Link>
          </div>
        </div>

        {/* ─── 4 Architectural Metric Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatMetric
            label="Rent Collected"
            value={formatPKR(totalRentCollected)}
            subValue={`${Math.round((totalRentCollected / (totalRentExpected || 1)) * 100)}% of monthly expected`}
            highlight={true}
          />
          <StatMetric
            label="Electricity Due"
            value={formatPKR(totalElectricityDue)}
            subValue="Utility recoveries pending"
          />
          <StatMetric
            label="Occupancy Rate"
            value={`${occupancyPct}%`}
            subValue={`${occupiedUnitsCount} occupied · ${vacantUnitsCount} vacant`}
          />
          <StatMetric
            label="Open Repairs"
            value={openComplaintsList.length.toString().padStart(2, "0")}
            subValue={openComplaintsList.length === 0 ? "Zero open tickets" : "Requires contractor dispatch"}
          />
        </div>
      </section>

      {/* ─── Needs Attention Actionable Rows ─── */}
      <NeedsAttentionSection
        overdueLedgers={overdueLedgers}
        openComplaints={openComplaintsList}
        unpaidBillsCount={unpaidBillsCount}
      />
    </div>
  );
}