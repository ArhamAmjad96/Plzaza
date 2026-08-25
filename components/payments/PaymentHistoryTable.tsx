"use client";

import { useState } from "react";
import { PaymentTransaction } from "@/lib/payments/service";
import { formatPKR } from "@/lib/utils/format";
import { deletePaymentAction } from "@/app/payments/actions";
import PaymentReceiptModal from "./PaymentReceiptModal";

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
    } catch (err) {
      alert("Failed to delete payment transaction.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleViewReceipt(payment: PaymentTransaction) {
    const billingMonth = payment.payment_date.slice(0, 7) + "-01";
    setSelectedReceipt({
      receiptNumber: payment.receipt_number,
      paymentDate: payment.payment_date,
      paymentAmount: payment.amount,
      paymentType: payment.payment_type || "RENT",
      paymentMethod: payment.payment_method,
      transactionReference: payment.transaction_reference,
      notes: payment.notes,
      tenantName,
      shopName,
      referenceNumber,
      billingMonth,
      rentAmount: currentLedger?.rent_amount || 0,
      electricityAmount: currentLedger?.electricity_amount || null,
      previousBalance: currentLedger?.previous_balance || 0,
      maintenanceAmount: currentLedger?.maintenance_amount || 0,
      otherCharges: currentLedger?.other_charges || 0,
      totalPayable: currentLedger?.total_payable || 0,
      totalPaid: currentLedger?.paid_amount || 0,
      remainingBalance: currentLedger?.remaining_balance || 0,
    });
  }

  return (
    <div className="space-y-4">
      {payments.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
              <tr>
                <th className="px-4 py-3">Receipt #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">
                    {p.receipt_number}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{p.payment_date}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 uppercase">
                      {p.payment_type || "RENT"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                      {p.payment_method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.transaction_reference || "-"}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-700 font-mono text-sm">
                    {formatPKR(p.amount)}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleViewReceipt(p)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      🧾 View Receipt
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === p.id}
                      onClick={() => handleDelete(p)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      {deletingId === p.id ? "Reversing..." : "✕ Reverse"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
          No payment transactions recorded for this tenant yet.
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
