"use client";

import { useState } from "react";
import { updateUnitAction, connectUnitMeterAction } from "@/app/units/actions";
import { UnitItem } from "@/lib/units/service";
import { X } from "lucide-react";

interface EditUnitModalProps {
  unit: UnitItem;
  availableFloors?: string[];
  initialReferenceNumber?: string;
  initialMeterNumber?: string;
  onClose: () => void;
}

export default function EditUnitModal({
  unit,
  availableFloors = ["Basement", "Ground Floor", "1st Floor", "Residential Flats"],
  initialReferenceNumber = "",
  initialMeterNumber = "",
  onClose,
}: EditUnitModalProps) {
  const [unitType, setUnitType] = useState<"SHOP" | "ROOM" | "OTHER">(unit.unit_type);
  const [floor, setFloor] = useState(unit.floor);
  const [unitNumber, setUnitNumber] = useState(unit.unit_number);
  const [unitName, setUnitName] = useState(unit.unit_name);
  const [defaultRent, setDefaultRent] = useState(unit.default_monthly_rent.toString());
  const [defaultSecurity, setDefaultSecurity] = useState(unit.default_security_amount.toString());
  const [rentDueDay, setRentDueDay] = useState(unit.default_rent_due_day.toString());
  const [status, setStatus] = useState<"OCCUPIED" | "VACANT" | "INACTIVE">(unit.status);
  const [notes, setNotes] = useState(unit.notes || "");

  const [referenceNumber, setReferenceNumber] = useState(initialReferenceNumber);
  const [meterNumber, setMeterNumber] = useState(initialMeterNumber);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("unit_number", unitNumber);
      formData.append("unit_name", unitName);
      formData.append("unit_type", unitType);
      formData.append("floor", floor);
      formData.append("default_monthly_rent", defaultRent);
      formData.append("default_security_amount", defaultSecurity);
      formData.append("default_rent_due_day", rentDueDay);
      formData.append("status", status);
      formData.append("notes", notes);

      await updateUnitAction(unit.id, formData);

      if (referenceNumber.trim()) {
        const meterForm = new FormData();
        meterForm.append("unit_id", unit.id.toString());
        meterForm.append("electricity_option", "OWN_METER");
        meterForm.append("reference_number", referenceNumber.replace(/\s+/g, "").trim());
        meterForm.append("meter_number", meterNumber.trim());
        await connectUnitMeterAction(meterForm);
      }

      onClose();
    } catch {
      alert("Failed to update unit details.");
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
              SPECIFICATIONS
            </p>
            <h3 className="text-lg font-medium text-[#17211D]">
              Edit {unit.unit_name}
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#17211D]">Unit Code</label>
              <input
                type="text"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-[#17211D]">Floor Level</label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D]"
              >
                {availableFloors.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#17211D]">Display Title</label>
            <input
              type="text"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#17211D]">Asking Rent (PKR)</label>
              <input
                type="number"
                value={defaultRent}
                onChange={(e) => setDefaultRent(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#17211D]">Standard Security</label>
              <input
                type="number"
                value={defaultSecurity}
                onChange={(e) => setDefaultSecurity(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
              />
            </div>
          </div>

          {/* IESCO Meter Details */}
          <div className="p-3.5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
              ELECTRICITY METER (IESCO)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#17211D]">14-Digit Reference</label>
                <input
                  type="text"
                  maxLength={14}
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="04141234567890"
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#17211D]">Meter Serial Tag</label>
                <input
                  type="text"
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value)}
                  placeholder="MTR-G01"
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                />
              </div>
            </div>
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
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
