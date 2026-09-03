"use client";

import { useState } from "react";
import { TenantPaymentReportAlert } from "@/lib/logs/service";
import { LedgerItem } from "@/lib/ledgers/service";
import { formatPKR } from "@/lib/utils/format";
import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import { markNotificationsAsReadAction } from "@/app/logs/actions";
import {
  Bell,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Banknote,
  Check,
  X,
} from "lucide-react";

interface TenantPaymentAlertsBannerProps {
  alerts: TenantPaymentReportAlert[];
  ledgers: LedgerItem[];
}

export default function TenantPaymentAlertsBanner({
  alerts,
  ledgers,
}: TenantPaymentAlertsBannerProps) {
  const [activeAlerts, setActiveAlerts] = useState<TenantPaymentReportAlert[]>(alerts);
  const [selectedLedgerForPayment, setSelectedLedgerForPayment] = useState<{
    ledger: LedgerItem;
    alert: TenantPaymentReportAlert;
  } | null>(null);

  if (activeAlerts.length === 0) return null;

  async function handleDismiss(alert: TenantPaymentReportAlert) {
    if (alert.log_id) {
      await markNotificationsAsReadAction(`notif-${alert.log_id}`);
    }
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
  }

  function handleOpenRecordPayment(alert: TenantPaymentReportAlert) {
    const matchedLedger = ledgers.find(
      (l) => l.tenant_id?.toString() === alert.tenant_id?.toString()
    ) || {
      id: alert.tenant_id,
      tenant_id: alert.tenant_id,
      unit_id: 1,
      tenant_name: alert.tenant_name,
      shop_name: alert.unit_name,
      billing_month: new Date().toISOString().slice(0, 7) + "-01",
      rent_amount: alert.amount,
      total_payable: alert.amount,
      paid_amount: 0,
      remaining_balance: alert.amount,
      has_electricity_bill: false,
      electricity_amount: 0,
    } as LedgerItem;

    setSelectedLedgerForPayment({
      ledger: matchedLedger,
      alert,
    });
  }

  const unverifiedCount = activeAlerts.filter((a) => !a.read).length;

  return (
    <>
      <div className="rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] p-6 shadow-xs space-y-4 select-none animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#CBD4BC]/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#17211D] text-[#8FA66B] flex items-center justify-center shrink-0 shadow-2xs">
              <Bell size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#17211D]">
                  Tenant Payment Notifications
                </h3>
                {unverifiedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FF704D] text-[#FAF6F0] text-[10px] font-mono font-bold">
                    {unverifiedCount} NEW
                  </span>
                )}
              </div>
              <p className="text-xs text-[#58655E]">
                Tenants reported payments from their resident portal. Review and record their transactions to clear their ledgers.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-[#58655E]">
            {activeAlerts.length} reported payment{activeAlerts.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Alert Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-3 flex flex-col justify-between hover:border-[#8FA66B] transition shadow-2xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#17211D] text-[#8FA66B] flex items-center justify-center font-bold text-xs shrink-0">
                      {alert.tenant_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#17211D]">
                        {alert.tenant_name}
                      </p>
                      <p className="text-[11px] font-mono text-[#58655E]">
                        {alert.unit_name}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold text-[#2D5A27] bg-[#FAF6F0] border border-[#CBD4BC] px-2.5 py-1 rounded-xl shadow-2xs">
                    {formatPKR(alert.amount)}
                  </span>
                </div>

                <div className="bg-[#FAF6F0]/80 p-2.5 rounded-xl border border-[#CBD4BC]/70 space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-[#58655E]">
                    <span>Channel:</span>
                    <strong className="text-[#17211D]">{alert.payment_method.replace(/_/g, " ")}</strong>
                  </div>
                  <div className="flex justify-between text-[#58655E]">
                    <span>Reported Date:</span>
                    <span className="text-[#17211D]">{alert.payment_date}</span>
                  </div>
                  {alert.notes && (
                    <div className="pt-1 border-t border-[#CBD4BC]/40 text-[#17211D] italic text-[11px] font-sans">
                      "{alert.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 font-sans">
                <button
                  type="button"
                  onClick={() => handleDismiss(alert)}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-[#58655E] hover:bg-[#DDE4CF] hover:text-[#17211D] transition cursor-pointer"
                >
                  Dismiss
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenRecordPayment(alert)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer"
                >
                  <CreditCard size={13} className="text-[#8FA66B]" />
                  <span>Record & Verify</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Payment Modal triggered directly from Alert */}
      {selectedLedgerForPayment && (
        <RecordPaymentModal
          connectionId={selectedLedgerForPayment.ledger.unit_id || 1}
          tenantId={selectedLedgerForPayment.ledger.tenant_id}
          unitId={selectedLedgerForPayment.ledger.unit_id}
          tenantName={selectedLedgerForPayment.ledger.tenant_name || selectedLedgerForPayment.alert.tenant_name}
          shopName={selectedLedgerForPayment.ledger.shop_name || selectedLedgerForPayment.alert.unit_name}
          referenceNumber={selectedLedgerForPayment.ledger.reference_number}
          billingMonth={selectedLedgerForPayment.ledger.billing_month}
          rentAmount={selectedLedgerForPayment.ledger.rent_amount || selectedLedgerForPayment.alert.amount}
          electricityAmount={selectedLedgerForPayment.ledger.has_electricity_bill ? selectedLedgerForPayment.ledger.electricity_amount : null}
          previousBalance={selectedLedgerForPayment.ledger.previous_balance || 0}
          maintenanceAmount={0}
          otherCharges={0}
          totalPayable={selectedLedgerForPayment.ledger.total_payable || selectedLedgerForPayment.alert.amount}
          currentPaid={selectedLedgerForPayment.ledger.paid_amount || 0}
          remainingAmount={selectedLedgerForPayment.ledger.remaining_balance || selectedLedgerForPayment.alert.amount}
          onClose={() => {
            handleDismiss(selectedLedgerForPayment.alert);
            setSelectedLedgerForPayment(null);
          }}
        />
      )}
    </>
  );
}
