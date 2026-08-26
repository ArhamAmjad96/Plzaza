"use client";

import { useState } from "react";
import DigitalPlaza from "@/components/plaza/DigitalPlaza";
import GhostedPlazaBackground from "@/components/plaza/GhostedPlazaBackground";
import { UnitItem } from "@/lib/units/service";
import { formatPKR } from "@/lib/utils/format";
import {
  Building2,
  Zap,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface HeroStorytellingProps {
  totalUnits: number;
  occupiedCount: number;
  rentCollected: number;
  rentExpected: number;
  electricityPending: number;
  units: UnitItem[];
  floors: string[];
}

export default function HeroStorytelling({
  totalUnits,
  occupiedCount,
  rentCollected,
  rentExpected,
  electricityPending,
  units,
  floors,
}: HeroStorytellingProps) {
  const [activeStage, setActiveStage] = useState<1 | 2 | 3 | 4>(1);
  const collectionRate =
    rentExpected > 0 ? Math.round((rentCollected / rentExpected) * 100) : 87;

  return (
    <div className="space-y-12">
      {/* ─── Stage 1: The Digital Plaza Hero with Atmospheric 3D Background ─── */}
      <section className="relative overflow-hidden rounded-3xl border border-[#CBD4BC] bg-[#E8EDD9] p-8 sm:p-12 lg:p-16 shadow-sm transition-all duration-700">
        {/* Ghosted 3D Plaza Massing & Atmospheric Grid Background */}
        <GhostedPlazaBackground />

        {/* Foreground Interactive Content */}
        <div className="relative z-10 space-y-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F0]/90 backdrop-blur-xs border border-[#CBD4BC] text-[11px] font-mono font-semibold uppercase tracking-widest text-[#58655E] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF704D]" />
              <span>PLAZA MANAGER · DIGITAL PROPERTY SYSTEM</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-[#17211D] leading-[1.05]">
              Everything <br />
              <span className="text-[#58655E]">Under One Roof.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#58655E] max-w-xl leading-relaxed">
              Manage your rent, tenants, electricity meters and entire property from
              one effortless, architectural workspace.
            </p>

            {/* Interactive Story Sequence Tabs */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {[
                { id: 1, label: "Building Overview", icon: Building2 },
                { id: 2, label: "Floor Stacks", icon: Layers },
                { id: 3, label: "Rent Flow", icon: CheckCircle2 },
                { id: 4, label: "Electricity Grid", icon: Zap },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveStage(tab.id as any)}
                  className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center gap-2.5 shadow-xs ${
                    activeStage === tab.id
                      ? "bg-[#17211D] text-[#F4F7F2] shadow-md scale-105"
                      : "bg-[#FAF6F0]/90 backdrop-blur-xs text-[#58655E] hover:text-[#17211D] hover:bg-[#FAF6F0] border border-[#CBD4BC]"
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* The Interactive Digital Plaza Visual Display */}
          <div className="pt-8 border-t border-[#CBD4BC]/60">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <DigitalPlaza
                  floors={floors}
                  units={units}
                  separated={activeStage === 2}
                  highlightElectricity={activeStage === 4}
                  interactive={true}
                  mode="3D"
                />
              </div>

              {/* Dynamic Interactive Story Callout */}
              <div className="lg:col-span-5 space-y-5">
                {activeStage === 1 && (
                  <div className="p-6 rounded-2xl bg-[#FAF6F0]/95 backdrop-blur-xs border border-[#CBD4BC] space-y-3 fade-in shadow-xs">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#58655E]">
                      SPATIAL OVERVIEW
                    </span>
                    <h3 className="text-xl font-medium text-[#17211D]">
                      {occupiedCount} of {totalUnits} Spaces Occupied
                    </h3>
                    <p className="text-xs text-[#58655E] leading-relaxed">
                      Hover and move your cursor over the building model to inspect
                      perspective angles and verify real-time occupancy.
                    </p>
                  </div>
                )}

                {activeStage === 2 && (
                  <div className="p-6 rounded-2xl bg-[#FAF6F0]/95 backdrop-blur-xs border border-[#FF704D]/60 space-y-3 fade-in shadow-xs">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF704D]">
                      FLOOR ELEVATIONS
                    </span>
                    <h3 className="text-xl font-medium text-[#17211D]">
                      Every Floor. Every Unit. Always Visible.
                    </h3>
                    <p className="text-xs text-[#58655E] leading-relaxed">
                      Click any floor stack to drill directly into its individual
                      shops, asking rents, and active lease statuses.
                    </p>
                  </div>
                )}

                {activeStage === 3 && (
                  <div className="p-6 rounded-2xl bg-[#E7D4BE] border border-[#D9C4AC] space-y-3 fade-in text-[#17211D] shadow-xs">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#7D6F5D]">
                      FINANCIAL RECOVERY
                    </span>
                    <h3 className="text-3xl font-mono font-bold text-[#17211D]">
                      {formatPKR(rentCollected)}
                    </h3>
                    <p className="text-xs text-[#7D6F5D]">
                      {collectionRate}% collected this month · {formatPKR(rentExpected - rentCollected)} pending.
                    </p>
                  </div>
                )}

                {activeStage === 4 && (
                  <div className="p-6 rounded-2xl bg-[#1B2521] border border-[#32433B] space-y-3 fade-in text-[#F4F7F2] shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#8FA66B]">
                        UTILITY GRID
                      </span>
                      <Zap size={14} className="text-[#FF704D]" />
                    </div>
                    <h3 className="text-xl font-medium text-[#F4F7F2]">
                      Electricity. Automatically Managed.
                    </h3>
                    <p className="text-xs text-[#85918A] leading-relaxed">
                      IESCO reference meters sync monthly bills automatically with
                      shared split formulas across flat rooms.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
