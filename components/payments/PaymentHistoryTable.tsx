"use client";

import { useState } from "react";
import { PaymentTransaction } from "@/lib/payments/service";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import { deletePaymentAction } from "@/app/payments/actions";
import PaymentReceiptModal from "./PaymentReceiptModal";
import { Receipt, Trash2, Home, Zap, ShieldCheck, Wrench, Building2 } from "lucide-react";

interface PaymentHistoryTableProps {
  payments: PaymentTransaction[];
  connectionId: number | string;
  tenantName: string;
  shopName: string;
  referenceNumber?: string;
  currentLedger?: any;
}

export default function PaymentHistoryTable({
  payments,
  connectionId,
  tenantName,
  shopName,
  referenceNumber,
  currentLedger,
}: PaymentHistoryTableProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  async function handleDelete(payment: PaymentTransaction) {
    const confirmDelete = window.confirm(
      `Are you sure you want to reverse payment ${payment.receipt_number} (${formatPKR(payment.amount)})? This will update the remaining ledger balance.`
    );
    if (!confirmDelete) return;

    setDeletingId(payment.id);
    try {
      const billingMonth = payment.payment_date.slice(0, 7) + "-01";
      await deletePaymentAction(payment.id, connectionId, billingMonth);
    } catch {
      alert("Failed to delete payment transaction.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleViewReceipt(payment: PaymentTransaction) {
    const billingMonth = formatBillingMonth(payment.payment_date.slice(0, 7) + "-01");
    setSelectedReceipt({
      receiptNumber: payment.receipt_number || `RCP-${payment.id}`,
      paymentDate: payment.payment_date,
      paymentAmount: payment.amount,
      paymentType: payment.payment_type || "RENT",
      paymentMethod: payment.payment_method,
      transactionReference: payment.transaction_reference,
      notes: payment.notes,
      tenantName: payment.tenant_name || tenantName,
      shopName: payment.shop_name || payment.unit_name || shopName,
      referenceNumber,
      billingMonth,
      rentAmount: currentLedger?.rent_amount || 0,
      electricityAmount: currentLedger?.electricity_amount || null,
      previousBalance: currentLedger?.previous_balance || 0,
      maintenanceAmount: currentLedger?.maintenance_amount || 0,
      otherCharges: currentLedger?.other_charges || 0,
      totalPayable: currentLedger?.total_payable || 0,
      totalPaid: currentLedger?.paid_amount || payment.amount,
      remainingBalance: currentLedger?.remaining_balance || 0,
    });
  }

  const categoryIcons: Record<string, any> = {
    RENT: Home,
    ELECTRICITY: Zap,
    SECURITY: ShieldCheck,
    MAINTENANCE: Wrench,
    OTHER: Building2,
  };

  return (
    <div className="space-y-4">
      {payments.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] shadow-xs">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#E8EDD9] text-[10px] font-semibold uppercase tracking-wider text-[#58655E] border-b border-[#CBD4BC]">
              <tr>
                <th className="px-4 py-3.5">Receipt #</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Reference</th>
                <th className="px-4 py-3.5 text-right">Amount (PKR)</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#CBD4BC]/60">
              {payments.map((p) => {
                const CatIcon = categoryIcons[p.payment_type || "RENT"] || Building2;
                return (
                  <tr key={p.id} className="hover:bg-[#E8EDD9]/40 transition">
                    <td className="px-4 py-3.5 font-bold text-[#17211D]">
                      {p.receipt_number || `RCP-${p.id}`}
                    </td>
                    <td className="px-4 py-3.5 text-[#58655E]">{p.payment_date}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[10px] font-bold text-[#17211D] uppercase">
                        <CatIcon size={11} />
                        <span>{p.payment_type || "RENT"}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#58655E]">
                      {p.payment_method}
                    </td>
                    <td className="px-4 py-3.5 text-[#58655E]">
                      {p.transaction_reference || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#2D5A43] text-sm">
                      {formatPKR(p.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleViewReceipt(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-sans font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer"
                      >
                        <Receipt size={12} />
                        <span>View Receipt</span>
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === p.id}
                        onClick={() => handleDelete(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#EBC1BA] bg-[#FAECE9] text-[#8E3E33] text-xs font-sans font-medium hover:bg-[#F7D8D3] transition disabled:opacity-50 cursor-pointer"
                        title="Reverse transaction"
                      >
                        <Trash2 size={12} />
                        <span>{deletingId === p.id ? "Reversing..." : "Reverse"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] p-8 text-center space-y-2 text-xs text-[#58655E]">
          <Receipt size={28} className="mx-auto text-[#58655E]" />
          <p className="font-semibold text-[#17211D]">No payment transactions recorded for this space yet.</p>
        </div>
      )}

      {selectedReceipt && (
        <PaymentReceiptModal
          {...selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
