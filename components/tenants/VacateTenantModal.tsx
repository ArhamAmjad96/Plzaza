"use client";

import { useState } from "react";
import { vacateTenantAction } from "@/app/tenants/actions";
import { TenantLeaseView } from "@/lib/tenants/service";
import { formatPKR } from "@/lib/utils/format";
import { UserX, X, AlertTriangle } from "lucide-react";

interface VacateTenantModalProps {
  tenantView: TenantLeaseView;
  onClose: () => void;
}

export default function VacateTenantModal({
  tenantView,
  onClose,
}: VacateTenantModalProps) {
  const { tenant, lease, unit } = tenantView;
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().split("T")[0]);
  const [refundSecurity, setRefundSecurity] = useState(
    lease ? lease.security_paid.toString() : "0"
  );
  const [deductions, setDeductions] = useState("0");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleVacate() {
    if (!lease) {
      alert("No active lease found for this tenant.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("lease_id", lease.id.toString());
      formData.append("unit_id", unit ? unit.id.toString() : "");
      formData.append("tenant_id", tenant.id.toString());
      formData.append("move_out_date", moveOutDate);
      formData.append("refund_amount", refundSecurity);
      formData.append("deductions", deductions);
      formData.append("reason", reason);

      await vacateTenantAction(formData);
      onClose();
    } catch {
      alert("Failed to process tenant move out.");
    } finally {
      setSubmitting(false);
    }
  }

  const netRefund = Math.max(
    0,
    Number(refundSecurity || 0) - Number(deductions || 0)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-7 shadow-2xl space-y-6 text-[#17211D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#FAECE9] border border-[#EBC1BA] text-[#8E3E33] flex items-center justify-center">
              <UserX size={17} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8E3E33] font-mono">
                LEASE TERMINATION
              </p>
              <h3 className="text-base font-semibold text-[#17211D]">
                Vacate {tenant.full_name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] flex items-center justify-center transition"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAECE9] border border-[#EBC1BA] text-[#8E3E33] space-y-1">
            <p className="font-semibold">Space Release Confirmation</p>
            <p className="text-[11px] leading-relaxed">
              Moving out will mark <strong>{unit?.unit_name}</strong> as VACANT, enabling you to immediately onboard a new tenant.
            </p>
          </div>

          <div>
            <label className="font-semibold text-[#17211D]">Move-Out Date</label>
            <input
              type="date"
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#17211D]">Held Security (PKR)</label>
              <input
                type="number"
                value={refundSecurity}
                onChange={(e) => setRefundSecurity(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#17211D]">Repair Deductions</label>
              <input
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#E8EDD9] border border-[#CBD4BC] flex items-center justify-between font-mono">
            <span className="text-xs text-[#58655E]">Net Security Refund:</span>
            <span className="text-sm font-bold text-[#2D5A43]">{formatPKR(netRefund)}</span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#CBD4BC]/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#58655E] hover:text-[#17211D]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVacate}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#8E3E33] text-[#F4F7F2] text-xs font-medium hover:bg-[#722F26] transition disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Confirm Move-Out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
