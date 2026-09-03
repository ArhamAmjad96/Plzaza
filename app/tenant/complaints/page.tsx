import { getTenantContext } from "@/lib/auth/tenant-context";
import TenantComplaintsManager from "@/components/tenant/TenantComplaintsManager";

export default async function TenantComplaintsPage() {
  const context = await getTenantContext();
  const { complaints, unit } = context;

  return (
    <div className="space-y-6 select-none">
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8FA66B]">
          MAINTENANCE & REPAIR TICKETS
        </span>
        <h1 className="text-2xl font-bold text-[#17211D] mt-1">Maintenance Requests</h1>
        <p className="text-xs text-[#58655E]">
          Track the status and resolution timeline of repair requests submitted for {unit?.unit_name || "your space"}.
        </p>
      </div>

      <TenantComplaintsManager
        complaints={complaints}
        unitName={unit?.unit_name}
      />
    </div>
  );
}
