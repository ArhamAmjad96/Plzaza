"use client";

import { useState, useEffect } from "react";
import { createTenantAction } from "@/app/tenants/actions";
import { getAvailableUnitsAction } from "@/app/units/actions";
import { UnitItem } from "@/lib/units/service";
import { formatPKR } from "@/lib/utils/format";
import {
  Users,
  Building2,
  Calendar,
  Check,
  X,
  Phone,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface AddTenantModalProps {
  availableUnits?: UnitItem[];
  preselectedUnitId?: number | string;
  preselectedUnit?: UnitItem;
  onClose: () => void;
}

export default function AddTenantModal({
  availableUnits: initialUnits,
  preselectedUnitId,
  preselectedUnit,
  onClose,
}: AddTenantModalProps) {
  const initialFound =
    preselectedUnit ||
    (preselectedUnitId && initialUnits
      ? initialUnits.find((u) => u.id.toString() === preselectedUnitId.toString())
      : null);

  const [unitsList, setUnitsList] = useState<UnitItem[]>(initialUnits || []);
  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(initialFound || null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    initialFound ? initialFound.id.toString() : preselectedUnitId ? preselectedUnitId.toString() : ""
  );

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const [monthlyRent, setMonthlyRent] = useState(
    initialFound ? initialFound.default_monthly_rent.toString() : "30000"
  );
  const [rentDueDay, setRentDueDay] = useState(
    initialFound ? initialFound.default_rent_due_day.toString() : "5"
  );
  const [securityAmount, setSecurityAmount] = useState(
    initialFound ? initialFound.default_security_amount.toString() : "50000"
  );
  const [securityPaid, setSecurityPaid] = useState(
    initialFound ? initialFound.default_security_amount.toString() : "50000"
  );

  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split("T")[0]);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadUnits() {
      if (initialUnits && initialUnits.length > 0) {
        if (isMounted) setUnitsList(initialUnits);
        return;
      }
      try {
        const units = await getAvailableUnitsAction();
        if (isMounted) setUnitsList(units);
      } catch (err) {
        console.error("Failed to load units", err);
      }
    }
    loadUnits();
    return () => {
      isMounted = false;
    };
  }, [initialUnits]);

  function handleSelectUnitId(id: string) {
    setSelectedUnitId(id);
    const found = unitsList.find((u) => u.id.toString() === id);
    if (found) {
      setSelectedUnit(found);
      setMonthlyRent(found.default_monthly_rent.toString());
      setSecurityAmount(found.default_security_amount.toString());
      setSecurityPaid(found.default_security_amount.toString());
      setRentDueDay(found.default_rent_due_day.toString());
    }
  }

  async function handleSubmit() {
    if (!fullName.trim() || !phone.trim() || !selectedUnitId) {
      alert("Please fill in the tenant name, phone number, and assign a shop.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("full_name", fullName.trim());
      formData.append("phone", phone.trim());
      formData.append("cnic", cnic.trim());
      formData.append("emergency_contact", emergencyContact.trim());
      formData.append("unit_id", selectedUnitId);
      formData.append("monthly_rent", monthlyRent || "0");
      formData.append("rent_due_day", rentDueDay || "5");
      formData.append("security_amount", securityAmount || "0");
      formData.append("security_paid", securityPaid || "0");
      formData.append("start_date", moveInDate);

      const res = await createTenantAction(formData);
      if (res.success) {
        onClose();
      }
    } catch {
      alert("Unexpected error occurred while creating tenant.");
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
              OCCUPANCY ONBOARDING
            </p>
            <h3 className="text-lg font-medium text-[#17211D]">
              Assign Tenant to Space
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] flex items-center justify-center transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* Selected Space Banner */}
        {selectedUnit && (
          <div className="p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC] flex items-center justify-center text-[#FF704D]">
                <Building2 size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#17211D]">{selectedUnit.unit_name}</p>
                <p className="text-[11px] text-[#58655E]">
                  {selectedUnit.floor} · Asking: {formatPKR(selectedUnit.default_monthly_rent)}/mo
                </p>
              </div>
            </div>
            {!initialFound && (
              <button
                type="button"
                onClick={() => setSelectedUnit(null)}
                className="text-[11px] font-medium text-[#FF704D] hover:underline"
              >
                Change
              </button>
            )}
          </div>
        )}

        {/* Step 1: Tenant Information */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            {!selectedUnit && (
              <div>
                <label className="font-semibold text-[#17211D]">Select Available Space</label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => handleSelectUnitId(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D]"
                >
                  <option value="">-- Choose Vacant Space --</option>
                  {unitsList.map((u) => (
                    <option key={u.id} value={u.id.toString()}>
                      {u.unit_name} ({u.floor}) - {formatPKR(u.default_monthly_rent)}/mo
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="font-semibold text-[#17211D]">Tenant Full Name / Business Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Muhammad Ali"
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D]"
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
                  placeholder="0300 1234567"
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[#17211D]">CNIC (13 Digits)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  placeholder="37405-1234567-1"
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D]"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#17211D]">Emergency Family Contact (Optional)</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Name & contact number"
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D]"
              />
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
                onClick={() => {
                  if (!fullName.trim() || !phone.trim()) {
                    alert("Please enter tenant full name and phone number.");
                    return;
                  }
                  if (!selectedUnitId) {
                    alert("Please select a space to rent.");
                    return;
                  }
                  setStep(2);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition"
              >
                <span>Continue to Lease</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Lease & Deposit */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#17211D]">Agreed Monthly Rent (PKR)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#58655E]">Rs.</span>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#17211D]">Rent Due Day (1–28)</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={rentDueDay}
                  onChange={(e) => setRentDueDay(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#17211D]">Total Security Required</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#58655E]">Rs.</span>
                  <input
                    type="number"
                    value={securityAmount}
                    onChange={(e) => setSecurityAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#17211D]">Security Paid Upfront</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#58655E]">Rs.</span>
                  <input
                    type="number"
                    value={securityPaid}
                    onChange={(e) => setSecurityPaid(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#17211D]">Move-in Date</label>
              <input
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="w-full mt-1 px-3.5 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-mono text-[#17211D] focus:border-[#FF704D]"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#CBD4BC]/60">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#58655E] hover:text-[#17211D]"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition disabled:opacity-50"
              >
                <span>{submitting ? "Assigning..." : "Assign Tenant"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
