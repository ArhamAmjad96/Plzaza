"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExpenseItem, ExpenseStats } from "@/lib/expenses/service";
import { deleteGeneralExpenseAction } from "@/app/expenses/actions";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import AddExpenseModal from "./AddExpenseModal";
import StatMetric from "@/components/ui/StatMetric";
import EmptyState from "@/components/ui/EmptyState";
import { Receipt, Calendar, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface ExpensesManagerProps {
  expenses: ExpenseItem[];
  stats: ExpenseStats;
  selectedMonth: string;
}

export default function ExpensesManager({
  expenses,
  stats,
  selectedMonth,
}: ExpensesManagerProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = Array.from(new Set(expenses.map((e) => e.category))).sort();
  const filteredExpenses = expenses.filter(
    (e) => selectedCategory === "ALL" || e.category === selectedCategory
  );

  function handleMonthChange(newMonth: string) {
    router.push(`/expenses?month=${newMonth}`);
  }

  async function handleDelete(expense: ExpenseItem) {
    if (!window.confirm(`Delete this expense: "${expense.title}" — ${formatPKR(expense.amount)}?`)) return;
    try {
      await deleteGeneralExpenseAction(expense.id);
    } catch {
      alert("Could not delete this expense. Please try again.");
    }
  }

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-[#CBD4BC]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FF704D] font-mono">
            OPERATIONAL OVERHEADS
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#17211D]">
            Plaza Expenses
          </h1>
          <p className="text-xs text-[#58655E] mt-0.5">
            Operational overheads and utility costs for {selectedMonth === "ALL" ? "all time" : formatBillingMonth(selectedMonth)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D]">
            <Calendar size={13} className="text-[#58655E]" />
            <input
              type="month"
              value={selectedMonth === "ALL" ? "" : selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="border-none bg-transparent font-mono text-xs text-[#17211D] focus:ring-0 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition shadow-xs"
          >
            <Plus size={14} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* ─── Summary Stat Metrics ─── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatMetric
          label="Total Overheads"
          value={formatPKR(stats.totalExpenses)}
          subValue={`${expenses.length} logged items`}
          highlight
        />
        <StatMetric
          label="Staff & Guard Wages"
          value={formatPKR(stats.staffSalaries)}
          subValue="Security, sweeper, guard salaries"
        />
        <StatMetric
          label="Generator Diesel Fuel"
          value={formatPKR(stats.utilitiesAndFuel)}
          subValue="Power backup fuel costs"
        />
        <StatMetric
          label="Cleaning & Waste"
          value={formatPKR(stats.cleaningAndWaste)}
          subValue="Sweeper & waste collection"
        />
      </section>

      {/* ─── Category Filter Pills ─── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-medium text-[#58655E]">
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3 py-1.5 rounded-xl transition ${
            selectedCategory === "ALL"
              ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
              : "hover:text-[#17211D]"
          }`}
        >
          All ({expenses.length})
        </button>
        {categories.map((cat) => {
          const count = expenses.filter((e) => e.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl transition ${
                selectedCategory === cat
                  ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                  : "hover:text-[#17211D]"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* ─── Expenses Table ─── */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Zero expenses recorded"
          description="Log operational costs like diesel, guard wages, sweeping, or repairs."
          actionText="Log Expense"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#E8EDD9] text-[10px] uppercase font-semibold text-[#58655E] border-b border-[#CBD4BC]">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Paid To</th>
                <th className="py-3.5 px-4 text-right">Amount (PKR)</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD4BC]/60">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-[#E8EDD9]/40 transition">
                  <td className="py-3.5 px-4 text-[#58655E]">{exp.expense_date}</td>
                  <td className="py-3.5 px-4 font-sans font-semibold text-[#17211D]">
                    {exp.title}
                  </td>
                  <td className="py-3.5 px-4 text-[#58655E]">
                    <span className="px-2 py-0.5 rounded-md bg-[#E8EDD9] border border-[#CBD4BC] text-[10px]">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#58655E] font-sans">{exp.paid_to || "—"}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-[#17211D]">
                    {formatPKR(exp.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(exp)}
                      className="p-1.5 rounded-lg border border-[#CBD4BC] text-[#8E3E33] hover:bg-[#FAECE9] transition"
                      title="Delete Entry"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddModal && (
        <AddExpenseModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
