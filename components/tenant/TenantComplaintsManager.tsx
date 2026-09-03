"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Wrench,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Send,
} from "lucide-react";

interface TenantComplaintsManagerProps {
  complaints: any[];
  unitName?: string;
}

const CATEGORIES = [
  "Electrical",
  "Water / Plumbing",
  "AC",
  "Door / Lock",
  "Wall / Paint",
  "Roof",
  "Flooring",
  "Washroom",
  "Leakage",
  "Structural",
  "Other",
];

const PRIORITIES = [
  { value: "LOW", label: "Low Priority (Routine maintenance)" },
  { value: "MEDIUM", label: "Medium Priority (Standard repair)" },
  { value: "HIGH", label: "High Priority (Impacts business/space)" },
  { value: "URGENT", label: "Urgent (Emergency: water leak / power fault)" },
];

export default function TenantComplaintsManager({
  complaints,
  unitName,
}: TenantComplaintsManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Electrical");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please describe what needs repair.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tenant/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          priority,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowModal(false);
        setTitle("");
        setDescription("");
        setCategory("Electrical");
        setPriority("MEDIUM");
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#17211D]">
            Space Maintenance & Work Orders
          </h2>
          <p className="text-xs text-[#58655E]">
            Assigned Space: <strong className="text-[#17211D]">{unitName || "Commercial Space"}</strong> · {complaints.length} tickets recorded
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} className="text-[#8FA66B]" />
          <span>Lodge Maintenance Request</span>
        </button>
      </div>

      {/* Complaints List */}
      <div className="rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs overflow-hidden">
        {complaints.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Wrench size={32} className="mx-auto text-[#85918A]" />
            <h4 className="text-sm font-bold text-[#17211D]">No Maintenance Requests</h4>
            <p className="text-xs text-[#58655E] max-w-sm mx-auto">
              Need assistance with electrical wiring, plumbing, door locks, or AC? Click the button above to lodge a ticket.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#CBD4BC]/60">
            {complaints.map((c) => (
              <div key={c.id} className="p-5 hover:bg-[#E8EDD9]/25 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#17211D]">{c.complaint_number || `CMP-${c.id}`}</span>
                    <span className="text-sm font-bold text-[#17211D]">{c.title}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.description && (
                    <p className="text-xs text-[#58655E] line-clamp-2">{c.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] font-mono text-[#85918A] pt-1">
                    <span>Category: {c.category || "General"}</span>
                    <span>·</span>
                    <span className="text-[#17211D] font-semibold">Priority: {c.priority}</span>
                    {c.complaint_date && (
                      <>
                        <span>·</span>
                        <span>Date: {c.complaint_date}</span>
                      </>
                    )}
                    {c.assigned_to && (
                      <>
                        <span>·</span>
                        <span className="text-[#2D5A43] font-semibold">Assigned: {c.assigned_to}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Lodge Maintenance Request Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#17211D]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#17211D] text-[#8FA66B] flex items-center justify-center">
                  <Wrench size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17211D]">
                    Lodge Maintenance Request
                  </h3>
                  <p className="text-xs text-[#58655E]">
                    Assigned Space: {unitName || "Your Space"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-[#E8EDD9] text-[#58655E] hover:text-[#17211D] transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-[#FAECE9] border border-[#EAC4BE] text-xs text-[#8E3E33] flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="p-6 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] text-center space-y-2">
                <CheckCircle2 size={28} className="mx-auto text-[#2D5A43]" />
                <h4 className="text-sm font-bold text-[#17211D]">Ticket Lodged Successfully!</h4>
                <p className="text-xs text-[#58655E]">
                  The plaza management has been notified.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-[#58655E] block font-semibold">
                    Issue Title / Subject *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Main ceiling light fluctuating, water faucet leak"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#17211D]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[#58655E] block font-semibold">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#17211D]"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[#58655E] block font-semibold">
                      Urgency / Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#17211D]"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#58655E] block font-semibold">
                    Description & Specific Details
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide additional details or convenient times for maintenance crew visit..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#17211D]"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-semibold text-[#17211D] hover:bg-[#DDE4CF] transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-[#8FA66B]" />
                        <span>Submitting Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} className="text-[#8FA66B]" />
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
