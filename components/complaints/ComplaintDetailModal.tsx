"use client";

import { useState } from "react";
import { updateComplaintAction } from "@/app/complaints/actions";
import { addComplaintExpenseAction } from "@/app/complaints/expense-actions";
import { ComplaintItem, ComplaintStatus } from "@/lib/complaints/service";
import { formatPKR } from "@/lib/utils/format";
import StatusBadge from "@/components/ui/StatusBadge";
import { Wrench, X, Plus, User, Calendar, CheckCircle2 } from "lucide-react";

interface ComplaintDetailModalProps {
  complaint: ComplaintItem;
  totalExpense?: number;
  onClose: () => void;
}

export default function ComplaintDetailModal({
  complaint,
  totalExpense = 0,
  onClose,
}: ComplaintDetailModalProps) {
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [assignedTo, setAssignedTo] = useState(complaint.assigned_to || "");
  const [resolutionNotes, setResolutionNotes] = useState(complaint.resolution_notes || "");

  // Log expense
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidTo, setExpensePaidTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleUpdateStatus() {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("assigned_to", assignedTo);
      formData.append("resolution_notes", resolutionNotes);

      await updateComplaintAction(complaint.id, formData);
      onClose();
    } catch {
      alert("Failed to update complaint status.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!expenseTitle.trim() || isNaN(amt) || amt <= 0) {
      alert("Please enter a valid expense title and amount.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("complaint_id", complaint.id.toString());
      formData.append("description", expenseTitle.trim());
      formData.append("amount", amt.toString());
      formData.append("vendor_name", expensePaidTo.trim());
      formData.append("expense_date", new Date().toISOString().split("T")[0]);

      await addComplaintExpenseAction(formData);
      setShowAddExpense(false);
      setExpenseTitle("");
      setExpenseAmount("");
      setExpensePaidTo("");
      onClose();
    } catch {
      alert("Failed to log repair expense.");
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
                {complaint.unit_name || `Unit #${complaint.unit_id}`}
              </span>
              <StatusBadge status={status} />
            </div>
            <h3 className="text-lg font-medium text-[#17211D] mt-0.5">
              {complaint.title}
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

        {/* State Flow Controls */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#17211D]">Update Issue Lifecycle</label>
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
                className={`py-2 rounded-xl border text-center text-xs font-medium transition ${
                  status === st.id
                    ? "border-[#17211D] bg-[#17211D] text-[#F4F7F2]"
                    : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E] hover:bg-[#DDE4CF]"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-[#17211D]">Assigned Technician / Contractor</label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="e.g. Tariq Electrician"
              className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#17211D]">Resolution Notes</label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={2}
              placeholder="Describe actions taken to resolve the issue..."
              className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D]"
            />
          </div>
        </div>

        {/* Expense Summary & Logger */}
        <div className="p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase font-semibold text-[#58655E] block">
                LOGGED REPAIR EXPENSE
              </span>
              <p className="font-mono text-base font-bold text-[#17211D]">
                {formatPKR(totalExpense)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddExpense(!showAddExpense)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-medium text-[#17211D] hover:bg-[#DDE4CF]"
            >
              <Plus size={12} />
              <span>Log Expense</span>
            </button>
          </div>

          {showAddExpense && (
            <form onSubmit={handleAddExpense} className="pt-3 border-t border-[#CBD4BC]/60 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="Material / Part (e.g. Pipe valve)"
                  className="px-2.5 py-1.5 rounded-lg border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D]"
                  required
                />
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Amount (PKR)"
                  className="px-2.5 py-1.5 rounded-lg border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={expensePaidTo}
                  onChange={(e) => setExpensePaidTo(e.target.value)}
                  placeholder="Paid to (Shop/Worker)"
                  className="flex-1 mr-2 px-2.5 py-1.5 rounded-lg border border-[#CBD4BC] bg-[#FAF6F0] text-xs focus:border-[#FF704D]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D]"
                >
                  Save
                </button>
              </div>
            </form>
          )}
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
            type="button"
            onClick={handleUpdateStatus}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
