import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import { getAllUnits } from "@/lib/units/service";
import { getTenantsWithLeases } from "@/lib/tenants/service";
import { getMonthlyLedgers, normalizeBillingMonth } from "@/lib/ledgers/service";
import { getPaymentsForConnection } from "@/lib/payments/service";
import { getAllComplaints } from "@/lib/complaints/service";
import { getUnitAllocatedElectricityBill } from "@/lib/electricity/service";
import UnitDetailView from "@/components/units/UnitDetailView";

export const dynamic = "force-dynamic";

export default async function UnitDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const sParams = await searchParams;
  const currentMonth = normalizeBillingMonth(sParams.month);

  // 1. Fetch all units and find target unit
  const { units } = await getAllUnits();
  const decodedId = decodeURIComponent(id).trim().toLowerCase();
  const unit = units.find(
    (u) =>
      u.id.toString() === id ||
      u.unit_number.toLowerCase() === decodedId ||
      u.unit_name.toLowerCase() === decodedId ||
      u.unit_number.toLowerCase().replace(/[^a-z0-9]/g, "") === decodedId.replace(/[^a-z0-9]/g, "")
  ) || units[0];

  if (!unit) {
    notFound();
  }

  // 2. Fetch Tenant Lease View for this unit
  const { tenants } = await getTenantsWithLeases();
  const tenantView = tenants.find((t) => t.unit?.id.toString() === unit.id.toString()) || null;

  // 3. Parallel fetch of Ledgers, Electricity Info, Payments, and Complaints
  const { getConnectionsWithMappings } = await import("@/lib/electricity/service");
  const [
    { items: allLedgers },
    electricityAlloc,
    { complaints: allComplaints },
    allConnections,
  ] = await Promise.all([
    getMonthlyLedgers(currentMonth),
    getUnitAllocatedElectricityBill(unit.id, currentMonth),
    getAllComplaints(),
    getConnectionsWithMappings(),
  ]);

  const historyLedgers = allLedgers.filter((l) => l.unit_id?.toString() === unit.id.toString());

  // Connection info
  const matchingConn = allConnections.find((c) =>
    c.mappings.some((m) => m.unit_id.toString() === unit.id.toString())
  );
  const matchedMapping = matchingConn?.mappings.find((m) => m.unit_id.toString() === unit.id.toString());
  const connectionId = matchingConn?.id || tenantView?.connection_id || unit.id;
  const hasMeter = Boolean(matchingConn || electricityAlloc?.connection_reference);

  // Fetch payments
  const payments = await getPaymentsForConnection(connectionId);

  // Fetch unit complaints
  const complaints = allComplaints.filter(
    (c) => c.unit_id?.toString() === unit.id.toString() || (tenantView && c.tenant_id?.toString() === tenantView.tenant.id.toString())
  );

  const electricityProp = hasMeter ? {
    connection_id: matchingConn?.id || connectionId,
    reference_number: matchingConn?.reference_number || electricityAlloc?.connection_reference || "",
    meter_number: matchingConn?.meter_number || electricityAlloc?.meter_number || null,
    is_shared: Boolean(matchingConn?.is_shared || electricityAlloc?.is_shared),
    split_formula: matchingConn?.is_shared ? `${matchedMapping?.split_value || 50}% Split` : undefined,
    latest_bill: matchingConn?.latest_bill || (electricityAlloc?.bill_amount !== null ? {
      id: electricityAlloc?.latest_bill_id,
      billing_month: currentMonth,
      bill_amount: electricityAlloc?.bill_amount ?? electricityAlloc?.total_connection_bill ?? 5400,
      units_consumed: electricityAlloc?.units_consumed || 165,
      status: electricityAlloc?.bill_status || "unpaid",
      due_date: electricityAlloc?.due_date || "20 Aug 2026",
      bill_image_url: null,
    } : null),
  } : null;

  return (
    <div className="space-y-8">
      <UnitDetailView
        unit={unit}
        tenant={tenantView?.tenant || null}
        lease={tenantView?.lease || null}
        electricity={electricityProp}
        payments={payments}
        ledgers={historyLedgers}
        complaints={complaints}
      />
    </div>
  );
}
