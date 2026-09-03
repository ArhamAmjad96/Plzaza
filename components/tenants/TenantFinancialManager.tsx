"use client";

import { useState } from "react";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import { PaymentTransaction } from "@/lib/payments/service";
import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import PaymentHistoryTable from "@/components/payments/PaymentHistoryTable";

interface TenantFinancialManagerProps {
  connection: any;
  currentLedger: any;
  payments: PaymentTransaction[];
}

export default function TenantFinancialManager({
  connection,
  currentLedger,
  payments,
}: TenantFinancialManagerProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!currentLedger) return null;

  return (
    <div className="space-y-8">
      {/* Financial Overview Card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-blue-600 font-semibold">
              Financial Overview
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {formatBillingMonth(currentLedger.billing_month)} Ledger
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex rounded-full px-4 py-1.5 text-xs font-bold ${
                currentLedger.status === "paid"
                  ? "bg-emerald-100 text-emerald-800"
                  : currentLedger.status === "partially_paid"
                  ? "bg-blue-100 text-blue-800"
                  : currentLedger.status === "overdue"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {currentLedger.status.toUpperCase().replace("_", " ")}
            </span>

            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
            >
              + Record Payment
            </button>
          </div>
        </div>

        {/* Current Month Breakdown Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Monthly Rent</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 font-mono">
              {formatPKR(currentLedger.rent_amount)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Electricity Bill</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 font-mono">
              {currentLedger.has_electricity_bill ? (
                formatPKR(currentLedger.electricity_amount)
              ) : (
                <span className="text-sm font-normal text-slate-400">Not fetched yet</span>
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Previous Outstanding Balance</p>
            <p className="mt-1 text-2xl font-bold text-amber-700 font-mono">
              {formatPKR(currentLedger.previous_balance)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Total Payable</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 font-mono">
              {formatPKR(currentLedger.total_payable)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Amount Paid</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 font-mono">
              {formatPKR(currentLedger.paid_amount)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Remaining Balance</p>
            <p className="mt-1 text-2xl font-bold text-rose-600 font-mono">
              {formatPKR(currentLedger.remaining_balance)}
            </p>
          </div>
        </div>
      </section>

      {/* Payment Transactions & Receipts Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Payment Transactions & Receipts
            </h3>
            <p className="text-xs text-slate-500">
              Recorded payments, generated receipts, and transaction history.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            + New Payment
          </button>
        </div>

        <PaymentHistoryTable
          payments={payments}
          connectionId={connection.id}
          tenantName={connection.tenant || connection.name}
          shopName={connection.name}
          referenceNumber={connection.reference_number}
          currentLedger={currentLedger}
        />
      </section>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <RecordPaymentModal
          connectionId={connection.id}
          tenantId={connection.tenant_id || connection.id}
          unitId={connection.unit_id}
          leaseId={connection.lease_id}
          tenantName={connection.tenant || connection.name}
          shopName={connection.name}
          referenceNumber={connection.reference_number}
          billingMonth={currentLedger.billing_month}
          rentAmount={currentLedger.rent_amount}
          electricityAmount={currentLedger.electricity_amount}
          previousBalance={currentLedger.previous_balance}
          maintenanceAmount={currentLedger.maintenance_amount}
          otherCharges={currentLedger.other_charges}
          totalPayable={currentLedger.total_payable}
          currentPaid={currentLedger.paid_amount}
          remainingAmount={currentLedger.remaining_balance}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
