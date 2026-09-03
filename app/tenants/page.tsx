import { getTenantsWithLeases, getAvailableUnits } from "@/lib/tenants/service";
import { getAllTenantCredentials } from "@/lib/auth/profile-service";
import TenantsManager from "@/components/tenants/TenantsManager";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const [{ tenants, stats }, availableUnits, credentials] = await Promise.all([
    getTenantsWithLeases(),
    getAvailableUnits(),
    getAllTenantCredentials(),
  ]);

  return (
    <div className="space-y-8">
      <TenantsManager
        tenants={tenants}
        stats={stats}
        availableUnits={availableUnits}
        credentials={credentials}
      />
    </div>
  );
}