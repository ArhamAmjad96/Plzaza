"use client";

import { useState } from "react";
import Link from "next/link";
import { UnitItem, UnitStats, PlazaItem } from "@/lib/units/service";
import { formatPKR } from "@/lib/utils/format";
import AddUnitModal from "./AddUnitModal";
import EditUnitModal from "./EditUnitModal";
import ConnectMeterModal from "./ConnectMeterModal";
import AddTenantModal from "@/components/tenants/AddTenantModal";
import StatusBadge from "@/components/ui/StatusBadge";
import FloorNavigator from "@/components/ui/FloorNavigator";
import DigitalPlaza from "@/components/plaza/DigitalPlaza";
import EmptyState from "@/components/ui/EmptyState";
import {
  Building2,
  Plus,
  Search,
  ArrowUpRight,
  UserPlus,
  Sliders,
  Zap,
} from "lucide-react";

interface UnitsManagerProps {
  units: UnitItem[];
  stats: UnitStats;
  plaza: PlazaItem;
}

export default function UnitsManager({ units, stats, plaza }: UnitsManagerProps) {
  const [filterStatus, setFilterStatus] = useState<"ALL" | "OCCUPIED" | "VACANT">("ALL");
  const [selectedFloor, setSelectedFloor] = useState<string | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);
  const [connectingMeterUnit, setConnectingMeterUnit] = useState<UnitItem | null>(null);
  const [onboardingTenantUnit, setOnboardingTenantUnit] = useState<UnitItem | null>(null);

  // Filter Units
  const filteredUnits = units.filter((u) => {
    if (filterStatus === "OCCUPIED" && u.status !== "OCCUPIED") return false;
    if (filterStatus === "VACANT" && u.status !== "VACANT") return false;
    if (selectedFloor !== "ALL" && (u.floor || "").toLowerCase() !== selectedFloor.toLowerCase()) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.unit_name.toLowerCase().includes(q);
      const matchNumber = u.unit_number.toLowerCase().includes(q);
      const matchFloor = (u.floor || "").toLowerCase().includes(q);
      const matchTenant = (u as any).tenant_name?.toLowerCase().includes(q);
      if (!matchName && !matchNumber && !matchFloor && !matchTenant) return false;
    }
    return true;
  });

  // Group by Floor
  const floorKeys = Array.from(new Set(units.map((u) => u.floor || "Ground Floor")));

  // Counts for FloorNavigator
  const unitCountsByFloor: Record<string, { total: number; occupied: number }> = {};
  floorKeys.forEach((f) => {
    const fUnits = units.filter((u) => (u.floor || "").toLowerCase() === f.toLowerCase());
    unitCountsByFloor[f] = {
      total: fUnits.length,
      occupied: fUnits.filter((u) => u.status === "OCCUPIED").length,
    };
  });

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-[#CBD4BC]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FF704D] font-mono">
            PROPERTY DIRECTORY
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#17211D]">
            Shops & Rooms
          </h1>
          <p className="text-xs text-[#58655E] mt-0.5">
            {stats.totalUnits} units across {floorKeys.length || 4} floors · {stats.occupiedCount} occupied · {stats.vacantCount} vacant
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddUnitModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition shadow-xs"
          >
            <Plus size={14} />
            <span>Add Unit</span>
          </button>
        </div>
      </div>

      {/* ─── Search & Status Filters ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#58655E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by shop number, name, floor, or tenant..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] placeholder-[#85918A] focus:border-[#FF704D] focus:ring-0 transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center p-1 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-medium text-[#58655E]">
          <button
            type="button"
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === "ALL"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            All ({stats.totalUnits})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("OCCUPIED")}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === "OCCUPIED"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            Occupied ({stats.occupiedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("VACANT")}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === "VACANT"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            Vacant ({stats.vacantCount})
          </button>
        </div>
      </div>

      {/* ─── Grid with Vertical Floor Navigator & Floor Cards ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Vertical Floor Navigator & Digital Plaza */}
        <div className="lg:col-span-3 space-y-4 sticky top-20">
          <FloorNavigator
            floors={floorKeys}
            activeFloor={selectedFloor}
            onSelectFloor={(f) => setSelectedFloor(f)}
            unitCountsByFloor={unitCountsByFloor}
          />

          <div className="hidden lg:block p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-3">
            <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-[#58655E]">
              BUILDING ELEVATION
            </span>
            <DigitalPlaza
              floors={floorKeys}
              units={units}
              activeFloor={selectedFloor === "ALL" ? null : selectedFloor}
              interactive={false}
              mode="ELEVATION"
            />
          </div>
        </div>

        {/* Right Side: Floor-Grouped Units List */}
        <div className="lg:col-span-9 space-y-8">
          {filteredUnits.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No shops match your search"
              description="Try clearing your search query or selecting a different floor level."
              actionText="Add New Unit"
              onAction={() => setShowAddUnitModal(true)}
            />
          ) : (
            (selectedFloor === "ALL" ? floorKeys : [selectedFloor]).map((floor) => {
              const floorUnits = filteredUnits.filter(
                (u) => (u.floor || "").toLowerCase() === floor.toLowerCase()
              );
              if (floorUnits.length === 0) return null;

              const floorOccupied = floorUnits.filter((u) => u.status === "OCCUPIED").length;

              return (
                <div key={floor} className="space-y-4">
                  {/* Floor Header Bar */}
                  <div className="flex items-center justify-between border-b border-[#CBD4BC] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#17211D]">
                        {floor}
                      </span>
                      <span className="text-xs text-[#58655E]">
                        ({floorOccupied} of {floorUnits.length} Occupied)
                      </span>
                    </div>
                  </div>

                  {/* Units Tiles Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {floorUnits.map((unit) => {
                      const isVacant = unit.status === "VACANT";
                      const tenant = (unit as any).tenant_name;
                      const hasMeter = Boolean((unit as any).meter_number || (unit as any).reference_number);

                      return (
                        <div
                          key={unit.id}
                          className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all duration-300 ${
                            isVacant
                              ? "bg-[#FAF6F0] border-[#FF704D]/60 hover:border-[#FF704D] shadow-xs"
                              : "bg-[#FAF6F0] border-[#CBD4BC] hover:border-[#8FA66B] shadow-xs"
                          }`}
                        >
                          <div>
                            {/* Card Top: Code & Status */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-mono text-sm font-bold text-[#17211D]">
                                  {unit.unit_number || unit.unit_name}
                                </span>
                                <p className="text-[11px] text-[#58655E]">
                                  {unit.unit_type === "ROOM" ? "Residential Room" : "Commercial Shop"}
                                </p>
                              </div>

                              <StatusBadge status={unit.status} />
                            </div>

                            {/* Tenant / Asking Rent */}
                            <div className="mt-4 pt-3 border-t border-[#CBD4BC]/60 space-y-1">
                              {tenant ? (
                                <div>
                                  <p className="text-xs font-semibold text-[#17211D]">
                                    {tenant}
                                  </p>
                                  <p className="text-[11px] font-mono text-[#58655E]">
                                    {formatPKR(unit.default_monthly_rent)}/mo
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-xs font-semibold text-[#FF704D]">
                                    Vacant Space
                                  </p>
                                  <p className="text-[11px] font-mono text-[#58655E]">
                                    Asking: {formatPKR(unit.default_monthly_rent)}/mo
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="pt-3 border-t border-[#CBD4BC]/60 flex items-center justify-between">
                            {isVacant ? (
                              <button
                                type="button"
                                onClick={() => setOnboardingTenantUnit(unit)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF704D] text-[#17211D] text-xs font-semibold hover:bg-[#E05432] hover:text-[#F4F7F2] transition shadow-xs"
                              >
                                <UserPlus size={13} />
                                <span>Assign Tenant</span>
                              </button>
                            ) : (
                              <Link
                                href={`/units/${unit.id}`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-[#17211D] hover:text-[#FF704D] transition"
                              >
                                <span>Open Unit</span>
                                <ArrowUpRight size={13} />
                              </Link>
                            )}

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setConnectingMeterUnit(unit)}
                                className="p-1.5 rounded-lg border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] hover:bg-[#E8EDD9] transition"
                                title="Electricity Meter"
                              >
                                <Zap size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingUnit(unit)}
                                className="p-1.5 rounded-lg border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] hover:bg-[#E8EDD9] transition"
                                title="Edit Unit Specs"
                              >
                                <Sliders size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Modals ─── */}
      {showAddUnitModal && (
        <AddUnitModal
          availableFloors={floorKeys}
          onClose={() => setShowAddUnitModal(false)}
        />
      )}

      {editingUnit && (
        <EditUnitModal
          unit={editingUnit}
          availableFloors={floorKeys}
          onClose={() => setEditingUnit(null)}
        />
      )}

      {connectingMeterUnit && (
        <ConnectMeterModal
          unit={connectingMeterUnit}
          onClose={() => setConnectingMeterUnit(null)}
        />
      )}

      {onboardingTenantUnit && (
        <AddTenantModal
          preselectedUnit={onboardingTenantUnit}
          preselectedUnitId={onboardingTenantUnit.id}
          availableUnits={units}
          onClose={() => setOnboardingTenantUnit(null)}
        />
      )}
    </div>
  );
}
