"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { generateMonthlyChargesAction } from "@/app/rent/actions";
import { Search, Calendar, RefreshCw } from "lucide-react";

interface RentFilterBarProps {
  currentMonth: string;
  currentSearch?: string;
  currentStatus?: string;
}

export default function RentFilterBar({
  currentMonth,
  currentSearch = "",
  currentStatus = "all",
}: RentFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentSearch);
  const [month, setMonth] = useState(currentMonth);
  const [isPending, startTransition] = useTransition();
  const [btnMessage, setBtnMessage] = useState<string | null>(null);

  function updateParams(newMonth: string, newSearch: string, newStatus: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newMonth) params.set("month", newMonth);
    if (newSearch) params.set("search", newSearch);
    else params.delete("search");

    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    else params.delete("status");

    router.push(`/rent?${params.toString()}`);
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setMonth(val);
    updateParams(val, search, currentStatus);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearch(val);
    updateParams(month, val, currentStatus);
  }

  function handleStatusClick(statusKey: string) {
    updateParams(month, search, statusKey);
  }

  function handleGenerateCharges() {
    startTransition(async () => {
      setBtnMessage("Generating...");
      const res = await generateMonthlyChargesAction(month);
      if (res.success) {
        setBtnMessage(`✓ ${res.message}`);
        setTimeout(() => setBtnMessage(null), 3000);
        router.refresh();
      } else {
        setBtnMessage("Failed");
        setTimeout(() => setBtnMessage(null), 3000);
      }
    });
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Search & Month Inputs */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#58655E]" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search tenant name or shop number..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] placeholder-[#85918A] focus:border-[#FF704D] transition"
          />
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D]">
          <Calendar size={13} className="text-[#58655E]" />
          <input
            type="month"
            value={month}
            onChange={handleMonthChange}
            className="border-none bg-transparent font-mono text-xs text-[#17211D] focus:ring-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Filter Tabs & Auto-Generate Action */}
      <div className="flex items-center gap-2">
        <div className="flex items-center p-1 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-medium text-[#58655E]">
          <button
            type="button"
            onClick={() => handleStatusClick("all")}
            className={`px-3 py-1.5 rounded-lg transition ${
              currentStatus === "all"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleStatusClick("unpaid")}
            className={`px-3 py-1.5 rounded-lg transition ${
              currentStatus === "unpaid"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            Due
          </button>
          <button
            type="button"
            onClick={() => handleStatusClick("paid")}
            className={`px-3 py-1.5 rounded-lg transition ${
              currentStatus === "paid"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            Paid
          </button>
        </div>

        <button
          type="button"
          onClick={handleGenerateCharges}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-medium text-[#58655E] hover:text-[#17211D] hover:bg-[#E8EDD9] transition shadow-xs disabled:opacity-50"
          title="Recalculate monthly dues for active leases"
        >
          <RefreshCw size={13} className={isPending ? "animate-spin text-[#FF704D]" : "text-[#58655E]"} />
          <span>{btnMessage || "Refresh Dues"}</span>
        </button>
      </div>
    </div>
  );
}
