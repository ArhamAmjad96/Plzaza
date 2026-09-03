import { getTenantContext } from "@/lib/auth/tenant-context";
import TenantPaymentsManager from "@/components/tenant/TenantPaymentsManager";

export const dynamic = "force-dynamic";

export default async function TenantPaymentsPage() {
  const context = await getTenantContext();
  const { tenant, unit, lease, payments, outstandingBalance, electricity } = context;

  return (
    <TenantPaymentsManager
      payments={payments}
      outstandingBalance={outstandingBalance}
      tenantName={tenant?.full_name || "Resident Tenant"}
      shopName={unit?.unit_name || "Assigned Unit"}
      referenceNumber={electricity?.reference_number}
      monthlyRent={lease?.monthly_rent || 0}
    />
  );
}
