"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateComplaintAction } from "@/app/complaints/actions";
import {
  deleteComplaintExpenseAction,
} from "@/app/complaints/expense-actions";
import { ComplaintItem, ComplaintStatus } from "@/lib/complaints/service";
import { ComplaintExpenseItem } from "@/lib/complaints/expenses-service";
import { formatPKR } from "@/lib/utils/format";
import StatusBadge from "@/components/ui/StatusBadge";
import { Wrench, X, Trash2, User, Calendar, CheckCircle2, DollarSign } from "lucide-react";

interface ComplaintDetailModalProps {
  complaint: ComplaintItem;
  expenses?: ComplaintExpenseItem[];
  totalExpense?: number;
  onClose: () => void;
}

export default function ComplaintDetailModal({
  complaint,
  expenses = [],
  totalExpense = 0,
  onClose,
}: ComplaintDetailModalProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [assignedTo, setAssignedTo] = useState(complaint.assigned_to || "");
  const [resolutionNotes, setResolutionNotes] = useState(complaint.resolution_notes || "");

  // Direct repair cost input
  const initialCost = expenses.length > 0
    ? expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    : totalExpense > 0
    ? totalExpense
    : 0;

  const [repairCost, setRepairCost] = useState<string>(initialCost > 0 ? initialCost.toString() : "");
  const [repairDesc, setRepairDesc] = useState<string>(
    expenses[0]?.description || `${complaint.title} repair`
  );

  const [expenseList, setExpenseList] = useState<ComplaintExpenseItem[]>(expenses);
  const [submitting, setSubmitting] = useState(false);

  async function handleSaveChanges() {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("assigned_to", assignedTo.trim());
      formData.append("resolution_notes", resolutionNotes.trim());
      formData.append("expense_amount", repairCost.trim());
      formData.append("expense_description", repairDesc.trim());

      await updateComplaintAction(complaint.id, formData);
      router.refresh();
      onClose();
    } catch {
      alert("Failed to save maintenance ticket changes.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteExistingExpense(expId: number | string) {
    if (!confirm("Are you sure you want to remove this logged expense?")) return;

    setSubmitting(true);
    try {
      await deleteComplaintExpenseAction(expId);
      const updated = expenseList.filter((e) => e.id?.toString() !== expId.toString());
      setExpenseList(updated);
      const newTotal = updated.reduce((s, e) => s + Number(e.amount || 0), 0);
      setRepairCost(newTotal > 0 ? newTotal.toString() : "");
      router.refresh();
    } catch {
      alert("Failed to delete expense.");
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
        className="w-full max-w-lg rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto text-[#17211D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
                {complaint.unit_name || `Unit #${complaint.unit_id}`}
              </span>
              <StatusBadge status={status} />
            </div>
            <h3 className="text-xl font-bold text-[#17211D] mt-0.5">
              {complaint.title}
            </h3>
            <p className="text-xs text-[#58655E] mt-0.5">
              Category: {complaint.category} · Priority: {complaint.priority}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Lifecycle Status Flow Controls */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#17211D] block">
            Update Issue Lifecycle
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "OPEN", label: "Open" },
              { id: "IN_PROGRESS", label: "In Progress" },
              { id: "RESOLVED", label: "Resolved" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatus(st.id as ComplaintStatus)}
                className={`py-2.5 rounded-xl border text-center text-xs font-medium transition shadow-2xs ${
                  status === st.id
                    ? "border-[#17211D] bg-[#17211D] text-[#F4F7F2] font-semibold"
                    : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E] hover:bg-[#DDE4CF] hover:text-[#17211D]"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Worker & Resolution Details */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-[#17211D]">Assigned Technician / Contractor</label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="e.g. Tariq Electrician"
              className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D] shadow-2xs"
            />
          </div>

          <div>
            <label className="font-semibold text-[#17211D]">Resolution Notes</label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={2}
              placeholder="Describe actions taken or repair summary..."
              className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D] shadow-2xs"
            />
          </div>
        </div>

        {/* ─── Repair Expenses Block ─── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-3 text-xs shadow-xs">
          <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-2.5">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-[#58655E] block">
                REPAIR EXPENSE & COST
              </span>
              <p className="text-xs text-[#58655E] mt-0.5">
                Saved automatically when you click Save Changes
              </p>
            </div>
          </div>

          {/* Simple Direct Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="font-medium text-[#17211D] block mb-1">Repair Cost (PKR)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-[#58655E]">
                  Rs.
                </span>
                <input
                  type="number"
                  value={repairCost}
                  onChange={(e) => setRepairCost(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs font-bold text-[#17211D] focus:border-[#FF704D]"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-[#17211D] block mb-1">Expense Description</label>
              <input
                type="text"
                value={repairDesc}
                onChange={(e) => setRepairDesc(e.target.value)}
                placeholder="Material / Labor / Parts"
                className="w-full px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D]"
              />
            </div>
          </div>

          {/* Existing Logged Expense Line (if any) */}
          {expenseList.length > 0 && (
            <div className="pt-2 border-t border-[#CBD4BC]/60 space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-[#58655E]">Logged Records ({expenseList.length}):</span>
              {expenseList.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF6F0] border border-[#CBD4BC]/60 font-mono text-[11px]">
                  <span>{exp.description}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#17211D]">{formatPKR(exp.amount)}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingExpense(exp.id)}
                      title="Delete this record"
                      className="p-1 rounded text-[#8E3E33] hover:bg-[#FAECE9] transition"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#CBD4BC]/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#58655E] hover:text-[#17211D] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-xs disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
