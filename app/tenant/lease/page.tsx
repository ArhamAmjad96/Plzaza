import { getTenantContext } from "@/lib/auth/tenant-context";
import { formatPKR } from "@/lib/utils/format";
import StatusBadge from "@/components/ui/StatusBadge";
import { FileText, ShieldCheck, Calendar, CheckCircle2, AlertCircle, Building2 } from "lucide-react";

export default async function TenantLeasePage() {
  const context = await getTenantContext();
  const { lease, unit, tenant } = context;

  if (!lease) {
    return (
      <div className="p-12 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] text-center space-y-3">
        <FileText size={32} className="mx-auto text-[#85918A]" />
        <h3 className="text-base font-bold text-[#17211D]">No Lease Agreement Found</h3>
        <p className="text-xs text-[#58655E]">You currently do not have an active lease contract on record.</p>
      </div>
    );
  }

  const isDepositFullyPaid = lease.security_paid >= lease.security_amount;

  return (
    <div className="space-y-6 select-none">
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF704D]">
          TENANCY CONTRACT & TERMS
        </span>
        <h1 className="text-2xl font-bold text-[#17211D] mt-1">Lease Agreement</h1>
        <p className="text-xs text-[#58655E]">
          Official tenancy terms, agreement duration, and security deposit details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contract Schedule */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#8FA66B]" />
              <h2 className="text-sm font-bold text-[#17211D]">Lease Period & Space</h2>
            </div>
            <StatusBadge status={lease.status} />
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Assigned Space:</span>
              <strong className="text-[#17211D]">{unit?.unit_name || "Commercial Space"}</strong>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Tenant Full Name:</span>
              <span className="text-[#17211D]">{tenant?.full_name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Contract Start Date:</span>
              <span className="text-[#17211D] font-bold">
                {lease.lease_start_date || lease.start_date || (lease as any).move_in_date || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Contract End Date:</span>
              <span className="text-[#17211D] font-bold">
                {lease.lease_end_date && lease.lease_end_date !== "—"
                  ? lease.lease_end_date
                  : lease.end_date && lease.end_date !== "—"
                  ? lease.end_date
                  : "Open-Ended / 1 Year"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#58655E]">Monthly Rent Commitment:</span>
              <strong className="text-base text-[#17211D]">{formatPKR(lease.monthly_rent)}</strong>
            </div>
          </div>
        </div>

        {/* Security Deposit Details */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#8FA66B]" />
              <h2 className="text-sm font-bold text-[#17211D]">Security Deposit Details</h2>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${isDepositFullyPaid ? "bg-[#E8EDD9] text-[#2D5A27]" : "bg-[#FAECE9] text-[#8E3E33]"}`}>
              {isDepositFullyPaid ? "Fully Paid" : "Partial Deposit"}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Deposit Required:</span>
              <strong className="text-[#17211D]">{formatPKR(lease.security_amount)}</strong>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Deposit Paid:</span>
              <span className="text-[#2D5A43] font-bold">{formatPKR(lease.security_paid)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Deposit Balance:</span>
              <span className="text-[#17211D]">
                {formatPKR(Math.max(0, lease.security_amount - lease.security_paid))}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#58655E]">Deposit Status:</span>
              <span className="font-semibold text-[#2D5A43]">Held in Trust on File</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
