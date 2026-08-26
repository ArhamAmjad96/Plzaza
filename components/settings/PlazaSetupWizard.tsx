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
  initialName = "Main Commercial Plaza",
  initialAddress = "Islamabad, Pakistan",
  initialFloors = ["Basement", "Ground Floor", "1st Floor", "Residential Flats"],
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-7 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto text-[#17211D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
              PLAZA ARCHITECTURE BUILDER · STEP {step} OF 3
            </p>
            <h3 className="text-lg font-medium text-[#17211D]">
              {step === 1 && "Building Identity & Floors"}
              {step === 2 && "Floor Units & Standard Pricing"}
              {step === 3 && "Review & Build Property"}
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

        {/* Step 1: Name & Floor Selection */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#17211D]">Plaza Name</label>
                <input
                  type="text"
                  value={plazaName}
                  onChange={(e) => setPlazaName(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[#17211D]">Address / City</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D]"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#17211D] block mb-2">
                Select Active Building Levels ({selectedFloors.length} Selected)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AVAILABLE_FLOOR_OPTIONS.map((f) => {
                  const isSelected = selectedFloors.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleFloor(f)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs ${
                        isSelected
                          ? "border-[#FF704D] bg-[#FFF0EB] text-[#FF704D] font-semibold"
                          : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E] hover:bg-[#DDE4CF]"
                      }`}
                    >
                      <span className="truncate">{f}</span>
                      {isSelected && <Check size={13} className="shrink-0" />}
                    </button>
                  );
                })}
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
                type="button"
                onClick={() => {
                  if (selectedFloors.length === 0) {
                    alert("Please select at least one building floor.");
                    return;
                  }
                  setStep(2);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition"
              >
                <span>Continue to Unit Counts</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Floor Counts & Pricing */}
        {step === 2 && (
          <div className="space-y-4 text-xs max-h-96 overflow-y-auto pr-1">
            {selectedFloors.map((floor) => {
              const cfg = floorConfigs[floor] || { count: 4, rent: 25000, security: 50000 };
              return (
                <div
                  key={floor}
                  className="p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase text-[#17211D]">
                      {floor}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#58655E]">Shops / Rooms:</span>
                      <div className="flex items-center gap-1.5 bg-[#FAF6F0] rounded-lg border border-[#CBD4BC] px-2 py-0.5 font-mono">
                        <button
                          type="button"
                          onClick={() =>
                            updateFloorConfig(floor, "count", Math.max(1, cfg.count - 1))
                          }
                          className="text-[#58655E] hover:text-[#17211D]"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="font-bold text-[#17211D] w-4 text-center">
                          {cfg.count}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateFloorConfig(floor, "count", cfg.count + 1)
                          }
                          className="text-[#58655E] hover:text-[#17211D]"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-[#58655E]">Standard Monthly Rent (PKR)</label>
                      <input
                        type="number"
                        value={cfg.rent}
                        onChange={(e) =>
                          updateFloorConfig(floor, "rent", parseFloat(e.target.value) || 0)
                        }
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#58655E]">Standard Security Advance</label>
                      <input
                        type="number"
                        value={cfg.security}
                        onChange={(e) =>
                          updateFloorConfig(floor, "security", parseFloat(e.target.value) || 0)
                        }
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

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
                <span>Review Building Model</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Build */}
        {step === 3 && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-2">
              <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-2">
                <span className="font-semibold text-[#17211D]">{plazaName}</span>
                <span className="font-mono font-bold text-[#FF704D]">{totalCalculatedUnits} Total Spaces</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                {selectedFloors.map((floor) => {
                  const cfg = floorConfigs[floor] || { count: 4, rent: 25000, security: 50000 };
                  return (
                    <div key={floor} className="p-2 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC]">
                      <span className="font-sans font-semibold text-[#17211D] block">{floor}</span>
                      <span className="text-[#58655E]">{cfg.count} Spaces · {formatPKR(cfg.rent)}/mo</span>
                    </div>
                  );
                })}
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
                onClick={handleBuildPlaza}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition disabled:opacity-50"
              >
                <span>{submitting ? "Building Model..." : "Build My Plaza"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
