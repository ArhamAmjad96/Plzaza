"use client";

import { useState, useEffect } from "react";
import { createTenantAction } from "@/app/tenants/actions";
import { getAvailableUnitsAction, getExistingConnectionsAction } from "@/app/units/actions";
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
  Zap,
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

  // Electricity State
  const [electricityOption, setElectricityOption] = useState<"OWN_METER" | "SHARED_METER" | "NO_METER">("OWN_METER");
  const [referenceNumber, setReferenceNumber] = useState(
    (initialFound as any)?.reference_number || ""
  );
  const [meterNumber, setMeterNumber] = useState(
    (initialFound as any)?.meter_number || ""
  );
  const [sharedConnectionId, setSharedConnectionId] = useState<string>("");
  const [splitType, setSplitType] = useState<"EQUAL" | "PERCENTAGE">("EQUAL");
  const [splitValue, setSplitValue] = useState("50");
  const [connectionsList, setConnectionsList] = useState<Array<{ id: number; name: string; reference_number: string }>>([]);

  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split("T")[0]);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        if (!initialUnits || initialUnits.length === 0) {
          const units = await getAvailableUnitsAction();
          if (isMounted) setUnitsList(units);
        } else {
          if (isMounted) setUnitsList(initialUnits);
        }

        const conns = await getExistingConnectionsAction();
        if (isMounted) {
          setConnectionsList(conns);
          if (conns.length > 0) {
            setSharedConnectionId(conns[0].id.toString());
          }
        }
      } catch (err) {
        console.error("Failed to load initial onboarding data", err);
      }
    }
    loadData();
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
      if ((found as any).reference_number) {
        setReferenceNumber((found as any).reference_number);
        setElectricityOption("OWN_METER");
      }
      if ((found as any).meter_number) {
        setMeterNumber((found as any).meter_number);
      }
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

      // Electricity Utility Attachment
      formData.append("electricity_option", electricityOption);
      if (electricityOption === "OWN_METER") {
        formData.append("reference_number", referenceNumber.trim());
        formData.append("meter_number", meterNumber.trim());
      } else if (electricityOption === "SHARED_METER") {
        formData.append("shared_connection_id", sharedConnectionId);
        formData.append("split_type", splitType);
        formData.append("split_value", splitValue);
      }

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 sm:p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl sm:max-w-3xl rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-8 sm:p-10 shadow-2xl space-y-7 max-h-[92vh] overflow-y-auto text-[#17211D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
              OCCUPANCY ONBOARDING
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#17211D] mt-1">
              Assign Tenant to Space
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected Space Banner */}
        {selectedUnit && (
          <div className="p-5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] flex items-center justify-center text-[#FF704D] shadow-xs">
                <Building2 size={22} />
              </div>
              <div>
                <p className="text-base font-bold text-[#17211D]">{selectedUnit.unit_name}</p>
                <p className="text-xs sm:text-sm text-[#58655E] mt-0.5">
                  {selectedUnit.floor} · Asking: {formatPKR(selectedUnit.default_monthly_rent)}/mo
                </p>
              </div>
            </div>
            {!initialFound && (
              <button
                type="button"
                onClick={() => setSelectedUnit(null)}
                className="text-xs font-bold text-[#FF704D] hover:underline px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC] cursor-pointer"
              >
                Change Space
              </button>
            )}
          </div>
        )}

        {/* Step 1: Tenant Information */}
        {step === 1 && (
          <div className="space-y-5 text-sm">
            {!selectedUnit && (
              <div>
                <label className="font-semibold text-sm text-[#17211D]">Select Available Space</label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => handleSelectUnitId(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-base text-[#17211D] focus:border-[#FF704D] shadow-xs cursor-pointer"
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
              <label className="font-semibold text-sm text-[#17211D]">Tenant Full Name / Business Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Kashif Electronics (M. Kashif)"
                className="w-full mt-1.5 px-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-base text-[#17211D] focus:border-[#FF704D] shadow-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-sm text-[#17211D]">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300 1234567"
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-base text-[#17211D] focus:border-[#FF704D] shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-sm text-[#17211D]">CNIC (13 Digits)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  placeholder="37405-1234567-1"
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-base text-[#17211D] focus:border-[#FF704D] shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-sm text-[#17211D]">Emergency Family Contact (Optional)</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Name & emergency contact number"
                className="w-full mt-1.5 px-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-base text-[#17211D] focus:border-[#FF704D] shadow-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[#CBD4BC]/60">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 text-sm font-medium text-[#58655E] hover:text-[#17211D] cursor-pointer"
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
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-sm sm:text-base font-semibold hover:bg-[#24332D] transition shadow-sm cursor-pointer"
              >
                <span>Continue to Lease & Utility</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Lease & Electricity Utility */}
        {step === 2 && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-sm text-[#17211D]">Agreed Monthly Rent (PKR)</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[#58655E]">Rs.</span>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-base font-semibold text-[#17211D] focus:border-[#FF704D] shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-sm text-[#17211D]">Rent Due Day (1–28)</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={rentDueDay}
                  onChange={(e) => setRentDueDay(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-base text-[#17211D] focus:border-[#FF704D] shadow-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-sm text-[#17211D]">Total Security Required (PKR)</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[#58655E]">Rs.</span>
                  <input
                    type="number"
                    value={securityAmount}
                    onChange={(e) => setSecurityAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-base font-semibold text-[#17211D] focus:border-[#FF704D] shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-sm text-[#17211D]">Security Paid Upfront (PKR)</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[#58655E]">Rs.</span>
                  <input
                    type="number"
                    value={securityPaid}
                    onChange={(e) => setSecurityPaid(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-base font-semibold text-[#17211D] focus:border-[#FF704D] shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Electricity Meter Integration Box */}
            <div className="p-5 rounded-3xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] flex items-center justify-center text-[#FF704D] shadow-xs">
                    <Zap size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#17211D]">Electricity Meter / Reference Number</p>
                    <p className="text-xs text-[#58655E]">Connect WAPDA/IESCO meter directly during tenant assignment</p>
                  </div>
                </div>
              </div>

              {/* Meter Mode Selection */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "OWN_METER", label: "Dedicated Meter", icon: Zap },
                  { id: "SHARED_METER", label: "Shared Meter", icon: Users },
                  { id: "NO_METER", label: "Skip / None", icon: X },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setElectricityOption(opt.id as any)}
                    className={`py-2.5 px-3 rounded-xl border text-center transition text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      electricityOption === opt.id
                        ? "border-[#FF704D] bg-[#FFF0EB] text-[#FF704D] shadow-xs font-bold"
                        : "border-[#CBD4BC] bg-[#FAF6F0] text-[#58655E] hover:bg-[#FAF6F0]/80 hover:text-[#17211D]"
                    }`}
                  >
                    <opt.icon size={13} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              {electricityOption === "OWN_METER" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in duration-150">
                  <div>
                    <label className="font-semibold text-xs text-[#17211D]">14-Digit Reference Number</label>
                    <input
                      type="text"
                      maxLength={14}
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. 15142165162900"
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-sm text-[#17211D] placeholder-[#85918A] focus:border-[#FF704D] shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-xs text-[#17211D]">Meter Serial / Sub-meter (Optional)</label>
                    <input
                      type="text"
                      value={meterNumber}
                      onChange={(e) => setMeterNumber(e.target.value)}
                      placeholder="e.g. MTR-4091"
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-sm text-[#17211D] placeholder-[#85918A] focus:border-[#FF704D] shadow-xs"
                    />
                  </div>
                </div>
              )}

              {electricityOption === "SHARED_METER" && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                  <div>
                    <label className="font-semibold text-xs text-[#17211D]">Select Shared Connection</label>
                    <select
                      value={sharedConnectionId}
                      onChange={(e) => setSharedConnectionId(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-sm text-[#17211D] focus:border-[#FF704D] shadow-xs cursor-pointer"
                    >
                      {connectionsList.length === 0 ? (
                        <option value="">No existing connections registered</option>
                      ) : (
                        connectionsList.map((c) => (
                          <option key={c.id} value={c.id.toString()}>
                            {c.name} ({c.reference_number})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-xs text-[#17211D]">Bill Split Type</label>
                      <select
                        value={splitType}
                        onChange={(e) => setSplitType(e.target.value as any)}
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-sm text-[#17211D] focus:border-[#FF704D] shadow-xs cursor-pointer"
                      >
                        <option value="EQUAL">Equal Split</option>
                        <option value="PERCENTAGE">Custom Percentage (%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-xs text-[#17211D]">Split Share (%)</label>
                      <input
                        type="number"
                        value={splitValue}
                        onChange={(e) => setSplitValue(e.target.value)}
                        disabled={splitType === "EQUAL"}
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-sm text-[#17211D] focus:border-[#FF704D] shadow-xs disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="font-semibold text-sm text-[#17211D]">Move-in Date</label>
              <input
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="w-full mt-1.5 px-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-sm sm:text-base font-mono text-[#17211D] focus:border-[#FF704D] shadow-xs cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[#CBD4BC]/60">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#58655E] hover:text-[#17211D] cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-sm sm:text-base font-semibold hover:bg-[#24332D] transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                <span>{submitting ? "Assigning Space..." : "Confirm & Assign Tenant"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
