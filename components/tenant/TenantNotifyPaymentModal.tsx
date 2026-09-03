"use client";

import { useState } from "react";
import { notifyAdminOfPaymentAction, NotifyPaymentInput } from "@/app/tenant/actions";
import { formatPKR } from "@/lib/utils/format";
import {
  Bell,
  X,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Send,
} from "lucide-react";

interface TenantNotifyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
  unitName?: string;
  tenantName?: string;
}

export default function TenantNotifyPaymentModal({
  isOpen,
  onClose,
  defaultAmount = 0,
  unitName = "Assigned Unit",
  tenantName = "Resident",
}: TenantNotifyPaymentModalProps) {
  const [paymentType, setPaymentType] = useState<"FULL_RENT" | "PARTIAL_RENT" | "SECURITY" | "OTHER">("FULL_RENT");
  const [amount, setAmount] = useState<string>(defaultAmount > 0 ? defaultAmount.toString() : "");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "EASYPAISA_JAZZCASH" | "CHEQUE">("BANK_TRANSFER");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [referenceNotes, setReferenceNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid payment amount in PKR.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await notifyAdminOfPaymentAction({
        paymentType,
        amount: numericAmount,
        paymentMethod,
        paymentDate,
        referenceNotes: referenceNotes.trim() || undefined,
      });

      if (res.success) {
        setSuccessMessage(res.message || "Admin has been notified successfully!");
      } else {
        setError(res.error || "Failed to notify admin. Please try again.");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleResetAndClose() {
    setSuccessMessage(null);
    setError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17211D]/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-[#FAF6F0] rounded-3xl border border-[#CBD4BC] shadow-xl max-w-lg w-full p-6 space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#CBD4BC]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#17211D] text-[#8FA66B] flex items-center justify-center shadow-xs shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17211D]">
                Notify Admin of Payment
              </h3>
              <p className="text-xs text-[#58655E]">
                {tenantName} · {unitName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-xl hover:bg-[#E8EDD9] text-[#58655E] hover:text-[#17211D] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Confirmation */}
        {successMessage ? (
          <div className="py-6 space-y-4 text-center">
            <div className="h-14 w-14 rounded-full bg-[#E8EDD9] text-[#2D5A27] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-[#17211D]">
                Notification Sent!
              </h4>
              <p className="text-xs text-[#58655E] max-w-sm mx-auto">
                {successMessage}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] text-xs font-mono text-[#2D5A27] max-w-sm mx-auto">
              ✓ Admin dashboard & notification bell updated
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-6 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            {error && (
              <div className="p-3.5 rounded-2xl bg-[#FAECE9] border border-[#EAC4BE] text-[#8E3E33] flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Payment Category / Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17211D] block">
                Payment Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "FULL_RENT", label: "Full Rent" },
                  { id: "PARTIAL_RENT", label: "Partial Rent" },
                  { id: "SECURITY", label: "Security" },
                  { id: "OTHER", label: "Advance/Other" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaymentType(item.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-center font-mono font-semibold transition text-xs border cursor-pointer ${
                      paymentType === item.id
                        ? "bg-[#17211D] text-[#F4F7F2] border-[#17211D] shadow-xs"
                        : "bg-[#E8EDD9] text-[#17211D] border-[#CBD4BC] hover:bg-[#DDE4CF]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Paid & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17211D] block">
                  Amount Paid (PKR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-[#58655E] text-xs">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs font-bold text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#17211D]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17211D] block">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#17211D]"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17211D] block">
                Payment Method / Channel *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "BANK_TRANSFER", label: "Bank Transfer (IBFT)", icon: Banknote },
                  { id: "CASH", label: "Cash in Hand", icon: DollarSign },
                  { id: "EASYPAISA_JAZZCASH", label: "Easypaisa / JazzCash", icon: CreditCard },
                  { id: "CHEQUE", label: "Cheque / Pay Order", icon: FileText },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                        paymentMethod === m.id
                          ? "bg-[#17211D] text-[#F4F7F2] border-[#17211D] shadow-xs"
                          : "bg-[#E8EDD9] text-[#17211D] border-[#CBD4BC] hover:bg-[#DDE4CF]"
                      }`}
                    >
                      <Icon size={14} className={paymentMethod === m.id ? "text-[#8FA66B]" : "text-[#58655E]"} />
                      <span className="truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference ID / Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17211D] block">
                Transaction Ref / Note (Optional)
              </label>
              <textarea
                rows={2}
                value={referenceNotes}
                onChange={(e) => setReferenceNotes(e.target.value)}
                placeholder="e.g. Sent via Meezan Bank mobile app, Ref #987654 or paid to Admin Ammar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#17211D]"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-semibold text-[#17211D] hover:bg-[#DDE4CF] transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-[#8FA66B]" />
                    <span>Sending Notification...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} className="text-[#8FA66B]" />
                    <span>Send Notification to Admin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
