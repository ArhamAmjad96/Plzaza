"use client";

import { useState } from "react";
import { createComplaintAction } from "@/app/complaints/actions";
import { UnitItem } from "@/lib/units/service";
import { TenantLeaseView } from "@/lib/tenants/service";
import { ComplaintCategory, ComplaintPriority } from "@/lib/complaints/service";
import {
  Wrench,
  Zap,
  Droplets,
  Paintbrush,
  DoorOpen,
  X,
  Check,
} from "lucide-react";

interface AddComplaintModalProps {
  units: UnitItem[];
  tenants: TenantLeaseView[];
  onClose: () => void;
}

const CATEGORIES: Array<{ key: ComplaintCategory; label: string; icon: any }> = [
  { key: "Electrical", label: "Electrical / Wiring", icon: Zap },
  { key: "Water / Plumbing", label: "Water / Plumbing", icon: Droplets },
  { key: "Wall / Paint", label: "Wall / Paint / Civil", icon: Paintbrush },
  { key: "Door / Lock", label: "Door / Shutter / Lock", icon: DoorOpen },
  { key: "Other", label: "General Maintenance", icon: Wrench },
];

export default function AddComplaintModal({ units, tenants, onClose }: AddComplaintModalProps) {
  const [unitId, setUnitId] = useState(units.length > 0 ? units[0].id.toString() : "");
  const [category, setCategory] = useState<ComplaintCategory>("Electrical");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<ComplaintPriority>("MEDIUM");
  const [assignedTo, setAssignedTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!unitId || !title.trim()) {
      alert("Please select a space and describe the maintenance problem.");
      return;
    }

    const matchedTenant = tenants.find((t) => t.unit?.id.toString() === unitId && t.is_active);

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("unit_id", unitId);
      if (matchedTenant) formData.append("tenant_id", matchedTenant.tenant.id.toString());
      formData.append("category", category);
      formData.append("title", title.trim());
      formData.append("description", "");
      formData.append("priority", priority);
      formData.append("assigned_to", assignedTo.trim());
      formData.append("complaint_date", new Date().toISOString().split("T")[0]);

      await createComplaintAction(formData);
      onClose();
    } catch {
      alert("Failed to log maintenance issue.");
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
              OPERATIONS TICKET
            </p>
            <h3 className="text-lg font-medium text-[#17211D]">
              Report Maintenance Issue
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
          {/* Affected Space */}
          <div>
            <label className="font-semibold text-[#17211D]">Affected Space</label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D]"
              required
            >
              {units.map((u) => (
                <option key={u.id} value={u.id.toString()}>
                  {u.unit_name} ({u.floor})
                </option>
              ))}
            </select>
          </div>

          {/* Category Tiles */}
          <div>
            <label className="font-semibold text-[#17211D]">Repair Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                      isSelected
                        ? "border-[#FF704D] bg-[#FFF0EB] text-[#FF704D] font-medium"
                        : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E] hover:bg-[#DDE4CF]"
                    }`}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span className="text-[11px] truncate leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="font-semibold text-[#17211D]">Problem Summary</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water leakage near main washroom pipe"
              className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D]"
              required
            />
          </div>

          {/* Priority & Contractor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#17211D]">Urgency Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D]"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="EMERGENCY">Emergency Critical</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#17211D]">Assigned Contractor (Optional)</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Ahmed Electrician"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D]"
              />
            </div>
          </div>

          {/* Actions */}
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
              {submitting ? "Logging..." : "Log Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
