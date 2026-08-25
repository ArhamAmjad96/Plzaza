import { getTenantsWithLeases, getAvailableUnits } from "@/lib/tenants/service";
import TenantsManager from "@/components/tenants/TenantsManager";

export default async function TenantsPage() {
  const [{ tenants, stats }, availableUnits] = await Promise.all([
    getTenantsWithLeases(),
    getAvailableUnits(),
  ]);

  return (
    <div className="space-y-8">
      <TenantsManager
        tenants={tenants}
        stats={stats}
        availableUnits={availableUnits}
      />
    </div>
  );
}