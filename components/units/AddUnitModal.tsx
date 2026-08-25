"use client";

import { useState, useEffect } from "react";
import { createUnitAction, getExistingConnectionsAction } from "@/app/units/actions";
import { getUnitPricingDefaults, UnitItem } from "@/lib/units/service";
import { formatPKR } from "@/lib/utils/format";
import {
  Building2,
  Home,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Plus,
} from "lucide-react";

interface AddUnitModalProps {
  availableFloors?: string[];
  onClose: () => void;
  onOpenAddTenant?: (unit: UnitItem) => void;
}

type ElectricityChoice = "OWN_METER" | "SHARED_METER" | "NO_METER";

export default function AddUnitModal({
  availableFloors = ["Basement", "Ground Floor", "1st Floor", "Residential Flats"],
  onClose,
  onOpenAddTenant,
}: AddUnitModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Type
  const [unitType, setUnitType] = useState<"SHOP" | "ROOM">("SHOP");

  // Step 2: Basic Details
  const [unitNumber, setUnitNumber] = useState("G-01");
  const [unitName, setUnitName] = useState("Ground Shop G-01");
  const [floor, setFloor] = useState(availableFloors[1] || "Ground Floor");

  // Step 3: Rent & Security
  const [defaultRent, setDefaultRent] = useState("30000");
  const [defaultSecurity, setDefaultSecurity] = useState("50000");
  const [rentDueDay, setRentDueDay] = useState("5");

  // Step 4: Electricity Details
  const [electricityOption, setElectricityOption] = useState<ElectricityChoice>("OWN_METER");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [sharedConnectionId, setSharedConnectionId] = useState<string>("");
  const [splitType, setSplitType] = useState<"EQUAL" | "PERCENTAGE">("EQUAL");
  const [splitValue, setSplitValue] = useState("50");

  const [connectionsList, setConnectionsList] = useState<Array<{ id: number; name: string; reference_number: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createdUnit, setCreatedUnit] = useState<UnitItem | null>(null);

  useEffect(() => {
    getExistingConnectionsAction().then((conns) => {
      setConnectionsList(conns);
      if (conns.length > 0) {
        setSharedConnectionId(conns[0].id.toString());
      }
    });
  }, []);

  function handleTypeSelect(type: "SHOP" | "ROOM") {
    setUnitType(type);
    const defaults = getUnitPricingDefaults(type, floor);
    setDefaultRent(defaults.suggestedRent.toString());
    setDefaultSecurity(defaults.suggestedSecurity.toString());
    if (type === "ROOM") {
      setUnitNumber("R-01");
      setUnitName("Flat Room R-01");
      setElectricityOption("SHARED_METER");
    } else {
      setUnitNumber("G-01");
      setUnitName("Ground Shop G-01");
      setElectricityOption("OWN_METER");
    }
    setStep(2);
  }

  async function handleCreateUnit() {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("unit_type", unitType);
      fd.append("unit_number", unitNumber.trim());
      fd.append("unit_name", unitName.trim() || `${unitType} ${unitNumber}`);
      fd.append("floor", floor);
      fd.append("default_monthly_rent", defaultRent || "0");
      fd.append("default_security_amount", defaultSecurity || "0");
      fd.append("default_rent_due_day", rentDueDay || "5");

      if (electricityOption === "OWN_METER") {
        fd.append("electricity_mode", "OWN_METER");
        fd.append("reference_number", referenceNumber.trim());
        fd.append("meter_number", meterNumber.trim());
      } else if (electricityOption === "SHARED_METER") {
        fd.append("electricity_mode", "SHARED_METER");
        fd.append("shared_connection_id", sharedConnectionId);
        fd.append("split_type", splitType);
        fd.append("split_value", splitValue);
      } else {
        fd.append("electricity_mode", "NONE");
      }

      const res = await createUnitAction(fd);
      if (res.success && res.unit) {
        setCreatedUnit(res.unit);
        setStep(5);
      }
    } catch {
      alert("Unexpected error occurred while saving the unit.");
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
        className="w-full max-w-lg rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-7 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto text-[#17211D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
              UNIT ARCHITECTURE BUILDER · STEP {step} OF 4
            </p>
            <h3 className="text-lg font-medium text-[#17211D]">
              {step === 1 && "Select Space Type"}
              {step === 2 && "Shop Code & Location"}
              {step === 3 && "Pricing & Terms"}
              {step === 4 && "Electricity Meter Setup"}
              {step === 5 && "Space Created"}
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

        {/* Step 1: Choose Type */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-[#58655E]">
              Select whether this new space is a commercial storefront shop or a residential flat room.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeSelect("SHOP")}
                className="p-5 rounded-2xl border border-[#CBD4BC] bg-[#E8EDD9] hover:border-[#FF704D] text-left transition space-y-2 group"
              >
                <div className="h-9 w-9 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC] flex items-center justify-center text-[#FF704D]">
                  <Building2 size={18} />
                </div>
                <h4 className="font-semibold text-sm text-[#17211D]">Commercial Shop</h4>
                <p className="text-[11px] text-[#58655E]">
                  Ground floor retail, basement store, office space
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect("ROOM")}
                className="p-5 rounded-2xl border border-[#CBD4BC] bg-[#E8EDD9] hover:border-[#FF704D] text-left transition space-y-2 group"
              >
                <div className="h-9 w-9 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC] flex items-center justify-center text-[#8FA66B]">
                  <Home size={18} />
                </div>
                <h4 className="font-semibold text-sm text-[#17211D]">Residential Room</h4>
                <p className="text-[11px] text-[#58655E]">
                  Upper flat room, staff hostel, bachelor accommodation
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Identification & Floor */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#17211D]">Shop / Room Code</label>
              <input
                type="text"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="e.g. G-01, B-04, R-02"
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#17211D]">Display Title</label>
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="e.g. Ground Shop G-01"
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#17211D]">Building Floor Level</label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D]"
              >
                {availableFloors.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
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
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition"
              >
                <span>Continue to Pricing</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Rent & Deposit */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#17211D]">Asking Monthly Rent (PKR)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#58655E]">Rs.</span>
                  <input
                    type="number"
                    value={defaultRent}
                    onChange={(e) => setDefaultRent(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#17211D]">Security Advance</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#58655E]">Rs.</span>
                  <input
                    type="number"
                    value={defaultSecurity}
                    onChange={(e) => setDefaultSecurity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#CBD4BC]/60">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#58655E] hover:text-[#17211D]"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition"
              >
                <span>Continue to Meter</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Electricity */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "OWN_METER", label: "Dedicated Meter" },
                { id: "SHARED_METER", label: "Shared Sub-Meter" },
                { id: "NO_METER", label: "No Electricity" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setElectricityOption(opt.id as ElectricityChoice)}
                  className={`p-2.5 rounded-xl border text-center transition text-xs font-medium ${
                    electricityOption === opt.id
                      ? "border-[#FF704D] bg-[#FFF0EB] text-[#FF704D]"
                      : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {electricityOption === "OWN_METER" && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC]">
                <div>
                  <label className="font-semibold text-[#17211D]">14-Digit IESCO Reference Number</label>
                  <input
                    type="text"
                    maxLength={14}
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="04141234567890"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#17211D]">Meter Serial / Tag (Optional)</label>
                  <input
                    type="text"
                    value={meterNumber}
                    onChange={(e) => setMeterNumber(e.target.value)}
                    placeholder="e.g. MTR-G01"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#CBD4BC]/60">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#58655E] hover:text-[#17211D]"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleCreateUnit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition disabled:opacity-50"
              >
                <span>{submitting ? "Saving..." : "Create Space"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Created Confirmation */}
        {step === 5 && createdUnit && (
          <div className="text-center space-y-4 py-4">
            <div className="h-12 w-12 rounded-full bg-[#E3EFE8] border border-[#BCD8C7] text-[#2D5A43] mx-auto flex items-center justify-center">
              <Check size={24} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-[#17211D]">
                {createdUnit.unit_name} Created
              </h4>
              <p className="text-xs text-[#58655E] mt-0.5">
                Asking Rent: {formatPKR(createdUnit.default_monthly_rent)}/month · {createdUnit.floor}
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-medium text-[#17211D] hover:bg-[#E8EDD9]"
              >
                Done
              </button>
              {onOpenAddTenant && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddTenant(createdUnit);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D]"
                >
                  Assign Tenant Now
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
