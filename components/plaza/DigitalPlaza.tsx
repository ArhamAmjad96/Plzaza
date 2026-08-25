"use client";

import { useState, useRef, useEffect } from "react";
import { UnitItem } from "@/lib/units/service";
import { Zap, Wrench, Building2, Eye } from "lucide-react";

export interface DigitalPlazaProps {
  floors?: string[];
  units?: UnitItem[];
  activeFloor?: string | null;
  onSelectFloor?: (floor: string) => void;
  onSelectUnit?: (unit: UnitItem) => void;
  separated?: boolean;
  highlightElectricity?: boolean;
  highlightMaintenance?: boolean;
  interactive?: boolean;
  mode?: "3D" | "ELEVATION" | "COMPACT";
  className?: string;
}

export default function DigitalPlaza({
  floors = ["Residential Flats", "1st Floor", "Ground Floor", "Basement"],
  units = [],
  activeFloor,
  onSelectFloor,
  onSelectUnit,
  separated = false,
  highlightElectricity = false,
  highlightMaintenance = false,
  interactive = true,
  mode = "3D",
  className = "",
}: DigitalPlazaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hoveredFloor, setHoveredFloor] = useState<string | null>(null);

  // Group units by floor
  const floorMap = floors.map((floor) => {
    const floorUnits = units.filter(
      (u) => (u.floor || "").toLowerCase() === floor.toLowerCase()
    );
    const occupied = floorUnits.filter((u) => u.status === "OCCUPIED").length;
    const total = floorUnits.length || 4;
    return {
      floor,
      units: floorUnits,
      occupied,
      total,
      hasComplaints: floorUnits.some((u) => (u as any).has_complaint),
    };
  });

  // Mouse perspective movement on desktop
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!interactive || mode !== "3D") return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 12, y: -y * 12 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative select-none transition-transform duration-300 ease-out ${className}`}
      style={{
        perspective: 1200,
      }}
    >
      <div
        className="w-full max-w-xl mx-auto space-y-3 transition-transform duration-500 ease-out"
        style={{
          transform:
            mode === "3D"
              ? `rotateX(${tilt.y + 6}deg) rotateY(${tilt.x - 6}deg) ${
                  separated ? "scale(0.98)" : "scale(1)"
                }`
              : "none",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Architectural Rooftop Structure */}
        <div className="relative mx-auto w-4/5 h-6 rounded-t-2xl bg-[#CBD4BC] border border-[#B8C3A7] flex items-center justify-between px-4 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#8FA66B]" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#58655E]">
              Main Plaza Parapet
            </span>
          </div>
          {highlightElectricity && (
            <div className="flex items-center gap-1 text-[9px] font-mono text-[#FF704D]">
              <Zap size={10} className="animate-pulse" />
              <span>IESCO Inflow</span>
            </div>
          )}
        </div>

        {/* Floor Stacks */}
        <div className={`space-y-${separated ? "6" : "2.5"} transition-all duration-700`}>
          {floorMap.map((item, idx) => {
            const isFocus =
              activeFloor === item.floor || hoveredFloor === item.floor;
            const isMuted =
              (activeFloor && activeFloor !== item.floor) ||
              (hoveredFloor && hoveredFloor !== item.floor);

            return (
              <div
                key={item.floor}
                onClick={() => onSelectFloor && onSelectFloor(item.floor)}
                onMouseEnter={() => setHoveredFloor(item.floor)}
                onMouseLeave={() => setHoveredFloor(null)}
                className={`relative rounded-2xl border transition-all duration-500 cursor-pointer ${
                  isFocus
                    ? "bg-[#FAF6F0] border-[#FF704D] shadow-md -translate-y-1.5 scale-[1.02]"
                    : isMuted
                    ? "bg-[#E8EDD9]/60 border-[#CBD4BC] opacity-60"
                    : "bg-[#E8EDD9] border-[#CBD4BC] hover:border-[#8FA66B] hover:shadow-sm"
                } p-4 sm:p-5`}
                style={{
                  transform: separated
                    ? `translateZ(${idx * 16}px) translateY(${idx * 4}px)`
                    : "none",
                }}
              >
                {/* Floor Header Bar */}
                <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-[#DDE4CF] border border-[#CBD4BC] text-[#17211D]">
                      {item.floor}
                    </span>
                    <span className="text-xs text-[#58655E]">
                      {item.occupied} / {item.total} Occupied
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {highlightElectricity && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#8FA66B]">
                        <Zap size={11} />
                        <span>Meters Synced</span>
                      </span>
                    )}

                    {highlightMaintenance && item.hasComplaints && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#FF704D]">
                        <Wrench size={11} />
                        <span>Open Repair</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Units Bay Architecture Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                  {item.units.length > 0
                    ? item.units.map((u) => {
                        const isVacant = u.status === "VACANT";
                        return (
                          <div
                            key={u.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectUnit) onSelectUnit(u);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isVacant
                                ? "border-[#FF704D]/60 bg-[#FFF0EB] text-[#FF704D] hover:border-[#FF704D]"
                                : "border-[#CBD4BC] bg-[#FAF6F0] text-[#17211D] hover:border-[#8FA66B]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-semibold">
                                {u.unit_number || u.unit_name.split(" ").slice(-1)[0]}
                              </span>
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  isVacant
                                    ? "bg-[#FF704D] animate-pulse"
                                    : "bg-[#8FA66B]"
                                }`}
                              />
                            </div>
                            <p className="text-[10px] truncate mt-1 text-[#58655E]">
                              {isVacant ? "Vacant Space" : "Active Tenant"}
                            </p>
                          </div>
                        );
                      })
                    : Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl border border-[#CBD4BC]/60 bg-[#DDE4CF]/50 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-[#58655E]">
                              #{i + 1}
                            </span>
                            <div className="h-2 w-2 rounded-full bg-[#8FA66B]" />
                          </div>
                          <p className="text-[10px] text-[#58655E] mt-1">Occupied</p>
                        </div>
                      ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Foundation Base */}
        <div className="mx-auto w-5/6 h-4 rounded-b-xl bg-[#CBD4BC] border border-[#B8C3A7]" />
      </div>
    </div>
  );
}
