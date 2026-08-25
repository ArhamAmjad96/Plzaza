import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { getTenantsWithLeases, TenantLeaseView } from "@/lib/tenants/service";
import { getMonthlyLedgers, normalizeBillingMonth, LedgerItem } from "@/lib/ledgers/service";
import { getPaymentsForConnection, PaymentTransaction } from "@/lib/payments/service";
import { getAllComplaints, ComplaintItem } from "@/lib/complaints/service";
import { getAllComplaintExpensesMap } from "@/lib/complaints/expenses-service";
import { getUnitAllocatedElectricityBill } from "@/lib/electricity/service";
import TenantProfileView from "@/components/tenants/TenantProfileView";

export const dynamic = "force-dynamic";

export default async function TenantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const sParams = await searchParams;

  const targetMonth = normalizeBillingMonth(sParams.month);

  // 1. Fetch all tenant views with leases
  const { tenants } = await getTenantsWithLeases();

  // Find tenant by ID, or fallback to matching connection_id
  let tenantView: TenantLeaseView | undefined = tenants.find((t) => t.tenant.id.toString() === id);
  if (!tenantView) {
    tenantView = tenants.find((t) => t.connection_id?.toString() === id);
  }

  if (!tenantView) {
    // If neither matches, check if it's a legacy connection without a tenant
    const { data: conn } = await supabase.from("connections").select("*").eq("id", id).maybeSingle();
    if (conn) {
      tenantView = {
        tenant: {
          id: conn.id,
          plaza_id: conn.plaza_id || 1,
          full_name: conn.tenant || conn.name,
          phone: null,
          cnic: null,
          emergency_contact: null,
          status: "ACTIVE",
          notes: "Legacy connection account",
        },
        lease: {
          id: conn.id,
          plaza_id: conn.plaza_id || 1,
          tenant_id: conn.id,
          unit_id: conn.id,
          monthly_rent: 28000,
          rent_due_day: 5,
          security_amount: 50000,
          security_paid: 50000,
          security_status: "PAID",
          move_in_date: new Date().toISOString().split("T")[0],
          lease_start_date: new Date().toISOString().split("T")[0],
          status: "ACTIVE",
        },
        unit: {
          id: conn.id,
          plaza_id: conn.plaza_id || 1,
          unit_number: conn.name,
          unit_name: conn.name,
          unit_type: "SHOP",
          floor: conn.location || "Ground Floor",
          default_monthly_rent: 28000,
          default_security_amount: 50000,
          default_rent_due_day: 5,
          status: "OCCUPIED",
        },
        connection_id: conn.id,
        is_active: true,
      };
    } else {
      notFound();
    }
  }

  if (!tenantView) {
    notFound();
  }

  const tenantId = tenantView.tenant.id;
  const unitId = tenantView.unit?.id;
  const connectionId = tenantView.connection_id || unitId || tenantId;

  // 2. Parallel data fetching: ledgers, payments, complaints, expenses, electricity info
  const [
    { items: allLedgers },
    payments,
    { complaints: allComplaints },
    maintenanceExpenseMap,
    electricityAlloc,
    { data: connDetails },
  ] = await Promise.all([
    getMonthlyLedgers(targetMonth),
    getPaymentsForConnection(connectionId),
    getAllComplaints(),
    getAllComplaintExpensesMap(),
    unitId ? getUnitAllocatedElectricityBill(unitId, targetMonth) : Promise.resolve(null),
    supabase.from("connections").select("*").eq("id", connectionId).maybeSingle(),
  ]);

  // Filter ledgers for this tenant
  const tenantLedgers = allLedgers.filter(
    (l) => l.tenant_id?.toString() === tenantId.toString() || l.connection_id?.toString() === connectionId.toString()
  );

  // Filter complaints for this unit
  const tenantComplaints = allComplaints.filter(
    (c) => (unitId && c.unit_id?.toString() === unitId.toString()) || c.tenant_id?.toString() === tenantId.toString()
  );

  const electricityInfo = {
    connection_name: connDetails?.name || (tenantView.unit ? `${tenantView.unit.unit_name} Meter` : "Plaza Meter"),
    reference_number: electricityAlloc?.connection_reference || connDetails?.reference_number || "N/A",
    meter_number: connDetails?.meter_number || "N/A",
    is_shared: Boolean(electricityAlloc?.is_shared),
    split_formula: electricityAlloc?.split_formula,
    latest_bill_amount: electricityAlloc?.total_connection_bill,
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Navigation Breadcrumb (Hidden on Print) */}
        <div className="print:hidden">
          <Link
            href="/tenants"
            className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            ← Back to All Tenants
          </Link>
        </div>

        {/* 360-Degree Profile View Component */}
        <TenantProfileView
          tenantView={tenantView}
          ledgers={tenantLedgers}
          payments={payments}
          complaints={tenantComplaints}
          maintenanceExpenseMap={maintenanceExpenseMap}
          electricityInfo={electricityInfo}
        />
      </div>
    </main>
  );
}
