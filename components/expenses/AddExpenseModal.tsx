"use client";

import { useState } from "react";
import { createGeneralExpenseAction } from "@/app/expenses/actions";
import { GeneralExpenseCategory } from "@/lib/expenses/service";
import {
  Shield,
  Sparkles,
  Fuel,
  Lightbulb,
  Trash2,
  Receipt,
  X,
} from "lucide-react";

interface AddExpenseModalProps {
  selectedMonth?: string;
  onClose: () => void;
}

const CATEGORIES: Array<{ key: GeneralExpenseCategory; label: string; icon: any; defaultTitle: string }> = [
  { key: "Security Guard Salary", label: "Security Guard Salary", icon: Shield, defaultTitle: "Monthly Security Guard Salary" },
  { key: "Janitorial / Sweeper / Cleaning", label: "Janitorial & Sweeper", icon: Sparkles, defaultTitle: "Sweeper & Cleaning Wages" },
  { key: "Generator Fuel / Maintenance", label: "Generator Diesel Fuel", icon: Fuel, defaultTitle: "Generator Diesel Fuel" },
  { key: "Common Area Utilities", label: "Common Area Utilities", icon: Lightbulb, defaultTitle: "Common Area Utilities" },
  { key: "Waste Disposal", label: "Waste Disposal", icon: Trash2, defaultTitle: "Monthly Waste Collection" },
  { key: "Other", label: "Other Running Cost", icon: Receipt, defaultTitle: "Building Maintenance & Operational Cost" },
];

export default function AddExpenseModal({ onClose }: AddExpenseModalProps) {
  const [category, setCategory] = useState<GeneralExpenseCategory>("Generator Fuel / Maintenance");
  const [title, setTitle] = useState("Generator Diesel Fuel");
  const [amount, setAmount] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);

  function handleSelectCat(item: typeof CATEGORIES[0]) {
    setCategory(item.key);
    setTitle(item.defaultTitle);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!title.trim() || isNaN(amt) || amt <= 0) {
      alert("Please enter a valid expense title and amount in Rupees.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("title", title.trim());
      formData.append("amount", amt.toString());
      formData.append("paid_to", paidTo.trim());
      formData.append("payment_method", paymentMethod);
      formData.append("expense_date", expenseDate);

      await createGeneralExpenseAction(formData);
      onClose();
    } catch {
      alert("Failed to log expense.");
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
              OPERATIONAL LEDGER
            </p>
            <h3 className="text-lg font-medium text-[#17211D]">
              Record Plaza Expense
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
          {/* Category Tiles */}
          <div>
            <label className="font-semibold text-[#17211D]">Expense Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleSelectCat(cat)}
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
            <label className="font-semibold text-[#17211D]">Expense Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D]"
              required
            />
          </div>

          {/* Amount & Paid To */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#17211D]">Amount (PKR)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#58655E]">Rs.</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#17211D]">Paid To (Recipient)</label>
              <input
                type="text"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                placeholder="e.g. PSO Petrol Pump, Guard Tariq"
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D]"
              />
            </div>
          </div>

          {/* Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#17211D]">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D]"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="JazzCash">JazzCash / EasyPaisa</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#17211D]">Expense Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D]"
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
              {submitting ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
