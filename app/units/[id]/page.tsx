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
  const [
    { items: allLedgers },
    electricityAlloc,
    { complaints: allComplaints },
    { data: mappings },
  ] = await Promise.all([
    getMonthlyLedgers(currentMonth),
    getUnitAllocatedElectricityBill(unit.id, currentMonth),
    getAllComplaints(),
    supabase.from("connection_unit_mappings").select("*, connections(*)").eq("unit_id", unit.id),
  ]);

  const historyLedgers = allLedgers.filter((l) => l.unit_id?.toString() === unit.id.toString());

  // Connection info
  const connMap = mappings && mappings.length > 0 ? (mappings[0] as any) : null;
  const connection = connMap?.connections;
  const connectionId = connection?.id || tenantView?.connection_id || unit.id;

  // Fetch payments
  const payments = await getPaymentsForConnection(connectionId);

  // Fetch unit complaints
  const complaints = allComplaints.filter(
    (c) => c.unit_id?.toString() === unit.id.toString() || (tenantView && c.tenant_id?.toString() === tenantView.tenant.id.toString())
  );

  // Fetch latest bill
  const { data: latestBill } = await supabase
    .from("bills")
    .select("id, billing_month, bill_amount, due_date, status, bill_image_url, units_consumed")
    .eq("connection_id", connectionId)
    .order("billing_month", { ascending: false })
    .limit(1)
    .maybeSingle();

  const electricityProp = (electricityAlloc?.connection_reference || connection?.reference_number) ? {
    connection_id: connectionId,
    reference_number: electricityAlloc?.connection_reference || connection?.reference_number || "",
    meter_number: electricityAlloc?.meter_number || connection?.meter_number || null,
    is_shared: Boolean(electricityAlloc?.is_shared || (connMap && connMap.split_value < 100)),
    split_formula: electricityAlloc?.is_shared ? `${connMap?.split_value || 50}% Split` : undefined,
    latest_bill: latestBill ? {
      id: latestBill.id,
      billing_month: latestBill.billing_month,
      bill_amount: electricityAlloc?.bill_amount ?? electricityAlloc?.total_connection_bill ?? latestBill.bill_amount ?? 0,
      units_consumed: latestBill.units_consumed || 165,
      status: latestBill.status,
      due_date: latestBill.due_date,
      bill_image_url: latestBill.bill_image_url,
    } : null,
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
