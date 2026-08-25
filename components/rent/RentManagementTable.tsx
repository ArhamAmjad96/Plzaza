"use client";

import { useState } from "react";
import Link from "next/link";
import { LedgerItem } from "@/lib/ledgers/service";
import { formatPKR } from "@/lib/utils/format";
import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { CreditCard, ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function RentManagementTable({ items }: { items: LedgerItem[] }) {
  const [selectedLedger, setSelectedLedger] = useState<LedgerItem | null>(null);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No ledger entries found"
        description="No tenant records matched your current month or status filter."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Responsive Table Layout */}
      <div className="rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] font-semibold uppercase tracking-wider text-[#58655E] border-b border-[#CBD4BC] bg-[#E8EDD9]">
              <tr>
                <th className="py-3.5 px-4">Shop / Space</th>
                <th className="py-3.5 px-4">Tenant</th>
                <th className="py-3.5 px-4 text-right">Rent</th>
                <th className="py-3.5 px-4 text-right">Electricity</th>
                <th className="py-3.5 px-4 text-right">Total Due</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Balance</th>
                <th className="py-3.5 px-4 text-right">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD4BC]/60 font-mono">
              {items.map((item) => {
                const isPaid = item.remaining_balance <= 0;
                const isPartial = !isPaid && item.paid_amount > 0;

                return (
                  <tr key={`${item.tenant_id}-${item.unit_id}`} className="hover:bg-[#E8EDD9]/40 transition">
                    {/* Unit */}
                    <td className="py-3.5 px-4 font-semibold text-[#17211D] font-sans">
                      <Link
                        href={`/units/${item.unit_id}`}
                        className="hover:text-[#FF704D] transition"
                      >
                        {item.shop_name}
                      </Link>
                    </td>

                    {/* Tenant */}
                    <td className="py-3.5 px-4 text-[#58655E] font-sans font-medium">
                      {item.tenant_name || "—"}
                    </td>

                    {/* Monthly Rent */}
                    <td className="py-3.5 px-4 text-right text-[#58655E]">
                      {formatPKR(item.rent_amount)}
                    </td>

                    {/* Electricity Dues */}
                    <td className="py-3.5 px-4 text-right text-[#58655E]">
                      {item.has_electricity_bill ? formatPKR(item.electricity_amount) : "—"}
                    </td>

                    {/* Total Dues */}
                    <td className="py-3.5 px-4 text-right font-semibold text-[#17211D]">
                      {formatPKR(item.total_payable)}
                    </td>

                    {/* Paid */}
                    <td className="py-3.5 px-4 text-right text-[#2D5A43] font-semibold">
                      {formatPKR(item.paid_amount)}
                    </td>

                    {/* Balance */}
                    <td className="py-3.5 px-4 text-right font-semibold">
                      <span className={isPaid ? "text-[#2D5A43]" : "text-[#8E3E33]"}>
                        {formatPKR(item.remaining_balance)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-right">
                      <StatusBadge
                        status={isPaid ? "PAID" : isPartial ? "PARTIAL" : "UNPAID"}
                        label={isPaid ? "Paid" : isPartial ? "Partially Paid" : "Due"}
                      />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLedger(item)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition shadow-xs ${
                          isPaid
                            ? "border border-[#CBD4BC] bg-[#FAF6F0] text-[#58655E] hover:bg-[#E8EDD9] hover:text-[#17211D]"
                            : "bg-[#17211D] text-[#F4F7F2] hover:bg-[#24332D]"
                        }`}
                      >
                        <CreditCard size={12} />
                        <span>{isPaid ? "Add Extra" : "Record"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {selectedLedger && (
        <RecordPaymentModal
          connectionId={selectedLedger.unit_id || 1}
          tenantName={selectedLedger.tenant_name || "Tenant"}
          shopName={selectedLedger.shop_name}
          referenceNumber={selectedLedger.reference_number}
          billingMonth={selectedLedger.billing_month}
          rentAmount={selectedLedger.rent_amount}
          electricityAmount={selectedLedger.has_electricity_bill ? selectedLedger.electricity_amount : null}
          previousBalance={selectedLedger.previous_balance || 0}
          maintenanceAmount={0}
          otherCharges={0}
          totalPayable={selectedLedger.total_payable}
          currentPaid={selectedLedger.paid_amount}
          remainingAmount={selectedLedger.remaining_balance}
          onClose={() => setSelectedLedger(null)}
        />
      )}
    </div>
  );
}
