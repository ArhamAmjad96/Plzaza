"use client";

import { useState } from "react";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import { PaymentType } from "@/lib/payments/service";
import { Check, Copy, Printer, X, Sparkles, Building2 } from "lucide-react";

export interface ReceiptModalProps {
  receiptNumber: string;
  paymentDate: string;
  paymentAmount: number;
  paymentType?: PaymentType;
  paymentMethod: string;
  transactionReference?: string | null;
  notes?: string | null;
  tenantName: string;
  shopName: string;
  referenceNumber?: string;
  billingMonth: string;
  rentAmount: number;
  electricityAmount: number | null;
  previousBalance?: number;
  maintenanceAmount?: number;
  otherCharges?: number;
  totalPayable: number;
  totalPaid?: number;
  currentPaid?: number;
  remainingAmount?: number;
  remainingBalance?: number;
  onClose: () => void;
}

export default function PaymentReceiptModal(props: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  const {
    receiptNumber,
    paymentDate,
    paymentAmount,
    paymentType = "RENT",
    paymentMethod,
    tenantName,
    shopName,
    billingMonth,
    rentAmount,
    electricityAmount,
    totalPayable,
    totalPaid = 0,
    currentPaid = 0,
    remainingBalance = 0,
    remainingAmount = 0,
    onClose,
  } = props;

  const finalPaid = totalPaid || currentPaid;
  const finalRemaining = remainingBalance !== undefined ? remainingBalance : remainingAmount;
  const isFullyPaid = finalRemaining <= 0;

  function handlePrint() {
    window.print();
  }

  function handleCopyWhatsApp() {
    const text = `*OFFICIAL PAYMENT RECEIPT*\n*Receipt #:* ${receiptNumber}\n*Plaza:* Main Commercial Plaza\n*Space:* ${shopName}\n*Tenant:* ${tenantName}\n*Month:* ${billingMonth}\n*Amount Paid:* ${formatPKR(paymentAmount)}\n*Method:* ${paymentMethod}\n*Date:* ${paymentDate}\n*Remaining Balance:* ${formatPKR(finalRemaining)}\n\n_Thank you for your timely payment._`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-7 shadow-2xl space-y-6 text-[#17211D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Success Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-[#E3EFE8] border border-[#BCD8C7] text-[#2D5A43] mx-auto flex items-center justify-center">
            <Check size={22} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#8FA66B]">
              PAYMENT RECEIVED
            </span>
            <h3 className="text-2xl font-mono font-bold text-[#17211D]">
              {formatPKR(paymentAmount)}
            </h3>
            <p className="text-xs text-[#58655E] mt-0.5">
              {tenantName} · {shopName}
            </p>
          </div>
        </div>

        {/* Printable Receipt Card */}
        <div className="p-5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-2">
            <span className="text-[#58655E]">Receipt Number</span>
            <span className="font-semibold text-[#17211D]">{receiptNumber}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#58655E]">Payment Date</span>
            <span className="text-[#17211D]">{paymentDate}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#58655E]">Billing Month</span>
            <span className="text-[#17211D]">{billingMonth}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#58655E]">Payment Method</span>
            <span className="text-[#17211D]">{paymentMethod}</span>
          </div>

          <div className="pt-2 border-t border-[#CBD4BC]/60 flex items-center justify-between">
            <span className="text-[#58655E]">Remaining Balance</span>
            <span className={`font-semibold ${isFullyPaid ? "text-[#2D5A43]" : "text-[#8E3E33]"}`}>
              {formatPKR(finalRemaining)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="w-full py-2.5 rounded-xl bg-[#2D5A43] text-[#F4F7F2] text-xs font-medium hover:bg-[#234734] transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Copy size={13} />
            <span>{copied ? "✓ Copied to Clipboard" : "Copy for WhatsApp"}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-medium text-[#17211D] hover:bg-[#E8EDD9] transition flex items-center justify-center gap-2"
            >
              <Printer size={13} />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
