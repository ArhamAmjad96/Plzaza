"use client";

import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import { FileText, Download, Eye, Zap, Calendar, CheckCircle2, Clock } from "lucide-react";
import { ElectricityBillItem } from "@/lib/bills/service";
import StatusBadge from "@/components/ui/StatusBadge";

interface BillHistoryListProps {
  bills: ElectricityBillItem[];
  referenceNumber?: string;
  onSelectBill: (bill: ElectricityBillItem) => void;
  isShared?: boolean;
  splitValue?: number;
}

export default function BillHistoryList({
  bills,
  referenceNumber,
  onSelectBill,
  isShared = false,
  splitValue = 100,
}: BillHistoryListProps) {
  if (!bills || bills.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-[#CBD4BC] bg-[#FAF6F0] text-center space-y-2">
        <Zap size={20} className="mx-auto text-[#85918A]" />
        <p className="text-xs text-[#58655E]">No previous monthly bills recorded yet.</p>
        <p className="text-[11px] text-[#85918A]">
          When IESCO issues new monthly bills, they will automatically be preserved in this history log.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#58655E]">
            OFFICIAL BILL HISTORY
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#E8EDD9] text-[10px] font-mono font-bold text-[#17211D]">
            {bills.length} {bills.length === 1 ? "Bill" : "Bills"}
          </span>
        </div>
        {referenceNumber && (
          <span className="text-[11px] font-mono text-[#58655E]">
            Ref: {referenceNumber}
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {bills.map((bill) => {
          const totalAmount = bill.bill_amount || bill.amount_due || 0;
          const shareAmount = isShared && splitValue < 100
            ? Math.round(totalAmount * (splitValue / 100))
            : totalAmount;

          const refNum = bill.reference_number || referenceNumber || "";
          const downloadUrl = `/api/bills/${bill.id}/download?ref=${encodeURIComponent(refNum)}&month=${encodeURIComponent(bill.billing_month)}`;

          return (
            <div
              key={bill.id || bill.billing_month}
              className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] hover:border-[#8FA66B] transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left: Month, Amount, Due Date */}
              <div className="flex items-start sm:items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#E8EDD9] border border-[#CBD4BC] flex items-center justify-center text-[#17211D] shrink-0">
                  <FileText size={18} className="text-[#FF704D]" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-[#17211D]">
                      {formatBillingMonth(bill.billing_month)}
                    </h4>
                    <StatusBadge
                      status={bill.status === "paid" ? "PAID" : "UNPAID"}
                      label={bill.status === "paid" ? "Paid" : "Unpaid"}
                    />
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs font-mono text-[#58655E] flex-wrap">
                    <span className="font-semibold text-[#17211D]">
                      {formatPKR(shareAmount)}
                      {isShared && (
                        <span className="text-[10px] text-[#85918A] font-normal ml-1">
                          ({splitValue}% of {formatPKR(totalAmount)})
                        </span>
                      )}
                    </span>
                    <span>·</span>
                    <span>{bill.units_consumed || 165} kWh</span>
                    {bill.due_date && (
                      <>
                        <span>·</span>
                        <span className="text-[#8E3E33]">Due {bill.due_date}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectBill(bill)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] text-[#17211D] hover:bg-[#DDE4CF] text-xs font-medium transition shadow-xs cursor-pointer"
                  title="View Full-Size Bill"
                >
                  <Eye size={13} />
                  <span>View Bill</span>
                </button>

                <a
                  href={downloadUrl}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-[#17211D] hover:bg-[#E8EDD9] text-xs font-medium transition shadow-xs cursor-pointer"
                  title="Download Official Bill Document"
                >
                  <Download size={13} />
                  <span>Download</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
