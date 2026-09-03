"use client";

import { useState } from "react";
import { formatPKR } from "@/lib/utils/format";
import { PaymentType } from "@/lib/payments/service";
import { Check, Copy, Printer, X, Building2, ShieldCheck, Zap, Home, Wrench, CheckCircle2 } from "lucide-react";

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
  rentAmount?: number;
  electricityAmount?: number | null;
  previousBalance?: number;
  maintenanceAmount?: number;
  otherCharges?: number;
  totalPayable?: number;
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
    transactionReference,
    notes,
    tenantName,
    shopName,
    referenceNumber,
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
    const text = `🏢 *PLAZA MANAGEMENT - PAYMENT RECEIPT*\n` +
      `------------------------------------\n` +
      `*Receipt #:* ${receiptNumber}\n` +
      `*Date:* ${paymentDate}\n` +
      `*Tenant:* ${tenantName}\n` +
      `*Space:* ${shopName}\n` +
      `*Category:* ${paymentType}\n` +
      `*Month:* ${billingMonth}\n` +
      `*Amount Paid:* ${formatPKR(paymentAmount)}\n` +
      `*Payment Method:* ${paymentMethod}` +
      (transactionReference ? ` (${transactionReference})` : "") + `\n` +
      `*Remaining Balance:* ${isFullyPaid ? "Rs. 0 (Fully Cleared ✓)" : formatPKR(finalRemaining)}\n` +
      `------------------------------------\n` +
      `_Official confirmation of payment recorded in Plaza Management System._`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  const categoryIcons: Record<string, any> = {
    RENT: Home,
    ELECTRICITY: Zap,
    SECURITY: ShieldCheck,
    MAINTENANCE: Wrench,
    OTHER: Building2,
  };
  const CategoryIcon = categoryIcons[paymentType] || Building2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm print:p-0 print:bg-white"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-6 sm:p-8 shadow-2xl space-y-5 text-[#17211D] animate-in fade-in zoom-in-95 print:border-none print:shadow-none print:p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-4 print:border-black">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] text-[#2D5A43] flex items-center justify-center shadow-xs">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#2D5A43]">
                OFFICIAL PAYMENT RECEIPT
              </span>
              <h3 className="text-xl font-bold text-[#17211D] leading-tight">
                Plaza Management
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] flex items-center justify-center transition print:hidden cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Amount Hero Box */}
        <div className="p-5 rounded-2xl bg-[#E3EFE8] border border-[#BCD8C7] text-center space-y-1 shadow-xs">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#2D5A43]">
            AMOUNT RECEIVED
          </span>
          <h2 className="text-3xl sm:text-4xl font-mono font-bold text-[#17211D]">
            {formatPKR(paymentAmount)}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF6F0] border border-[#BCD8C7] text-xs font-semibold text-[#2D5A43] mt-1">
            <CategoryIcon size={13} />
            <span>{paymentType} PAYMENT</span>
          </div>
        </div>

        {/* Receipt Details Card */}
        <div className="p-5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-2">
            <span className="text-[#58655E]">Receipt Number:</span>
            <span className="font-bold text-[#17211D]">{receiptNumber}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#58655E]">Payment Date:</span>
            <span className="font-semibold text-[#17211D]">{paymentDate}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#58655E]">Tenant Name:</span>
            <span className="font-bold text-[#17211D]">{tenantName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#58655E]">Assigned Space:</span>
            <span className="font-semibold text-[#17211D]">{shopName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#58655E]">Billing Month:</span>
            <span className="font-semibold text-[#17211D]">{billingMonth}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#58655E]">Payment Method:</span>
            <span className="font-semibold text-[#17211D]">
              {paymentMethod}
              {transactionReference ? ` (${transactionReference})` : ""}
            </span>
          </div>

          {notes && (
            <div className="flex items-center justify-between">
              <span className="text-[#58655E]">Notes / Remarks:</span>
              <span className="text-[#17211D]">{notes}</span>
            </div>
          )}

          <div className="pt-2 border-t border-[#CBD4BC]/60 flex items-center justify-between">
            <span className="text-[#58655E]">Remaining Dues:</span>
            <span
              className={`font-bold ${
                isFullyPaid ? "text-[#2D5A43]" : "text-[#8E3E33]"
              }`}
            >
              {isFullyPaid ? "Fully Settled ✓" : formatPKR(finalRemaining)}
            </span>
          </div>
        </div>

        {/* Action Buttons (Hidden on Print) */}
        <div className="space-y-2 pt-1 print:hidden">
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="w-full py-2.5 rounded-xl bg-[#2D5A43] text-[#F4F7F2] text-xs font-semibold hover:bg-[#234734] transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Receipt Details Copied!" : "Copy Receipt for WhatsApp / SMS"}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-semibold text-[#17211D] hover:bg-[#E8EDD9] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition cursor-pointer text-center"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
