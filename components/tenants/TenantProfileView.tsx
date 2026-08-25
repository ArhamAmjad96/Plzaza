"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import { TenantLeaseView } from "@/lib/tenants/service";
import { LedgerItem } from "@/lib/ledgers/service";
import { PaymentTransaction } from "@/lib/payments/service";
import { ComplaintItem } from "@/lib/complaints/service";
import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import PaymentReceiptModal from "@/components/payments/PaymentReceiptModal";
import EditTenantModal from "./EditTenantModal";
import VacateTenantModal from "./VacateTenantModal";
import AddComplaintModal from "@/components/complaints/AddComplaintModal";
import ComplaintDetailModal from "@/components/complaints/ComplaintDetailModal";

interface TenantProfileViewProps {
  tenantView: TenantLeaseView;
  ledgers: LedgerItem[];
  payments: PaymentTransaction[];
  complaints: ComplaintItem[];
  maintenanceExpenseMap: Record<string, number>;
  electricityInfo?: {
    connection_name?: string;
    reference_number?: string;
    meter_number?: string;
    is_shared?: boolean;
    split_formula?: string;
    latest_bill_amount?: number;
  };
}

export default function TenantProfileView({
  tenantView,
  ledgers,
  payments,
  complaints,
  maintenanceExpenseMap,
  electricityInfo,
}: TenantProfileViewProps) {
  const { tenant, lease, unit, is_active } = tenantView;

  // Active Modals State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVacateModal, setShowVacateModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);

  // Active ledger row for payment modal
  const currentLedger = ledgers[0] || null;

  // Computed summary metrics
  const totalRentPaidLifetime = payments
    .filter((p) => p.payment_type === "RENT")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalPaymentsLifetime = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const currentOutstanding = currentLedger ? currentLedger.remaining_balance : 0;

  function handlePrintStatement() {
    window.print();
  }

  function handleOpenReceipt(payment: PaymentTransaction) {
    const billingMonth = payment.payment_date.slice(0, 7) + "-01";
    setSelectedReceipt({
      receiptNumber: payment.receipt_number,
      paymentDate: payment.payment_date,
      paymentAmount: payment.amount,
      paymentType: payment.payment_type || "RENT",
      paymentMethod: payment.payment_method,
      transactionReference: payment.transaction_reference,
      notes: payment.notes,
      tenantName: tenant.full_name,
      shopName: unit?.unit_name || "Unit",
      referenceNumber: electricityInfo?.reference_number,
      billingMonth,
      rentAmount: currentLedger?.rent_amount || Number(lease?.monthly_rent || 0),
      electricityAmount: currentLedger?.electricity_amount || null,
      previousBalance: currentLedger?.previous_balance || 0,
      maintenanceAmount: currentLedger?.maintenance_amount || 0,
      otherCharges: currentLedger?.other_charges || 0,
      totalPayable: currentLedger?.total_payable || Number(lease?.monthly_rent || 0),
      totalPaid: currentLedger?.paid_amount || payment.amount,
      remainingBalance: currentLedger?.remaining_balance || 0,
    });
  }

  return (
    <div className="space-y-8">
      {/* 360 HEADER BANNER */}
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm print:border-none print:p-0 print:shadow-none">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">
                360° Tenant Profile
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  is_active
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {is_active ? "● ACTIVE OCCUPANCY" : "VACATED"}
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              {tenant.full_name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-semibold text-slate-900">
                {unit?.unit_type === "SHOP" ? "🏪" : "🛏️"} {unit?.unit_name || "Unassigned"} ({unit?.floor || "Plaza"})
              </span>
              <span>•</span>
              <span>Phone: <strong className="text-slate-900">{tenant.phone || "N/A"}</strong></span>
              <span>•</span>
              <span>CNIC: <strong className="text-slate-900">{tenant.cnic || "N/A"}</strong></span>
            </div>
          </div>

          {/* Actions Bar (Hidden on Print) */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 shadow-sm"
            >
              + Record Payment
            </button>

            <button
              type="button"
              onClick={() => setShowComplaintModal(true)}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              + Log Complaint
            </button>

            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              ✏️ Edit
            </button>

            {is_active && (
              <button
                type="button"
                onClick={() => setShowVacateModal(true)}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-sm"
              >
                🚪 Vacate
              </button>
            )}

            <button
              type="button"
              onClick={handlePrintStatement}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              🖨️ Print Statement
            </button>
          </div>
        </div>
      </section>

      {/* THREE DETAIL CARDS: Contact | Lease & Security | Electricity Meter */}
      <section className="grid gap-5 sm:grid-cols-3">
        {/* CARD 1: Contact & Personal Info */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-lg">👤</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Personal & Contacts
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Full Name:</span>
              <span className="font-bold text-slate-900">{tenant.full_name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="font-mono font-semibold text-slate-900">{tenant.phone || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">CNIC:</span>
              <span className="font-mono text-slate-900">{tenant.cnic || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Emergency Contact:</span>
              <span className="text-slate-800">{tenant.emergency_contact || "N/A"}</span>
            </div>

            {tenant.notes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-medium">Notes:</span>
                <p className="text-slate-700 mt-0.5 italic">{tenant.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: Active Lease & Security Terms */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-lg">📜</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Lease & Security Terms
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Monthly Rent:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatPKR(lease?.monthly_rent || unit?.default_monthly_rent || 0)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Rent Due Day:</span>
              <span className="font-bold text-slate-900">{lease?.rent_due_day || 5}th of month</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Security Required:</span>
              <span className="font-mono text-slate-900">{formatPKR(lease?.security_amount || 0)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Security Paid:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-emerald-600">
                  {formatPKR(lease?.security_paid || 0)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.2 text-[9px] font-bold ${
                    lease?.security_status === "PAID"
                      ? "bg-emerald-100 text-emerald-800"
                      : lease?.security_status === "PARTIAL"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {lease?.security_status || "UNPAID"}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Lease Dates:</span>
              <span className="text-slate-800">
                {lease?.lease_start_date || "N/A"} → {lease?.lease_end_date || "Open Ended"}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: Electricity Meter & Split Rule */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-lg">⚡</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Electricity Meter & Split
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Connection Name:</span>
              <span className="font-bold text-slate-900">{electricityInfo?.connection_name || "Commercial Meter"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Reference Number:</span>
              <span className="font-mono font-bold text-blue-600">{electricityInfo?.reference_number || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Meter Number:</span>
              <span className="font-mono text-slate-900">{electricityInfo?.meter_number || "N/A"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Split Rule:</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                electricityInfo?.is_shared ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-800"
              }`}>
                {electricityInfo?.is_shared ? "Shared Split" : "100% Dedicated"}
              </span>
            </div>

            {electricityInfo?.split_formula && (
              <p className="text-[11px] text-slate-500 italic mt-1">{electricityInfo.split_formula}</p>
            )}
          </div>
        </div>
      </section>

      {/* FINANCIAL LEDGER STATEMENT */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Monthly Financial Ledgers</h2>
            <p className="text-xs text-slate-500">Historical charges, allocated electricity shares, and balances.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">
              Lifetime Paid: <strong className="text-emerald-700 font-mono">{formatPKR(totalPaymentsLifetime)}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Billing Month</th>
                <th className="px-4 py-3">Monthly Rent</th>
                <th className="px-4 py-3">Electricity Share</th>
                <th className="px-4 py-3">Maintenance</th>
                <th className="px-4 py-3">Total Payable</th>
                <th className="px-4 py-3">Total Paid</th>
                <th className="px-4 py-3">Remaining</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {ledgers.length > 0 ? (
                ledgers.map((item) => (
                  <tr key={item.billing_month} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {formatBillingMonth(item.billing_month)}
                    </td>
                    <td className="px-4 py-3 font-mono">{formatPKR(item.rent_amount)}</td>
                    <td className="px-4 py-3 font-mono">
                      {item.electricity_amount !== null ? formatPKR(item.electricity_amount) : "Not fetched"}
                    </td>
                    <td className="px-4 py-3 font-mono">{formatPKR(item.maintenance_amount)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {formatPKR(item.total_payable)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                      {formatPKR(item.paid_amount)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-rose-600">
                      {formatPKR(item.remaining_balance)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "partially_paid"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No ledger records generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* PAYMENT TRANSACTIONS & RECEIPTS */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Payment Transactions & Receipts</h2>
            <p className="text-xs text-slate-500">Official receipts issued for rent, electricity, and security deposits.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Receipt #</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Reference #</th>
                <th className="px-4 py-3">Amount (PKR)</th>
                <th className="px-4 py-3 text-right">Receipt Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      {p.receipt_number}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{p.payment_date}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                        {p.payment_type || "RENT"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{p.payment_method}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono">{p.transaction_reference || "-"}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700 text-sm">
                      {formatPKR(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenReceipt(p)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                      >
                        🧾 View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No payment transactions recorded for this tenant yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MAINTENANCE & COMPLAINTS HISTORY */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Maintenance & Complaints History</h2>
            <p className="text-xs text-slate-500">Service requests, technician repairs, and repair expenses for this unit.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowComplaintModal(true)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            + Log New Issue
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Complaint #</th>
                <th className="px-4 py-3">Category & Title</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Repair Cost</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {complaints.length > 0 ? (
                complaints.map((c) => {
                  const cost = maintenanceExpenseMap[c.id.toString()] || 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{c.complaint_number}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-700">
                          {c.category}
                        </span>
                        <p className="font-semibold text-slate-900 mt-0.5 line-clamp-1">{c.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          c.priority === "HIGH" || c.priority === "URGENT"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{c.assigned_to || "Unassigned"}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {cost > 0 ? formatPKR(cost) : "Rs. 0"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedComplaint(c)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          🔧 Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No complaints or maintenance issues logged for this tenant/unit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODALS */}
      {showPaymentModal && currentLedger && (
        <RecordPaymentModal
          connectionId={currentLedger.connection_id}
          tenantName={tenant.full_name}
          shopName={unit?.unit_name || "Unit"}
          referenceNumber={electricityInfo?.reference_number}
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

      {showEditModal && (
        <EditTenantModal
          tenantView={tenantView}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showVacateModal && lease && (
        <VacateTenantModal
          tenantView={tenantView}
          onClose={() => setShowVacateModal(false)}
        />
      )}

      {showComplaintModal && unit && (
        <AddComplaintModal
          units={[unit]}
          tenants={[tenantView]}
          onClose={() => setShowComplaintModal(false)}
        />
      )}

      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
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
