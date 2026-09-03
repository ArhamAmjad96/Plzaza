"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      router.refresh();
      onClose();
    } catch {
      alert("Failed to log maintenance issue.");
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
              OPERATIONS TICKET
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#17211D] mt-1">
              Report Maintenance Issue
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

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {/* Affected Space */}
          <div>
            <label className="font-semibold text-sm text-[#17211D]">Affected Space</label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full mt-1.5 px-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-sm sm:text-base text-[#17211D] focus:border-[#FF704D] shadow-xs"
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
            <label className="font-semibold text-sm text-[#17211D] block mb-2">Repair Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                      isSelected
                        ? "border-[#FF704D] bg-[#FFF0EB] text-[#FF704D] font-semibold shadow-xs"
                        : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E] hover:bg-[#DDE4CF]"
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="text-xs sm:text-sm truncate leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="font-semibold text-sm text-[#17211D]">Problem Summary</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water leakage near main washroom pipe or broken lock"
              className="w-full mt-1.5 px-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-sm sm:text-base text-[#17211D] focus:border-[#FF704D] shadow-xs"
              required
            />
          </div>

          {/* Priority & Contractor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-sm text-[#17211D]">Urgency Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-sm sm:text-base text-[#17211D] focus:border-[#FF704D] shadow-xs"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="EMERGENCY">Emergency Critical</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-sm text-[#17211D]">Assigned Contractor (Optional)</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Technician Tariq, Plumber Aslam"
                className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-sm sm:text-base text-[#17211D] focus:border-[#FF704D] shadow-xs"
              />
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
              disabled={submitting}
              className="px-8 py-3.5 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-sm sm:text-base font-semibold hover:bg-[#24332D] transition shadow-md disabled:opacity-50"
            >
              {submitting ? "Logging..." : "Log Issue Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
