"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordPaymentAction } from "@/app/rent/actions";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import PaymentReceiptModal from "./PaymentReceiptModal";
import {
  CreditCard,
  Banknote,
  Building,
  Smartphone,
  Check,
  X,
  Zap,
  Home,
  ShieldCheck,
  Wrench,
} from "lucide-react";

interface RecordPaymentModalProps {
  connectionId: number | string;
  tenantName: string;
  shopName: string;
  referenceNumber?: string;
  billingMonth: string;
  rentAmount: number;
  electricityAmount?: number | null;
  previousBalance?: number;
  maintenanceAmount?: number;
  otherCharges?: number;
  totalPayable: number;
  currentPaid: number;
  remainingAmount: number;
  onClose: () => void;
}

export default function RecordPaymentModal({
  connectionId,
  tenantName,
  shopName,
  referenceNumber,
  billingMonth,
  rentAmount,
  electricityAmount,
  totalPayable,
  currentPaid,
  remainingAmount,
  onClose,
}: RecordPaymentModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<string>(remainingAmount > 0 ? remainingAmount.toString() : rentAmount.toString());
  const [paymentType, setPaymentType] = useState<string>("RENT");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Success Receipt State
  const [createdReceipt, setCreatedReceipt] = useState<any | null>(null);

  const PAYMENT_CATEGORIES = [
    { id: "RENT", label: "Monthly Rent", icon: Home },
    { id: "ELECTRICITY", label: "Electricity", icon: Zap },
    { id: "SECURITY", label: "Security Deposit", icon: ShieldCheck },
    { id: "MAINTENANCE", label: "Maintenance", icon: Wrench },
  ];

  const PAYMENT_METHODS = [
    { id: "CASH", label: "Cash", icon: Banknote },
    { id: "BANK_TRANSFER", label: "Bank Transfer", icon: Building },
    { id: "JAZZCASH", label: "JazzCash / EasyPaisa", icon: Smartphone },
    { id: "CHEQUE", label: "Cheque", icon: CreditCard },
  ];

  async function handleSavePayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid payment amount greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("connection_id", connectionId.toString());
      formData.append("billing_month", billingMonth);
      formData.append("amount", amt.toString());
      formData.append("payment_type", paymentType);
      formData.append("payment_method", paymentMethod);
      formData.append("payment_date", paymentDate);
      formData.append("notes", notes);

      const result = await recordPaymentAction(formData);

      if (result.success) {
        router.refresh();
        setCreatedReceipt({
          receiptNumber: result.payment?.receipt_number || `REC-${Date.now().toString().slice(-6)}`,
          paymentDate,
          paymentAmount: amt,
          paymentType,
          paymentMethod,
          tenantName,
          shopName,
          billingMonth: formatBillingMonth(billingMonth),
          referenceNumber,
          rentAmount,
          electricityAmount: electricityAmount || 0,
          totalPayable,
          currentPaid: currentPaid + amt,
          remainingAmount: Math.max(0, remainingAmount - amt),
        });
      }
    } catch {
      alert("Unexpected error occurred while recording payment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (createdReceipt) {
    return (
      <PaymentReceiptModal
        {...createdReceipt}
        onClose={() => {
          router.refresh();
          onClose();
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 sm:p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl sm:max-w-3xl rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-8 sm:p-10 shadow-2xl space-y-7 max-h-[92vh] overflow-y-auto text-[#17211D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
              FINANCIAL TRANSACTION
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#17211D] mt-1">
              Record Payment
            </h3>
            <p className="text-sm text-[#58655E] mt-1">
              {tenantName} · {shopName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSavePayment} className="space-y-6">
          {/* Oversized Numeric Input */}
          <div className="p-6 rounded-3xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-2 shadow-xs">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#58655E]">
              AMOUNT RECEIVED (PKR)
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl font-bold text-[#58655E]">Rs.</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full font-mono text-4xl sm:text-5xl font-bold text-[#17211D] bg-transparent border-none focus:ring-0 p-0"
                required
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-[#58655E] pt-2 border-t border-[#CBD4BC]/60">
              <span>Total Dues: <strong className="text-[#17211D]">{formatPKR(totalPayable)}</strong></span>
              <span>Pending Balance: <strong className="text-[#8E3E33]">{formatPKR(remainingAmount)}</strong></span>
            </div>
          </div>

          {/* Payment For Categories */}
          <div className="space-y-2">
            <span className="text-sm font-bold text-[#17211D]">Payment For</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PAYMENT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = paymentType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setPaymentType(cat.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col items-start gap-2 ${
                      isSelected
                        ? "border-[#FF704D] bg-[#FFF0EB] text-[#FF704D] shadow-xs"
                        : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E] hover:bg-[#DDE4CF]"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-xs sm:text-sm font-semibold leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <span className="text-sm font-bold text-[#17211D]">Payment Method</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PAYMENT_METHODS.map((met) => {
                const Icon = met.icon;
                const isSelected = paymentMethod === met.id;
                return (
                  <button
                    key={met.id}
                    type="button"
                    onClick={() => setPaymentMethod(met.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col items-start gap-2 ${
                      isSelected
                        ? "border-[#17211D] bg-[#17211D] text-[#F4F7F2] shadow-xs"
                        : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E] hover:bg-[#DDE4CF]"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-xs sm:text-sm font-semibold leading-tight">{met.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Reference Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-semibold text-sm text-[#17211D]">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-sm sm:text-base focus:border-[#FF704D] shadow-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-sm text-[#17211D]">Bank Slip / Note (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Meezan Bank Transfer #890"
                className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-sm sm:text-base focus:border-[#FF704D] shadow-xs"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-[#CBD4BC]/60">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-sm font-medium text-[#58655E] hover:text-[#17211D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-sm sm:text-base font-semibold hover:bg-[#24332D] transition shadow-md disabled:opacity-50"
            >
              {submitting ? "Saving Transaction..." : "Save Payment & Print Receipt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
