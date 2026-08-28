"use client";

import { useState } from "react";
import { updateTenantLeaseAction } from "@/app/tenants/actions";
import { TenantLeaseView } from "@/lib/tenants/service";
import { UnitItem } from "@/lib/units/service";
import { X } from "lucide-react";

interface EditTenantModalProps {
  tenantView: TenantLeaseView;
  availableUnits?: UnitItem[];
  onClose: () => void;
}

export default function EditTenantModal({
  tenantView,
  onClose,
}: EditTenantModalProps) {
  const { tenant, lease, unit } = tenantView;

  const [fullName, setFullName] = useState(tenant.full_name);
  const [phone, setPhone] = useState(tenant.phone || "");
  const [cnic, setCnic] = useState(tenant.cnic || "");
  const [emergencyContact, setEmergencyContact] = useState(tenant.emergency_contact || "");
  const [monthlyRent, setMonthlyRent] = useState(lease?.monthly_rent?.toString() || "0");
  const [rentDueDay, setRentDueDay] = useState(lease?.rent_due_day?.toString() || "5");
  const [securityAmount, setSecurityAmount] = useState(lease?.security_amount?.toString() || "0");
  const [securityPaid, setSecurityPaid] = useState(lease?.security_paid?.toString() || "0");
  const [referenceNumber, setReferenceNumber] = useState(
    (unit as any)?.reference_number || tenantView.reference_number || ""
  );
  const [meterNumber, setMeterNumber] = useState(
    (unit as any)?.meter_number || tenantView.meter_number || ""
  );
  const [notes, setNotes] = useState(tenant.notes || "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("tenant_id", tenant.id.toString());
      if (lease) formData.append("lease_id", lease.id.toString());
      if (unit) formData.append("unit_id", unit.id.toString());
      formData.append("full_name", fullName);
      formData.append("phone", phone);
      formData.append("cnic", cnic);
      formData.append("emergency_contact", emergencyContact);
      formData.append("monthly_rent", monthlyRent);
      formData.append("rent_due_day", rentDueDay);
      formData.append("security_amount", securityAmount);
      formData.append("security_paid", securityPaid);
      formData.append("reference_number", referenceNumber.trim());
      formData.append("meter_number", meterNumber.trim());
      formData.append("notes", notes);

      await updateTenantLeaseAction(formData);
      onClose();
    } catch {
      alert("Failed to update tenant details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-[#17211D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
              TENANT PROFILE
            </p>
            <h3 className="text-lg font-medium text-[#17211D]">
              Edit {tenant.full_name}
            </h3>
            {unit && (
              <p className="text-xs text-[#58655E] mt-0.5">
                Occupying {unit.unit_name} ({unit.floor})
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] flex items-center justify-center transition"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#17211D]">Full Name / Business Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#17211D]">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-[#17211D]">CNIC (13 Digits)</label>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#17211D]">Emergency Contact</label>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D]"
            />
          </div>

          {lease && (
            <div className="p-4 bg-[#E8EDD9] rounded-2xl border border-[#CBD4BC] space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
                LEASE & FINANCIAL TERMS
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#17211D]">Monthly Rent (PKR)</label>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#17211D]">Due Day (1–28)</label>
                  <input
                    type="number"
                    value={rentDueDay}
                    onChange={(e) => setRentDueDay(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#17211D]">Security Required</label>
                  <input
                    type="number"
                    value={securityAmount}
                    onChange={(e) => setSecurityAmount(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#17211D]">Security Paid</label>
                  <input
                    type="number"
                    value={securityPaid}
                    onChange={(e) => setSecurityPaid(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                  />
                </div>
              </div>

              {/* Electricity Meter Reference */}
              <div className="pt-2 border-t border-[#CBD4BC]/40 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
                  IESCO ELECTRICITY METER
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#17211D]">14-Digit Ref No.</label>
                    <input
                      type="text"
                      maxLength={14}
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. 15142165162900"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#17211D]">Meter Serial (Opt.)</label>
                    <input
                      type="text"
                      value={meterNumber}
                      onChange={(e) => setMeterNumber(e.target.value)}
                      placeholder="e.g. MTR-4091"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[#CBD4BC]/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#58655E] hover:text-[#17211D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
