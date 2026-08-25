"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { connectUnitMeterAction, getExistingConnectionsAction } from "@/app/units/actions";
import { UnitItem } from "@/lib/units/service";
import { Zap, X, Building2 } from "lucide-react";

interface ConnectMeterModalProps {
  unit: UnitItem;
  onClose: () => void;
}

type ElectricityOption = "OWN_METER" | "SHARED_METER" | "NONE";

export default function ConnectMeterModal({ unit, onClose }: ConnectMeterModalProps) {
  const router = useRouter();
  const [electricityOption, setElectricityOption] = useState<ElectricityOption>("OWN_METER");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [sharedConnectionId, setSharedConnectionId] = useState<string>("");
  const [splitType, setSplitType] = useState<"EQUAL" | "PERCENTAGE">("EQUAL");
  const [splitValue, setSplitValue] = useState("50");
  const [connectionsList, setConnectionsList] = useState<Array<{ id: number; name: string; reference_number: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getExistingConnectionsAction().then((conns) => {
      setConnectionsList(conns);
      if (conns.length > 0) {
        setSharedConnectionId(conns[0].id.toString());
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (electricityOption === "OWN_METER" && !referenceNumber.trim()) {
      alert("Please enter the 14-digit IESCO reference number.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("unit_id", unit.id.toString());
      formData.append("electricity_option", electricityOption);

      if (electricityOption === "OWN_METER") {
        formData.append("reference_number", referenceNumber.replace(/\s+/g, "").trim());
        formData.append("meter_number", meterNumber.trim());
      } else if (electricityOption === "SHARED_METER") {
        formData.append("shared_connection_id", sharedConnectionId);
        formData.append("split_type", splitType);
        formData.append("split_value", splitValue);
      }

      const res = await connectUnitMeterAction(formData);

      if (res.success) {
        router.refresh();
        onClose();
      }
    } catch {
      alert("Failed to connect meter.");
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
              UTILITY ATTACHMENT
            </p>
            <h3 className="text-lg font-medium text-[#17211D]">
              Connect IESCO Meter
            </h3>
            <p className="text-xs text-[#58655E] mt-0.5">
              {unit.unit_name} · {unit.floor}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] flex items-center justify-center transition"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Options */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "OWN_METER", label: "Dedicated Meter" },
              { id: "SHARED_METER", label: "Shared Sub-Meter" },
              { id: "NONE", label: "No Electricity" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setElectricityOption(opt.id as ElectricityOption)}
                className={`p-3 rounded-xl border text-center transition font-medium ${
                  electricityOption === opt.id
                    ? "border-[#FF704D] bg-[#FFF0EB] text-[#FF704D]"
                    : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E] hover:bg-[#DDE4CF]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {electricityOption === "OWN_METER" && (
            <div className="space-y-3 p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC]">
              <div>
                <label className="font-semibold text-[#17211D]">14-Digit Reference Number</label>
                <input
                  type="text"
                  maxLength={14}
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="04141234567890"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[#17211D]">Meter Serial Tag (Optional)</label>
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

          {electricityOption === "SHARED_METER" && (
            <div className="space-y-3 p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC]">
              <div>
                <label className="font-semibold text-[#17211D]">Select Master Shared Meter</label>
                <select
                  value={sharedConnectionId}
                  onChange={(e) => setSharedConnectionId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D]"
                >
                  {connectionsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.reference_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSplitType("EQUAL")}
                  className={`p-2 rounded-lg border text-center ${
                    splitType === "EQUAL" ? "border-[#FF704D] bg-[#FFF0EB] text-[#FF704D] font-semibold" : "border-[#CBD4BC] bg-[#FAF6F0]"
                  }`}
                >
                  Equal Split
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType("PERCENTAGE")}
                  className={`p-2 rounded-lg border text-center ${
                    splitType === "PERCENTAGE" ? "border-[#FF704D] bg-[#FFF0EB] text-[#FF704D] font-semibold" : "border-[#CBD4BC] bg-[#FAF6F0]"
                  }`}
                >
                  Custom %
                </button>
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
              {submitting ? "Connecting..." : "Save Meter Attachment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
