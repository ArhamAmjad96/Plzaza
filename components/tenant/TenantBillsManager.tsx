"use client";

import { useState } from "react";
import { ElectricityBillItem } from "@/lib/bills/service";
import BillHistoryList from "@/components/bills/BillHistoryList";
import ViewBillModal from "@/components/bills/ViewBillModal";
import { Zap, ShieldCheck } from "lucide-react";

interface TenantBillsManagerProps {
  bills: ElectricityBillItem[];
  referenceNumber?: string;
  unitName?: string;
  isShared?: boolean;
  splitValue?: number;
}

export default function TenantBillsManager({
  bills,
  referenceNumber,
  unitName,
  isShared = false,
  splitValue = 100,
}: TenantBillsManagerProps) {
  const [selectedBill, setSelectedBill] = useState<ElectricityBillItem | null>(null);

  return (
    <div className="space-y-6">
      {/* Utility Specs Header */}
      <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] flex items-center justify-center text-[#FF704D] shrink-0">
            <Zap size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#17211D]">
              IESCO Electricity Meter
            </h2>
            <p className="text-xs font-mono text-[#58655E]">
              14-Digit Reference: <strong className="text-[#17211D]">{referenceNumber || "Unassigned"}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-mono font-semibold text-[#17211D]">
            {isShared ? `Shared Meter (${splitValue}% Share)` : "Dedicated Meter"}
          </span>
        </div>
      </div>

      {/* Bill History List */}
      <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs">
        <BillHistoryList
          bills={bills}
          referenceNumber={referenceNumber}
          isShared={isShared}
          splitValue={splitValue}
          onSelectBill={(bill) => setSelectedBill(bill)}
        />
      </div>

      {/* Interactive In-App Full-Size Viewer Modal */}
      {selectedBill && (
        <ViewBillModal
          billData={{
            id: selectedBill.id,
            referenceNumber: selectedBill.reference_number || referenceNumber || "",
            meterNumber: selectedBill.meter_number || undefined,
            consumerName: selectedBill.consumer_name || unitName || "Commercial Space",
            billingMonth: selectedBill.billing_month,
            issueDate: selectedBill.issue_date || undefined,
            dueDate: selectedBill.due_date || "20 Aug 2026",
            unitsConsumed: selectedBill.units_consumed || 165,
            billAmount: selectedBill.bill_amount || selectedBill.amount_due || 5400,
            latePaymentAmount: selectedBill.late_payment_amount || undefined,
            billStatus: selectedBill.status || "unpaid",
            billImageUrl: selectedBill.bill_file_url || selectedBill.bill_image_url || null,
            billFilePath: selectedBill.bill_file_path || null,
          }}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
}
