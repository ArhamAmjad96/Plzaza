"use client";

import { useState } from "react";
import { UnitItem } from "@/lib/units/service";
import { ConnectionViewItem, calculateBillAllocation } from "@/lib/electricity/service";
import { updateConnectionMappingsAction } from "@/app/connections/mapping-actions";
import { formatPKR } from "@/lib/utils/format";
import { Zap, X, Check, Layers } from "lucide-react";

interface ConnectionUnitMappingModalProps {
  connection: ConnectionViewItem;
  allUnits: UnitItem[];
  onClose: () => void;
}

export default function ConnectionUnitMappingModal({
  connection,
  allUnits,
  onClose,
}: ConnectionUnitMappingModalProps) {
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(
    connection.mappings.map((m) => m.unit_id.toString())
  );
  const [splitType, setSplitType] = useState<"EQUAL" | "PERCENTAGE">("EQUAL");
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    connection.mappings.forEach((m) => {
      map[m.unit_id.toString()] = m.split_value || 100;
    });
    return map;
  });

  const [testBillAmount, setTestBillAmount] = useState<number>(10000);
  const [submitting, setSubmitting] = useState(false);

  function toggleUnitSelection(unitIdStr: string) {
    if (selectedUnitIds.includes(unitIdStr)) {
      setSelectedUnitIds(selectedUnitIds.filter((id) => id !== unitIdStr));
    } else {
      setSelectedUnitIds([...selectedUnitIds, unitIdStr]);
    }
  }

  const currentMappings = selectedUnitIds.map((id) => {
    const u = allUnits.find((unit) => unit.id.toString() === id);
    const count = selectedUnitIds.length;
    const splitVal =
      splitType === "EQUAL"
        ? Math.round(100 / (count || 1))
        : customPercentages[id] || Math.round(100 / (count || 1));

    return {
      id: `${connection.id}-${id}`,
      connection_id: connection.id,
      unit_id: id,
      unit_name: u?.unit_name || `Unit #${id}`,
      unit_number: u?.unit_number || "",
      split_type: splitType,
      split_value: splitVal,
      unit: u,
    };
  });

  const allocations = calculateBillAllocation(testBillAmount, currentMappings);

  async function handleSave() {
    if (selectedUnitIds.length === 0) {
      alert("Please attach at least one unit to this shared meter.");
      return;
    }

    setSubmitting(true);
    try {
      const mappingsPayload = selectedUnitIds.map((uId) => ({
        unit_id: parseInt(uId, 10),
        split_type: splitType,
        split_value:
          splitType === "EQUAL"
            ? Math.round(100 / selectedUnitIds.length)
            : customPercentages[uId] || Math.round(100 / selectedUnitIds.length),
      }));

      await updateConnectionMappingsAction(connection.id, mappingsPayload);
      onClose();
    } catch {
      alert("Failed to save shared meter split.");
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
              SHARED METER ALLOCATION
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#17211D] mt-1">
              {connection.name}
            </h3>
            <p className="text-sm text-[#58655E] mt-1 font-mono">
              IESCO Ref: <strong>{connection.reference_number}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Space Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-[#17211D] block">
            Select Connected Spaces ({selectedUnitIds.length} Attached)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
            {allUnits.map((u) => {
              const isSelected = selectedUnitIds.includes(u.id.toString());
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUnitSelection(u.id.toString())}
                  className={`p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition flex items-center justify-between ${
                    isSelected
                      ? "border-[#FF704D] bg-[#FFF0EB] text-[#FF704D] shadow-xs"
                      : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E] hover:bg-[#DDE4CF]"
                  }`}
                >
                  <span className="truncate">{u.unit_name}</span>
                  {isSelected && <Check size={16} className="shrink-0 text-[#FF704D]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Split Formula Mode */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-[#17211D] block">
            Split Distribution Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setSplitType("EQUAL")}
              className={`p-4 rounded-2xl border text-center text-sm font-semibold transition ${
                splitType === "EQUAL"
                  ? "border-[#17211D] bg-[#17211D] text-[#F4F7F2] shadow-sm"
                  : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E] hover:bg-[#DDE4CF]"
              }`}
            >
              Equal Split ({Math.round(100 / (selectedUnitIds.length || 1))}% each)
            </button>
            <button
              type="button"
              onClick={() => setSplitType("PERCENTAGE")}
              className={`p-4 rounded-2xl border text-center text-sm font-semibold transition ${
                splitType === "PERCENTAGE"
                  ? "border-[#17211D] bg-[#17211D] text-[#F4F7F2] shadow-sm"
                  : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E] hover:bg-[#DDE4CF]"
              }`}
            >
              Custom % Split
            </button>
          </div>
        </div>

        {/* Live Allocation Preview */}
        <div className="p-6 rounded-3xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between text-sm font-bold text-[#17211D]">
            <span>Live Calculation Preview (Sample Bill)</span>
            <span className="font-mono text-[#58655E]">Rs. 10,000</span>
          </div>

          <div className="space-y-2 pt-1">
            {allocations.map((a) => (
              <div key={a.unit_id} className="flex items-center justify-between font-mono text-sm">
                <span className="text-[#17211D] font-sans font-medium">{a.unit_name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-[#58655E] text-xs">{a.share_percentage}%</span>
                  <span className="font-bold text-[#17211D]">{formatPKR(a.allocated_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-[#CBD4BC]/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 text-sm font-medium text-[#58655E] hover:text-[#17211D]"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSave}
            disabled={submitting}
            className="px-8 py-3.5 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-sm sm:text-base font-semibold hover:bg-[#24332D] transition shadow-md disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Split Formula"}
          </button>
        </div>
      </div>
    </div>
  );
}
