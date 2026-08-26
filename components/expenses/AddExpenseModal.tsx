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
              OPERATIONAL LEDGER
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#17211D] mt-1">
              Record Plaza Expense
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
          {/* Category Tiles */}
          <div>
            <label className="font-semibold text-sm text-[#17211D] block mb-2">Expense Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleSelectCat(cat)}
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
            <label className="font-semibold text-sm text-[#17211D]">Expense Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1.5 px-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-sm sm:text-base text-[#17211D] focus:border-[#FF704D] shadow-xs"
              required
            />
          </div>

          {/* Amount & Paid To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-sm text-[#17211D]">Amount (PKR)</label>
              <div className="relative mt-1.5">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[#58655E]">Rs.</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-base font-semibold text-[#17211D] focus:border-[#FF704D] shadow-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-sm text-[#17211D]">Paid To (Recipient)</label>
              <input
                type="text"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                placeholder="e.g. PSO Petrol Pump, Guard Tariq"
                className="w-full mt-1.5 px-4 py-3.5 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-sm sm:text-base text-[#17211D] focus:border-[#FF704D] shadow-xs"
              />
            </div>
          </div>

          {/* Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-sm text-[#17211D]">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] text-sm sm:text-base text-[#17211D] focus:border-[#FF704D] shadow-xs"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="JazzCash">JazzCash / EasyPaisa</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-sm text-[#17211D]">Expense Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-sm sm:text-base text-[#17211D] focus:border-[#FF704D] shadow-xs"
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
              {submitting ? "Saving..." : "Save Expense Voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
