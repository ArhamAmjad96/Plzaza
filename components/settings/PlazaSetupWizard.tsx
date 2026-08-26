"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { savePlazaDetailsAction, bulkConfigurePlazaAction } from "@/app/units/actions";
import { formatPKR } from "@/lib/utils/format";
import DigitalPlaza from "@/components/plaza/DigitalPlaza";
import {
  Building2,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Plus,
  Minus,
} from "lucide-react";

interface PlazaSetupWizardProps {
  initialName?: string;
  initialAddress?: string;
  initialFloors?: string[];
  onClose?: () => void;
  onSuccess?: () => void;
}

const AVAILABLE_FLOOR_OPTIONS = [
  "Basement",
  "Lower Ground",
  "Ground Floor",
  "1st Floor",
  "2nd Floor",
  "3rd Floor",
  "Residential Flats",
  "Rooftop Commercial",
];

export default function PlazaSetupWizard({
  initialName = "",
  initialAddress = "",
  initialFloors = [],
  onClose,
  onSuccess,
}: PlazaSetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Plaza Info
  const [plazaName, setPlazaName] = useState(initialName);
  const [location, setLocation] = useState(initialAddress);
  const [selectedFloors, setSelectedFloors] = useState<string[]>(initialFloors);

  // Step 2: Floor Configurations
  const [floorConfigs, setFloorConfigs] = useState<
    Record<string, { count: number; rent: number; security: number }>
  >(() => {
    const initial: Record<string, { count: number; rent: number; security: number }> = {};
    initialFloors.forEach((f) => {
      if (f.toLowerCase().includes("basement")) {
        initial[f] = { count: 5, rent: 20000, security: 40000 };
      } else if (f.toLowerCase().includes("ground")) {
        initial[f] = { count: 8, rent: 35000, security: 70000 };
      } else if (f.toLowerCase().includes("1st") || f.toLowerCase().includes("first")) {
        initial[f] = { count: 6, rent: 25000, security: 50000 };
      } else if (f.toLowerCase().includes("flat") || f.toLowerCase().includes("residential")) {
        initial[f] = { count: 4, rent: 18000, security: 36000 };
      } else {
        initial[f] = { count: 4, rent: 20000, security: 40000 };
      }
    });
    return initial;
  });

  const [submitting, setSubmitting] = useState(false);

  function toggleFloor(f: string) {
    if (selectedFloors.includes(f)) {
      setSelectedFloors(selectedFloors.filter((item) => item !== f));
    } else {
      setSelectedFloors([...selectedFloors, f]);
      if (!floorConfigs[f]) {
        setFloorConfigs({
          ...floorConfigs,
          [f]: { count: 4, rent: 25000, security: 50000 },
        });
      }
    }
  }

  function updateFloorConfig(
    floor: string,
    field: "count" | "rent" | "security",
    value: number
  ) {
    setFloorConfigs({
      ...floorConfigs,
      [floor]: {
        ...(floorConfigs[floor] || { count: 4, rent: 25000, security: 50000 }),
        [field]: value,
      },
    });
  }

  const totalCalculatedUnits = selectedFloors.reduce((sum, f) => {
    return sum + (floorConfigs[f]?.count || 4);
  }, 0);

  async function handleBuildPlaza() {
    if (selectedFloors.length === 0) {
      alert("Please select at least one building floor.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save plaza name & floors
      const plazaFd = new FormData();
      plazaFd.append("name", plazaName);
      plazaFd.append("address", location);
      plazaFd.append("floors", JSON.stringify(selectedFloors));
      await savePlazaDetailsAction(plazaFd);

      // 2. Build units list
      const generatedUnits: any[] = [];
      let unitCounter = 1;

      selectedFloors.forEach((floor) => {
        const cfg = floorConfigs[floor] || { count: 4, rent: 25000, security: 50000 };
        let prefix = "G";
        let uType: "SHOP" | "ROOM" = "SHOP";

        if (floor.toLowerCase().includes("basement")) prefix = "B";
        else if (floor.toLowerCase().includes("lower ground")) prefix = "LG";
        else if (floor.toLowerCase().includes("ground")) prefix = "G";
        else if (floor.toLowerCase().includes("1st") || floor.toLowerCase().includes("first")) prefix = "F1";
        else if (floor.toLowerCase().includes("2nd") || floor.toLowerCase().includes("second")) prefix = "F2";
        else if (floor.toLowerCase().includes("3rd") || floor.toLowerCase().includes("third")) prefix = "F3";
        else if (floor.toLowerCase().includes("flat") || floor.toLowerCase().includes("room")) {
          prefix = "R";
          uType = "ROOM";
        }

        for (let i = 1; i <= cfg.count; i++) {
          const numStr = i.toString().padStart(2, "0");
          const unitNumber = `${prefix}-${numStr}`;
          const typeLabel = uType === "ROOM" ? "Room" : "Shop";
          generatedUnits.push({
            id: unitCounter++,
            plaza_id: 1,
            unit_number: unitNumber,
            unit_name: `${floor} ${typeLabel} ${unitNumber}`,
            unit_type: uType,
            floor,
            default_monthly_rent: cfg.rent,
            default_security_amount: cfg.security,
            default_rent_due_day: 5,
            status: "VACANT",
          });
        }
      });

      const configFd = new FormData();
      configFd.append("units_json", JSON.stringify(generatedUnits));
      configFd.append("replace_existing", "true");

      const res = await bulkConfigurePlazaAction(configFd);

      if (res.success) {
        router.refresh();
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }
    } catch {
      alert("Unexpected error occurred while generating plaza.");
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
        className="w-full max-w-3xl lg:max-w-4xl rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-8 sm:p-10 shadow-2xl space-y-7 max-h-[92vh] overflow-y-auto text-[#17211D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
              PLAZA ARCHITECTURE BUILDER · STEP {step} OF 3
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#17211D] mt-1">
              {step === 1 && "Building Identity & Floors"}
              {step === 2 && "Floor Units & Standard Pricing"}
              {step === 3 && "Review & Build Property"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Name & Floor Selection */}
        {step === 1 && (
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-sm text-[#17211D]">Plaza Name</label>
                <input
                  type="text"
                  value={plazaName}
                  placeholder="e.g. Al-Rehman Commercial Center"
                  onChange={(e) => setPlazaName(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-base focus:border-[#FF704D] shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-sm text-[#17211D]">Address / City</label>
                <input
                  type="text"
                  value={location}
                  placeholder="e.g. Blue Area, Islamabad"
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-base focus:border-[#FF704D] shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-sm text-[#17211D] block mb-2.5">
                Select Active Building Levels ({selectedFloors.length} Selected)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AVAILABLE_FLOOR_OPTIONS.map((f) => {
                  const isSelected = selectedFloors.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleFloor(f)}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left transition flex items-center justify-between text-sm sm:text-base font-semibold ${
                        isSelected
                          ? "border-[#FF704D] bg-[#FFF0EB] text-[#FF704D] shadow-xs"
                          : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E] hover:bg-[#DDE4CF]"
                      }`}
                    >
                      <span className="truncate">{f}</span>
                      {isSelected && <Check size={16} className="shrink-0 text-[#FF704D]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[#CBD4BC]/60">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 text-sm font-medium text-[#58655E] hover:text-[#17211D]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedFloors.length === 0) {
                    alert("Please select at least one building floor.");
                    return;
                  }
                  setStep(2);
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-sm sm:text-base font-semibold hover:bg-[#24332D] transition shadow-sm"
              >
                <span>Continue to Unit Counts</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Floor Counts & Pricing */}
        {step === 2 && (
          <div className="space-y-5 text-sm max-h-[55vh] overflow-y-auto pr-1">
            {selectedFloors.map((floor) => {
              const cfg = floorConfigs[floor] || { count: 4, rent: 25000, security: 50000 };
              return (
                <div
                  key={floor}
                  className="p-5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm sm:text-base font-bold uppercase text-[#17211D]">
                      {floor}
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[#58655E]">Shops / Rooms:</span>
                      <div className="flex items-center gap-2 bg-[#FAF6F0] rounded-xl border border-[#CBD4BC] px-3 py-1 font-mono">
                        <button
                          type="button"
                          onClick={() =>
                            updateFloorConfig(floor, "count", Math.max(1, cfg.count - 1))
                          }
                          className="text-[#58655E] hover:text-[#17211D] p-0.5"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold text-[#17211D] w-6 text-center text-sm">
                          {cfg.count}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateFloorConfig(floor, "count", cfg.count + 1)
                          }
                          className="text-[#58655E] hover:text-[#17211D] p-0.5"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-xs text-[#58655E] uppercase tracking-wider block mb-1">
                        Standard Monthly Rent (PKR)
                      </label>
                      <input
                        type="number"
                        value={cfg.rent}
                        onChange={(e) =>
                          updateFloorConfig(floor, "rent", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-sm sm:text-base font-semibold focus:border-[#FF704D]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-xs text-[#58655E] uppercase tracking-wider block mb-1">
                        Standard Security Advance (PKR)
                      </label>
                      <input
                        type="number"
                        value={cfg.security}
                        onChange={(e) =>
                          updateFloorConfig(floor, "security", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-sm sm:text-base font-semibold focus:border-[#FF704D]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-5 border-t border-[#CBD4BC]/60">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#58655E] hover:text-[#17211D]"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-sm sm:text-base font-semibold hover:bg-[#24332D] transition shadow-sm"
              >
                <span>Review Building Model</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Build */}
        {step === 3 && (
          <div className="space-y-6 text-sm">
            <div className="p-6 rounded-3xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-3">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#58655E] block">Plaza Name</span>
                  <span className="text-lg sm:text-xl font-bold text-[#17211D]">{plazaName}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#58655E] block">Total Units</span>
                  <span className="font-mono text-lg sm:text-xl font-bold text-[#FF704D]">{totalCalculatedUnits} Spaces</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-mono text-xs sm:text-sm">
                {selectedFloors.map((floor) => {
                  const cfg = floorConfigs[floor] || { count: 4, rent: 25000, security: 50000 };
                  return (
                    <div key={floor} className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC]">
                      <span className="font-sans font-bold text-sm text-[#17211D] block">{floor}</span>
                      <span className="text-[#58655E] font-medium">{cfg.count} Spaces · {formatPKR(cfg.rent)}/mo</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-[#CBD4BC]/60">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#58655E] hover:text-[#17211D]"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleBuildPlaza}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-sm sm:text-base font-semibold hover:bg-[#24332D] transition shadow-md disabled:opacity-50"
              >
                <span>{submitting ? "Building Model..." : "Build Plaza Structure"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
