"use client";

import { useState } from "react";
import Link from "next/link";
import { UnitItem } from "@/lib/units/service";
import { TenantItem, LeaseItem } from "@/lib/tenants/service";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import StatusBadge from "@/components/ui/StatusBadge";
import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import EditUnitModal from "@/components/units/EditUnitModal";
import VacateTenantModal from "@/components/tenants/VacateTenantModal";
import AddTenantModal from "@/components/tenants/AddTenantModal";
import ViewBillModal from "@/components/bills/ViewBillModal";
import ConnectMeterModal from "@/components/units/ConnectMeterModal";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  CreditCard,
  Zap,
  Wrench,
  RotateCw,
  Eye,
  Sliders,
  UserX,
  Plus,
  ShieldCheck,
  Calendar,
  CheckCircle2,
} from "lucide-react";

interface UnitDetailViewProps {
  unit: UnitItem;
  tenant?: TenantItem | null;
  lease?: LeaseItem | null;
  electricity?: {
    connection_id: number | string;
    reference_number: string;
    meter_number?: string | null;
    is_shared: boolean;
    split_formula?: string;
    latest_bill?: {
      id?: number | string;
      billing_month?: string;
      bill_amount: number;
      units_consumed?: number;
      status?: string;
      due_date?: string;
      bill_image_url?: string | null;
    } | null;
  } | null;
  payments?: any[];
  ledgers?: any[];
  complaints?: any[];
}

