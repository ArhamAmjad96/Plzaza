"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export default function LiveClock() {
  const [mounted, setMounted] = useState(false);
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    function updateClock() {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs sm:text-sm font-mono font-semibold text-[#17211D] shadow-xs select-none"
      title="Live Local Time"
    >
      <Clock size={14} className="text-[#FF704D] shrink-0" />
      <span>{mounted && timeStr ? timeStr : "--:--"}</span>
    </div>
  );
}
