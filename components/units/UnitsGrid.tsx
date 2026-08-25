"use client";

import { useState } from "react";
import { UnitItem } from "@/lib/units/service";
import { formatPKR } from "@/lib/utils/format";
import { toggleUnitStatusAction, deleteUnitAction } from "@/app/units/actions";
import AddUnitModal from "./AddUnitModal";
import EditUnitModal from "./EditUnitModal";

interface UnitsGridProps {
  units: UnitItem[];
}

export default function UnitsGrid({ units }: UnitsGridProps) {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedFloor, setSelectedFloor] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);

  // Extract unique floors
  const floors = Array.from(new Set(units.map((u) => u.floor))).sort();

  // Filter units
  const filteredUnits = units.filter((u) => {
    if (selectedType !== "ALL" && u.unit_type !== selectedType) return false;
    if (selectedStatus !== "ALL" && u.status !== selectedStatus) return false;
    if (selectedFloor !== "ALL" && u.floor !== selectedFloor) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.unit_name.toLowerCase().includes(q);
      const matchNum = u.unit_number.toLowerCase().includes(q);
      const matchFloor = u.floor.toLowerCase().includes(q);
      if (!matchName && !matchNum && !matchFloor) return false;
    }
    return true;
  });

  async function handleToggleStatus(unit: UnitItem) {
    const nextStatus = unit.status === "OCCUPIED" ? "VACANT" : "OCCUPIED";
    try {
      await toggleUnitStatusAction(unit.id, nextStatus);
    } catch {
      alert("Failed to toggle unit status.");
    }
  }

  async function handleDeleteUnit(unit: UnitItem) {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${unit.unit_name}? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await deleteUnitAction(unit.id);
    } catch {
      alert("Failed to delete unit.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setSelectedType("ALL")}
              className={`rounded-xl px-3 py-1.5 transition ${
                selectedType === "ALL" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
              }`}
            >
              All ({units.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("SHOP")}
              className={`rounded-xl px-3 py-1.5 transition ${
                selectedType === "SHOP" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
              }`}
            >
              🏪 Shops ({units.filter((u) => u.unit_type === "SHOP").length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("ROOM")}
              className={`rounded-xl px-3 py-1.5 transition ${
                selectedType === "ROOM" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
              }`}
            >
              🛏️ Rooms ({units.filter((u) => u.unit_type === "ROOM").length})
            </button>
          </div>

          {/* Status filter */}
          <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setSelectedStatus("ALL")}
              className={`rounded-xl px-3 py-1.5 transition ${
                selectedStatus === "ALL" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
              }`}
            >
              All Statuses
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("OCCUPIED")}
              className={`rounded-xl px-3 py-1.5 transition ${
                selectedStatus === "OCCUPIED" ? "bg-emerald-600 text-white shadow-sm" : "hover:text-slate-900"
              }`}
            >
              Occupied
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("VACANT")}
              className={`rounded-xl px-3 py-1.5 transition ${
                selectedStatus === "VACANT" ? "bg-amber-600 text-white shadow-sm" : "hover:text-slate-900"
              }`}
            >
              Vacant
            </button>
          </div>

          {/* Floor filter dropdown */}
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Floors / Flats</option>
            {floors.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search unit or floor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full sm:w-60 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-xs text-slate-900 outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 shadow-sm"
          >
            <span>+</span> Add Unit
          </button>
        </div>
      </div>

      {/* Units Grid */}
      {filteredUnits.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUnits.map((unit) => {
            const isShop = unit.unit_type === "SHOP";
            const isOccupied = unit.status === "OCCUPIED";

            return (
              <div
                key={unit.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  {/* Top Bar: Icon + Number + Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{isShop ? "🏪" : "🛏️"}</span>
                      <div>
                        <span className="font-mono text-sm font-black text-slate-900">
                          {unit.unit_number}
                        </span>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          {unit.floor}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(unit)}
                      title="Click to toggle status"
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold cursor-pointer transition ${
                        isOccupied
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : unit.status === "VACANT"
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {unit.status}
                    </button>
                  </div>

                  {/* Unit Title */}
                  <div className="py-3">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {unit.unit_name}
                    </h4>
                    {unit.notes && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                        {unit.notes}
                      </p>
                    )}
                  </div>

                  {/* Pricing Matrix */}
                  <div className="space-y-1.5 rounded-2xl bg-slate-50 p-3 border border-slate-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Monthly Rent:</span>
                      <span className="font-bold font-mono text-slate-900">
                        {formatPKR(unit.default_monthly_rent)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Security Deposit:</span>
                      <span className="font-mono text-slate-700">
                        {formatPKR(unit.default_security_amount)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Due Day:</span>
                      <span className="font-medium text-slate-700">
                        {unit.default_rent_due_day}th of month
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="text-[10px] text-slate-400">
                    Type: <strong className="text-slate-700">{unit.unit_type}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingUnit(unit)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteUnit(unit)}
                      className="rounded-lg p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                      title="Delete unit"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">🏢</span>
          <h3 className="mt-3 text-base font-bold text-slate-900">No Plaza Units Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No units match your selected filter criteria. You can create a new shop or room using the Add Unit button above.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Add New Unit
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddModal && <AddUnitModal onClose={() => setShowAddModal(false)} />}
      {editingUnit && (
        <EditUnitModal
          unit={editingUnit}
          onClose={() => setEditingUnit(null)}
        />
      )}
    </div>
  );
}
