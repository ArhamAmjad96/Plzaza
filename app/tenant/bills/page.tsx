import { getTenantContext } from "@/lib/auth/tenant-context";
import TenantBillsManager from "@/components/tenant/TenantBillsManager";

export default async function TenantBillsPage() {
  const context = await getTenantContext();
  const { electricity, unit } = context;

  return (
    <div className="space-y-6 select-none">
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF704D]">
          UTILITY BILLS & HISTORY
        </span>
        <h1 className="text-2xl font-bold text-[#17211D] mt-1">Electricity Bills</h1>
        <p className="text-xs text-[#58655E]">
          Official IESCO scanned bills, consumption metrics, and payment records for your space.
        </p>
      </div>

      <TenantBillsManager
        bills={electricity.bills}
        referenceNumber={electricity.reference_number}
        unitName={unit?.unit_name}
        isShared={electricity.is_shared}
        splitValue={electricity.split_value}
      />
    </div>
  );
}
