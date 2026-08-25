import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

interface EmptyStateProps {
  icon?: any;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon = CheckCircle2,
  title,
  description,
  actionText,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[#DDD8D0] bg-[#FAF8F4]/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
      <div className="h-11 w-11 rounded-full bg-[#F3F0EA] border border-[#DDD8D0] flex items-center justify-center text-[#927C61] mb-3">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <h4 className="text-sm font-semibold text-[#211F1C] tracking-tight">{title}</h4>
      <p className="text-xs text-[#77716A] max-w-sm mt-1 leading-relaxed">{description}</p>
      
      {(actionText && (actionHref || onAction)) && (
        <div className="mt-4">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1816] text-[#FAF8F4] text-xs font-medium hover:bg-[#2C2723] transition shadow-xs"
            >
              {actionText}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1816] text-[#FAF8F4] text-xs font-medium hover:bg-[#2C2723] transition shadow-xs"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
