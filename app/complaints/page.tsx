import { getAllComplaints } from "@/lib/complaints/service";
import { getAllComplaintExpensesMap } from "@/lib/complaints/expenses-service";
import { getAllUnits } from "@/lib/units/service";
import { getTenantsWithLeases } from "@/lib/tenants/service";
import ComplaintsManager from "@/components/complaints/ComplaintsManager";

export const dynamic = "force-dynamic";

export default async function ComplaintsPage() {
  const [{ complaints, stats }, expenseMap, { units }, { tenants }] = await Promise.all([
    getAllComplaints(),
    getAllComplaintExpensesMap(),
    getAllUnits(),
    getTenantsWithLeases(),
  ]);

  return (
    <div className="space-y-8">
      <ComplaintsManager
        complaints={complaints}
        stats={stats}
        units={units}
        tenants={tenants}
        expenseMap={expenseMap}
      />
    </div>
  );
}
