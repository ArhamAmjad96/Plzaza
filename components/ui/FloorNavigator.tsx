"use client";

import { Building2, Layers } from "lucide-react";

interface FloorNavigatorProps {
  floors: string[];
  activeFloor: string | "ALL";
  onSelectFloor: (floor: string | "ALL") => void;
  unitCountsByFloor?: Record<string, { total: number; occupied: number }>;
}

export default function FloorNavigator({
  floors,
  activeFloor,
  onSelectFloor,
  unitCountsByFloor = {},
}: FloorNavigatorProps) {
  function getFloorShortCode(floorName: string) {
    const l = floorName.toLowerCase();
    if (l.includes("residential") || l.includes("flat")) return "RF";
    if (l.includes("3rd") || l.includes("third")) return "3F";
    if (l.includes("2nd") || l.includes("second")) return "2F";
    if (l.includes("1st") || l.includes("first")) return "1F";
    if (l.includes("ground")) return "GF";
    if (l.includes("lower ground")) return "LG";
    if (l.includes("basement")) return "B1";
    return floorName.slice(0, 2).toUpperCase();
  }

  return (
    <div className="flex flex-col gap-1.5 p-1.5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] shadow-xs select-none">
      <button
        type="button"
        onClick={() => onSelectFloor("ALL")}
        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between gap-2 ${
          activeFloor === "ALL"
            ? "bg-[#17211D] text-[#F4F7F2] shadow-xs"
            : "text-[#58655E] hover:text-[#17211D] hover:bg-[#DDE4CF]"
        }`}
      >
        <span className="font-mono text-[10px] uppercase tracking-wider">All Floors</span>
      </button>

      {floors.map((floor) => {
        const isSelected = activeFloor === floor;
        const shortCode = getFloorShortCode(floor);
        const counts = unitCountsByFloor[floor];

        return (
          <button
            key={floor}
            type="button"
            onClick={() => onSelectFloor(floor)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between gap-3 ${
              isSelected
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs"
                : "text-[#58655E] hover:text-[#17211D] hover:bg-[#DDE4CF]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                isSelected ? "bg-[#FF704D] text-[#17211D]" : "bg-[#DDE4CF] text-[#58655E]"
              }`}>
                {shortCode}
              </span>
              <span className="truncate">{floor}</span>
            </div>

            {counts && (
              <span className={`text-[10px] font-mono ${
                isSelected ? "text-[#8FA66B]" : "text-[#85918A]"
              }`}>
                {counts.occupied}/{counts.total}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
