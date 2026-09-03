import { getTenantContext } from "@/lib/auth/tenant-context";
import { formatPKR } from "@/lib/utils/format";
import StatusBadge from "@/components/ui/StatusBadge";
import { Building2, Zap, ShieldCheck, Calendar, Layers, MapPin, CheckCircle2 } from "lucide-react";

export default async function TenantUnitPage() {
  const context = await getTenantContext();
  const { unit, lease, electricity } = context;

  if (!unit) {
    return (
      <div className="p-12 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] text-center space-y-3">
        <Building2 size={32} className="mx-auto text-[#85918A]" />
        <h3 className="text-base font-bold text-[#17211D]">No Space Assigned</h3>
        <p className="text-xs text-[#58655E]">You currently do not have an active shop or room assigned.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF704D]">
          MY ASSIGNED SPACE
        </span>
        <h1 className="text-2xl font-bold text-[#17211D] mt-1">{unit.unit_name}</h1>
        <p className="text-xs text-[#58655E]">
          {unit.floor} Floor · {unit.unit_type}
        </p>
      </div>

      {/* Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Space Specs */}
        <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#58655E]">
              PHYSICAL SPECIFICATIONS
            </span>
            <Building2 size={16} className="text-[#8FA66B]" />
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Space Name:</span>
              <strong className="text-[#17211D]">{unit.unit_name}</strong>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Floor Level:</span>
              <span className="text-[#17211D] font-semibold">{unit.floor}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Unit Category:</span>
              <span className="text-[#17211D]">{unit.unit_type}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Floor Area:</span>
              <span className="text-[#17211D]">{unit.area_sqft ? `${unit.area_sqft} sq ft` : "Standard Commercial"}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#58655E]">Occupancy Status:</span>
              <StatusBadge status={unit.status} />
            </div>
          </div>
        </div>

        {/* Card 2: Electricity Utility */}
        <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#58655E]">
              ELECTRICITY UTILITY
            </span>
            <Zap size={16} className="text-[#FF704D]" />
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">IESCO Reference:</span>
              <strong className="text-[#17211D]">{electricity.reference_number || "—"}</strong>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Meter Serial:</span>
              <span className="text-[#17211D]">{electricity.meter_number || "Standard"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Connection Type:</span>
              <span className="text-[#17211D]">
                {electricity.is_shared ? `Shared (${electricity.split_value}%)` : "Dedicated 1-to-1"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#58655E]">Total Bills on Record:</span>
              <span className="font-bold text-[#17211D]">{electricity.bills.length} Bills</span>
            </div>
          </div>
        </div>

        {/* Card 3: Security & Financial Terms */}
        <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#58655E]">
              FINANCIAL OVERVIEW
            </span>
            <ShieldCheck size={16} className="text-[#8FA66B]" />
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Monthly Base Rent:</span>
              <strong className="text-[#17211D]">{lease ? formatPKR(lease.monthly_rent) : "—"}</strong>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Security Deposit:</span>
              <span className="text-[#17211D]">{lease ? formatPKR(lease.security_paid) : "—"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#CBD4BC]/50">
              <span className="text-[#58655E]">Deposit Status:</span>
              <span className="font-semibold text-[#2D5A43]">
                {lease && lease.security_paid >= lease.security_amount ? "Fully Paid ✓" : "Held on File"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#58655E]">Lease Validity:</span>
              <span className="text-[#17211D]">{lease ? `${lease.start_date} → ${lease.end_date}` : "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
