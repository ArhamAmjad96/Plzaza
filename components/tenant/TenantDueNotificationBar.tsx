"use client";

import { useState } from "react";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import TenantNotifyPaymentModal from "./TenantNotifyPaymentModal";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Bell,
  ArrowRight,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

interface TenantDueNotificationBarProps {
  outstandingBalance: number;
  monthlyRent: number;
  currentMonth: string;
  unitName?: string;
  tenantName?: string;
}

export default function TenantDueNotificationBar({
  outstandingBalance,
  monthlyRent,
  currentMonth,
  unitName = "Assigned Unit",
  tenantName = "Resident",
}: TenantDueNotificationBarProps) {
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  const currentDay = new Date().getDate();
  const isPastDueDate = currentDay >= 10;
  const isApproachingDue = currentDay >= 5 && currentDay < 10;
  const hasOutstandingBalance = outstandingBalance > 0;

  return (
    <>
      {/* ─── Notification Bar ─── */}
      <div className="w-full">
        {hasOutstandingBalance ? (
          isPastDueDate ? (
            /* Due Date Exceeded (10th or later with unpaid balance) */
            <div className="p-4 sm:p-5 rounded-3xl bg-[#FAECE9] border border-[#EAC4BE] text-[#8E3E33] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#E08A7E]/20 border border-[#EAC4BE] flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={20} className="text-[#8E3E33]" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#8E3E33] text-[#FAF6F0] px-2 py-0.5 rounded-md">
                      DUE DATE PASSED (10TH)
                    </span>
                    <span className="text-xs font-mono font-bold text-[#8E3E33]">
                      {formatBillingMonth(currentMonth)}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#17211D] mt-1">
                    Monthly Rent Payment Due Reminder
                  </h3>
                  <p className="text-xs text-[#58655E] max-w-2xl leading-relaxed">
                    Your monthly rent of <strong className="text-[#17211D]">{formatPKR(monthlyRent)}</strong> was due on the <strong>10th</strong> of this month. Current outstanding balance is <strong className="text-[#8E3E33] font-mono font-bold">{formatPKR(outstandingBalance)}</strong>. If you have already paid in cash or bank, please click below to notify the admin.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#8E3E33] text-[#FAF6F0] text-xs font-bold hover:bg-[#723229] transition shadow-xs cursor-pointer"
                >
                  <Bell size={14} />
                  <span>Notify Admin of Payment</span>
                </button>

                <Link
                  href="/tenant/payments"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-semibold text-[#17211D] hover:bg-[#E8EDD9] transition cursor-pointer"
                >
                  <span>View Dues</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ) : (
            /* Approaching Due Date (Before 10th with unpaid balance) */
            <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] text-[#17211D] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] flex items-center justify-center shrink-0 mt-0.5 text-[#58655E]">
                  <Clock size={20} />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E8EDD9] text-[#17211D] px-2 py-0.5 rounded-md border border-[#CBD4BC]">
                      DUE BY 10TH
                    </span>
                    <span className="text-xs font-mono text-[#58655E]">
                      {formatBillingMonth(currentMonth)}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#17211D] mt-1">
                    Monthly Rent Payment Due on 10th
                  </h3>
                  <p className="text-xs text-[#58655E] max-w-2xl leading-relaxed">
                    Rent payment of <strong className="text-[#17211D]">{formatPKR(monthlyRent)}</strong> is due on the <strong>10th</strong>. Current payable: <strong className="text-[#17211D] font-mono font-bold">{formatPKR(outstandingBalance)}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-xs font-bold hover:bg-[#24332D] transition shadow-xs cursor-pointer"
                >
                  <Bell size={14} className="text-[#8FA66B]" />
                  <span>Notify Admin if Paid</span>
                </button>

                <Link
                  href="/tenant/payments"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-semibold text-[#17211D] hover:bg-[#DDE4CF] transition cursor-pointer"
                >
                  <span>Ledger</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )
        ) : (
          /* Settled All Dues */
          <div className="p-4 sm:p-5 rounded-3xl bg-[#E8EDD9] border border-[#CBD4BC] text-[#2D5A27] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] flex items-center justify-center shrink-0 text-[#2D5A27] shadow-2xs">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17211D]">
                  All Dues Settled for {formatBillingMonth(currentMonth)} ✓
                </h3>
                <p className="text-xs text-[#58655E]">
                  Your account is in good standing with zero outstanding balance.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowNotifyModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-semibold text-[#17211D] hover:bg-[#DDE4CF] transition cursor-pointer shrink-0"
            >
              <Bell size={13} className="text-[#8FA66B]" />
              <span>Report Advance / New Payment</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Notify Admin Modal ─── */}
      <TenantNotifyPaymentModal
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
        defaultAmount={outstandingBalance > 0 ? outstandingBalance : monthlyRent}
        unitName={unitName}
        tenantName={tenantName}
      />
    </>
  );
}
