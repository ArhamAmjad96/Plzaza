import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  children?: React.ReactNode;
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  actionText,
  actionHref,
  children,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-2 border-b border-[#DDD8D0]/60">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#927C61] font-mono mb-1">
            {eyebrow}
          </p>
        )}
        <h3 className="text-xl font-medium tracking-tight text-[#211F1C]">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-[#77716A] mt-0.5 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actionText && actionHref && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#927C61] hover:text-[#211F1C] transition px-3 py-1.5 rounded-lg border border-[#DDD8D0] hover:bg-[#FAF8F4] bg-white"
          >
            <span>{actionText}</span>
            <ArrowUpRight size={13} />
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
