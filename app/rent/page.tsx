import { getMonthlyLedgersAll, normalizeBillingMonth } from "@/lib/ledgers/service";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import RentFilterBar from "@/components/rent/RentFilterBar";
import RentManagementTable from "@/components/rent/RentManagementTable";
import { CheckCircle2, AlertCircle, CreditCard } from "lucide-react";

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;

  const currentMonthInput = params.month || new Date().toISOString().slice(0, 7);
  const billingMonth = normalizeBillingMonth(currentMonthInput);
  const search = (params.search || "").trim().toLowerCase();
  const statusFilter = params.status || "all";

  // 1. Fetch all ledgers for target month
  const allLedgers = await getMonthlyLedgersAll(billingMonth);

  // 2. Compute Summary Collection Metrics
  const totalRentExpected = allLedgers.reduce(
    (sum, item) => sum + Number(item.total_payable || item.rent_amount || 0),
    0
  );

  const totalCollected = allLedgers.reduce(
    (sum, item) => sum + Number(item.paid_amount || 0),
    0
  );

  const totalOutstanding = allLedgers.reduce(
    (sum, item) => sum + Number(item.remaining_balance || 0),
    0
  );

  const collectionRate = totalRentExpected > 0 ? Math.round((totalCollected / totalRentExpected) * 100) : 0;

  // 3. Apply Search & Status Filters
  const filteredLedgers = allLedgers.filter((item) => {
    const matchSearch =
      !search ||
      (item.tenant_name && item.tenant_name.toLowerCase().includes(search)) ||
      (item.shop_name && item.shop_name.toLowerCase().includes(search));

    let matchStatus = true;
    if (statusFilter === "paid") {
      matchStatus = item.remaining_balance <= 0;
    } else if (statusFilter === "unpaid") {
      matchStatus = item.remaining_balance > 0;
    }

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8">
      {/* ─── Warm Sand Financial Composition Hero ─── */}
      <section className="rounded-3xl border border-[#D9C4AC] bg-[#E7D4BE] p-8 sm:p-12 text-[#17211D] space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9C4AC]/80 pb-4">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#7D6F5D]">
              FINANCIAL CASH FLOW · {formatBillingMonth(billingMonth).toUpperCase()}
            </span>
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#17211D]">
              Rent & Payments
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F0] border border-[#D9C4AC] text-xs font-mono font-semibold text-[#17211D]">
            <span>{collectionRate}% Collected</span>
          </div>
        </div>

        {/* Large Editorial Figures */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-2 font-mono">
          <div>
            <span className="text-[10px] uppercase font-sans text-[#7D6F5D] block">Collected This Month</span>
            <p className="text-2xl sm:text-3xl font-bold text-[#17211D] mt-1">
              {formatPKR(totalCollected)}
            </p>
            <p className="text-[11px] text-[#7D6F5D] font-sans mt-0.5">{collectionRate}% of monthly target</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans text-[#7D6F5D] block">Expected Total</span>
            <p className="text-2xl sm:text-3xl font-bold text-[#17211D] mt-1">
              {formatPKR(totalRentExpected)}
            </p>
            <p className="text-[11px] text-[#7D6F5D] font-sans mt-0.5">Rent + electricity bills</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans text-[#7D6F5D] block">Remaining Dues</span>
            <p className="text-2xl sm:text-3xl font-bold text-[#8E3E33] mt-1">
              {formatPKR(totalOutstanding)}
            </p>
            <p className="text-[11px] text-[#7D6F5D] font-sans mt-0.5">Pending tenant settlement</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans text-[#7D6F5D] block">Settled Units</span>
            <p className="text-2xl sm:text-3xl font-bold text-[#2D5A43] mt-1">
              {allLedgers.filter((l) => l.remaining_balance <= 0).length} / {allLedgers.length}
            </p>
            <p className="text-[11px] text-[#7D6F5D] font-sans mt-0.5">Units completely clear</p>
          </div>
        </div>
      </section>

      {/* ─── Search & Status Filters ─── */}
      <RentFilterBar
        currentMonth={currentMonthInput}
        currentSearch={params.search || ""}
        currentStatus={statusFilter}
      />

      {/* ─── Ledgers Table ─── */}
      <RentManagementTable items={filteredLedgers} />
    </div>
  );
}