export default function UnitDetailView({
  unit,
  tenant,
  lease,
  electricity,
  payments = [],
  ledgers = [],
  complaints = [],
}: UnitDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"PAYMENTS" | "LEDGERS" | "MAINTENANCE">("PAYMENTS");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Modals
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showEditUnit, setShowEditUnit] = useState(false);
  const [showVacate, setShowVacate] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showViewBill, setShowViewBill] = useState(false);
  const [showConnectMeter, setShowConnectMeter] = useState(false);

  const router = useRouter();
  const isOccupied = unit.status === "OCCUPIED" && tenant;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const latestBill = electricity?.latest_bill;

  async function handleSyncIESCO() {
    if (!electricity?.reference_number) return;
    setSyncing(true);
    setSyncMessage("Syncing with IESCO...");
    try {
      const res = await fetch("/api/bill-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceNumber: electricity.reference_number }),
      });
      if (res.ok) {
        setSyncMessage("✓ Bill Updated");
        router.refresh();
      } else {
        setSyncMessage("Could not update bill");
      }
    } catch {
      setSyncMessage("Sync failed");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 3000);
    }
  }

  return (
    <div className="space-y-10">
      {/* ─── Top Breadcrumb & Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#CBD4BC]">
        <div>
          <Link
            href="/units"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#58655E] hover:text-[#17211D] transition mb-2"
          >
            <ArrowLeft size={13} />
            <span>Back to Shops & Rooms</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#17211D]">
              {unit.unit_number || unit.unit_name}
            </h1>
            <StatusBadge status={unit.status} />
          </div>
          <p className="text-xs text-[#58655E] mt-0.5">
            {unit.floor} · {unit.unit_type === "ROOM" ? "Residential Flat Room" : "Commercial Storefront Shop"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isOccupied ? (
            <>
              <button
                type="button"
                onClick={() => setShowRecordPayment(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition shadow-xs"
              >
                <CreditCard size={13} />
                <span>Record Payment</span>
              </button>
              <button
                type="button"
                onClick={() => setShowVacate(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-medium text-[#8E3E33] hover:bg-[#FAECE9] transition"
              >
                <UserX size={13} />
                <span>Tenant Left</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddTenant(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF704D] text-[#17211D] text-xs font-semibold hover:bg-[#E05432] hover:text-[#F4F7F2] transition shadow-xs"
            >
              <Plus size={14} />
              <span>Assign Tenant</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowEditUnit(true)}
            className="p-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-[#58655E] hover:text-[#17211D] hover:bg-[#E8EDD9] transition"
            title="Edit Unit Settings"
          >
            <Sliders size={14} />
          </button>
        </div>
      </div>

      {/* ─── Tenant Profile Hero (If Occupied) ─── */}
      {isOccupied && (
        <section className="p-6 sm:p-8 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-3">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#58655E]">
              ACTIVE TENANT ON LEASE
            </span>
            <span className="text-xs font-mono text-[#8FA66B] flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Lease Active</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#58655E]">Full Name</span>
              <p className="text-base font-semibold text-[#17211D] mt-0.5">{tenant.full_name}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-[#58655E]">Phone Number</span>
              <p className="text-base font-mono font-semibold text-[#17211D] mt-0.5">{tenant.phone || "—"}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-[#58655E]">CNIC (13 Digits)</span>
              <p className="text-base font-mono text-[#17211D] mt-0.5">{tenant.cnic || "—"}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-[#58655E]">Move-In Date</span>
              <p className="text-base font-mono text-[#17211D] mt-0.5">{lease?.lease_start_date || "Current"}</p>
            </div>
          </div>
        </section>
      )}

      {/* ─── 3 Big Focus Cards: Rent, Electricity, Security ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Monthly Rent */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] flex flex-col justify-between space-y-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#58655E]">
                MONTHLY RENT
              </span>
              <CreditCard size={15} className="text-[#8FA66B]" />
            </div>
            <p className="font-mono text-3xl font-semibold text-[#17211D] mt-3">
              {formatPKR(lease ? lease.monthly_rent : unit.default_monthly_rent)}
            </p>
            <p className="text-xs text-[#58655E] mt-1">
              Due on the {lease?.rent_due_day || unit.default_rent_due_day || 5}th of every month
            </p>
          </div>

          <div className="pt-3 border-t border-[#CBD4BC]/60 flex items-center justify-between text-xs font-mono">
            <span className="text-[#58655E]">Status:</span>
            <span className="font-semibold text-[#2D5A43]">Active Lease</span>
          </div>
        </div>

        {/* Card 2: Electricity Utility */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#1B2521] border border-[#32433B] text-[#F4F7F2] flex flex-col justify-between space-y-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#8FA66B]">
                ELECTRICITY UTILITY
              </span>
              <Zap size={15} className="text-[#FF704D]" />
            </div>

            {electricity ? (
              <div className="mt-3 space-y-1">
                <p className="font-mono text-3xl font-semibold text-[#F4F7F2]">
                  {latestBill ? formatPKR(latestBill.bill_amount) : "Rs. 0"}
                </p>
                <p className="text-xs text-[#85918A]">
                  {latestBill ? `${latestBill.units_consumed || 165} kWh · Due ${latestBill.due_date || "20th"}` : "No bill due"}
                </p>
                <p className="text-[10px] font-mono text-[#8FA66B] pt-1">
                  IESCO Ref: {electricity.reference_number} {electricity.is_shared && `(${electricity.split_formula || "Shared"})`}
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-1">
                <p className="text-sm font-semibold text-[#F4F7F2]">No Meter Attached</p>
                <p className="text-xs text-[#85918A]">Attach a 14-digit IESCO reference number.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#32433B] flex items-center justify-between gap-2">
            {electricity ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowViewBill(true)}
                  className="text-xs font-medium text-[#FF704D] hover:underline"
                >
                  View Bill →
                </button>
                <button
                  type="button"
                  onClick={handleSyncIESCO}
                  disabled={syncing}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#85918A] hover:text-[#F4F7F2]"
                >
                  <RotateCw size={11} className={syncing ? "animate-spin text-[#FF704D]" : ""} />
                  <span>{syncMessage || "Sync IESCO"}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowConnectMeter(true)}
                className="text-xs font-medium text-[#FF704D] hover:underline"
              >
                Connect Meter →
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Security Deposit */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] flex flex-col justify-between space-y-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#58655E]">
                SECURITY DEPOSIT
              </span>
              <ShieldCheck size={15} className="text-[#8FA66B]" />
            </div>
            <p className="font-mono text-3xl font-semibold text-[#17211D] mt-3">
              {formatPKR(lease ? lease.security_paid : unit.default_security_amount)}
            </p>
            <p className="text-xs text-[#58655E] mt-1">
              Required: {formatPKR(lease ? lease.security_amount : unit.default_security_amount)}
            </p>
          </div>

          <div className="pt-3 border-t border-[#CBD4BC]/60 flex items-center justify-between text-xs font-mono">
            <span className="text-[#58655E]">Status:</span>
            <span className="font-semibold text-[#2D5A43]">
              {lease && lease.security_paid >= lease.security_amount ? "Fully Paid ✓" : "Held on File"}
            </span>
          </div>
        </div>
      </section>

      {/* ─── Activity & History Tabs ─── */}
      <section className="space-y-4">
        <div className="flex items-center p-1 rounded-2xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-medium text-[#58655E] max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab("PAYMENTS")}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === "PAYMENTS" ? "bg-[#17211D] text-[#F4F7F2] shadow-xs" : "hover:text-[#17211D]"
            }`}
          >
            Payments ({payments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LEDGERS")}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === "LEDGERS" ? "bg-[#17211D] text-[#F4F7F2] shadow-xs" : "hover:text-[#17211D]"
            }`}
          >
            Monthly Ledgers ({ledgers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MAINTENANCE")}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === "MAINTENANCE" ? "bg-[#17211D] text-[#F4F7F2] shadow-xs" : "hover:text-[#17211D]"
            }`}
          >
            Repairs ({complaints.length})
          </button>
        </div>

        {/* Tab 1: Payments */}
        {activeTab === "PAYMENTS" && (
          <div className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] overflow-hidden shadow-xs">
            {payments.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#58655E]">
                No payment transactions recorded for this space yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#E8EDD9] text-[10px] uppercase font-semibold text-[#58655E] border-b border-[#CBD4BC]">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Receipt #</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD4BC]/60">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#E8EDD9]/40">
                      <td className="p-3.5 text-[#58655E]">{p.payment_date}</td>
                      <td className="p-3.5 font-semibold text-[#17211D]">{p.receipt_number || `REC-${p.id}`}</td>
                      <td className="p-3.5 text-[#58655E]">{p.payment_type}</td>
                      <td className="p-3.5 text-[#58655E]">{p.payment_method}</td>
                      <td className="p-3.5 text-right font-semibold text-[#2D5A43]">{formatPKR(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Monthly Ledgers */}
        {activeTab === "LEDGERS" && (
          <div className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] overflow-hidden shadow-xs">
            {ledgers.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#58655E]">
                No historical monthly ledger charges found for this space.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#E8EDD9] text-[10px] uppercase font-semibold text-[#58655E] border-b border-[#CBD4BC]">
                  <tr>
                    <th className="p-3.5">Billing Month</th>
                    <th className="p-3.5 text-right">Rent</th>
                    <th className="p-3.5 text-right">Electricity</th>
                    <th className="p-3.5 text-right">Paid</th>
                    <th className="p-3.5 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD4BC]/60">
                  {ledgers.map((l, i) => (
                    <tr key={i} className="hover:bg-[#E8EDD9]/40">
                      <td className="p-3.5 font-sans font-semibold text-[#17211D]">{formatBillingMonth(l.billing_month)}</td>
                      <td className="p-3.5 text-right text-[#58655E]">{formatPKR(l.rent_amount)}</td>
                      <td className="p-3.5 text-right text-[#58655E]">{l.has_electricity_bill ? formatPKR(l.electricity_amount) : "—"}</td>
                      <td className="p-3.5 text-right text-[#2D5A43]">{formatPKR(l.paid_amount)}</td>
                      <td className="p-3.5 text-right font-semibold text-[#8E3E33]">{formatPKR(l.remaining_balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Repairs */}
        {activeTab === "MAINTENANCE" && (
          <div className="rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] overflow-hidden shadow-xs">
            {complaints.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#58655E]">
                Zero maintenance complaints or repair requests on record for this unit.
              </div>
            ) : (
              <div className="divide-y divide-[#CBD4BC]/60">
                {complaints.map((c) => (
                  <div key={c.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-[#17211D]">{c.title}</p>
                      <p className="text-[11px] text-[#58655E]">{c.category} · Priority: {c.priority}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── Modals ─── */}
      {showRecordPayment && (
        <RecordPaymentModal
          connectionId={electricity?.connection_id || 1}
          tenantName={tenant?.full_name || "Tenant"}
          shopName={unit.unit_name}
          referenceNumber={electricity?.reference_number}
          billingMonth={currentMonth}
          rentAmount={lease ? lease.monthly_rent : unit.default_monthly_rent}
          electricityAmount={latestBill?.bill_amount || null}
          previousBalance={0}
          maintenanceAmount={0}
          otherCharges={0}
          totalPayable={lease ? lease.monthly_rent + (latestBill?.bill_amount || 0) : unit.default_monthly_rent}
          currentPaid={0}
          remainingAmount={lease ? lease.monthly_rent : unit.default_monthly_rent}
          onClose={() => setShowRecordPayment(false)}
        />
      )}

      {showEditUnit && (
        <EditUnitModal
          unit={unit}
          initialReferenceNumber={electricity?.reference_number || ""}
          initialMeterNumber={electricity?.meter_number || ""}
          onClose={() => setShowEditUnit(false)}
        />
      )}

      {showVacate && tenant && lease && (
        <VacateTenantModal
          tenantView={{ tenant, lease, unit, is_active: true }}
          onClose={() => setShowVacate(false)}
        />
      )}

      {showAddTenant && (
        <AddTenantModal
          preselectedUnit={unit}
          preselectedUnitId={unit.id}
          onClose={() => setShowAddTenant(false)}
        />
      )}

      {showConnectMeter && (
        <ConnectMeterModal
          unit={unit}
          onClose={() => setShowConnectMeter(false)}
        />
      )}

      {showViewBill && electricity && (
        <ViewBillModal
          billData={{
            referenceNumber: electricity.reference_number,
            meterNumber: electricity.meter_number || undefined,
            consumerName: `${unit.unit_name} (${tenant?.full_name || "Commercial Space"})`,
            billAmount: latestBill?.bill_amount || 5400,
            unitsConsumed: latestBill?.units_consumed || 165,
            dueDate: latestBill?.due_date || "20 Aug 2026",
            billStatus: latestBill?.status || "unpaid",
            billImageUrl: latestBill?.bill_image_url || null,
          }}
          onClose={() => setShowViewBill(false)}
        />
      )}
    </div>
  );
}
