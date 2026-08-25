import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface StatMetricProps {
  label: string;
  value: string;
  subValue?: string;
  href?: string;
  actionText?: string;
  highlight?: boolean;
}

export default function StatMetric({
  label,
  value,
  subValue,
  href,
  actionText,
  highlight = false,
}: StatMetricProps) {
  const content = (
    <div
      className={`relative p-6 rounded-2xl border transition-all ${
        highlight
          ? "bg-[#FAF6F0] border-[#FF704D]/60 shadow-xs"
          : "bg-[#E8EDD9] border-[#CBD4BC] hover:border-[#8FA66B]"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#58655E] font-mono">
          {label}
        </p>
        {href && (
          <span className="text-[#FF704D] opacity-0 group-hover:opacity-100 transition">
            <ArrowUpRight size={14} />
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="font-mono text-2xl sm:text-3xl font-semibold tracking-tight text-[#17211D]">
          {value}
        </p>
        {subValue && (
          <p className="mt-1 text-xs text-[#58655E] font-normal leading-relaxed">
            {subValue}
          </p>
        )}
      </div>

      {actionText && href && (
        <div className="mt-4 pt-3 border-t border-[#CBD4BC]/60 flex items-center justify-between text-xs font-medium text-[#FF704D] group-hover:text-[#17211D] transition">
          <span>{actionText}</span>
          <ArrowUpRight size={13} />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block">
        {content}
      </Link>
    );
  }

  return content;
}
