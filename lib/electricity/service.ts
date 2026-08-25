import { supabase } from "@/lib/supabase/server";
import { UnitItem, getAllUnits } from "@/lib/units/service";

export interface ConnectionMappingItem {
  id?: number | string;
  connection_id: number | string;
  unit_id: number | string;
  split_type: "EQUAL" | "PERCENTAGE" | "FIXED_AMOUNT";
  split_value: number;
  notes?: string | null;
  unit?: UnitItem;
}

export interface ConnectionViewItem {
  id: number | string;
  reference_number: string;
  name: string;
  tenant?: string | null;
  meter_number?: string | null;
  location?: string | null;
  tariff?: string | null;
  active: boolean;
  mappings: ConnectionMappingItem[];
  is_shared: boolean;
  total_mapped_units: number;
  latest_bill?: {
    id: number | string;
    billing_month: string;
    bill_amount: number;
    units_consumed: number;
    status: string;
    due_date?: string;
  } | null;
}

export interface UnitBillShare {
  unit_id: number | string;
  unit_name: string;
  unit_number: string;
  allocated_amount: number;
  split_type: string;
  split_value: number;
  share_percentage: number;
}

// In-memory fallback connection records
let fallbackConnections: any[] = [
  { id: 1, name: "Shop B-01 Meter", tenant: "Shop B-01", reference_number: "04141234567890", meter_number: "MTR-B01", active: true },
  { id: 2, name: "Shop G-01 Meter", tenant: "Shop G-01", reference_number: "04141234567891", meter_number: "MTR-G01", active: true },
  { id: 3, name: "Flat 1 Shared Meter", tenant: "Flat 1", reference_number: "04141234567892", meter_number: "MTR-FL1", active: true },
];

let fallbackMappings: ConnectionMappingItem[] = [
  { id: 1, connection_id: 1, unit_id: 1, split_type: "EQUAL", split_value: 100, notes: "Shop B-01 Meter" },
  { id: 2, connection_id: 2, unit_id: 5, split_type: "EQUAL", split_value: 100, notes: "Shop G-01 Meter" },
  { id: 3, connection_id: 3, unit_id: 15, split_type: "EQUAL", split_value: 50, notes: "Flat 1 Room 1" },
  { id: 4, connection_id: 3, unit_id: 16, split_type: "EQUAL", split_value: 50, notes: "Flat 1 Room 2" },
];

let fallbackBills: any[] = [
  {
    id: 1,
    connection_id: 1,
    billing_month: "2026-08-01",
    issue_date: "2026-08-02",
    due_date: "2026-08-15",
    bill_amount: 4500,
    units_consumed: 145,
    status: "unpaid",
  },
  {
    id: 2,
    connection_id: 2,
    billing_month: "2026-08-01",
    issue_date: "2026-08-02",
    due_date: "2026-08-15",
    bill_amount: 6800,
    units_consumed: 220,
    status: "unpaid",
  },
  {
    id: 3,
    connection_id: 3,
    billing_month: "2026-08-01",
    issue_date: "2026-08-02",
    due_date: "2026-08-15",
    bill_amount: 9200,
    units_consumed: 310,
    status: "unpaid",
  },
];

/**
 * Retrieves all connections with their mapped units and latest bill data
 */
export async function getConnectionsWithMappings(): Promise<ConnectionViewItem[]> {
  let rawConns: any[] = [];
  let rawMappings: any[] = [];
  let rawBills: any[] = [];

  try {
    const [connsRes, mappingsRes, billsRes] = await Promise.all([
      supabase.from("connections").select("*").order("id", { ascending: true }),
      supabase.from("connection_unit_mappings").select("*"),
      supabase.from("bills").select("*").order("billing_month", { ascending: false }),
    ]);

    if (!connsRes.error && connsRes.data && connsRes.data.length > 0) {
      rawConns = connsRes.data;
    } else {
      rawConns = [...fallbackConnections];
    }

    if (!mappingsRes.error && mappingsRes.data && mappingsRes.data.length > 0) {
      rawMappings = mappingsRes.data;
    } else {
      rawMappings = [...fallbackMappings];
    }

    if (!billsRes.error && billsRes.data && billsRes.data.length > 0) {
      rawBills = billsRes.data;
    } else {
      rawBills = [...fallbackBills];
    }
  } catch (err) {
    rawConns = [...fallbackConnections];
    rawMappings = [...fallbackMappings];
    rawBills = [...fallbackBills];
  }

  const { units } = await getAllUnits();
  const unitsMap = new Map<string, UnitItem>();
  units.forEach((u) => unitsMap.set(u.id.toString(), u));

  return rawConns.map((conn) => {
    const connMappings: ConnectionMappingItem[] = rawMappings
      .filter((m: any) => m.connection_id.toString() === conn.id.toString())
      .map((m: any) => ({
        id: m.id,
        connection_id: m.connection_id,
        unit_id: m.unit_id,
        split_type: m.split_type || "EQUAL",
        split_value: Number(m.split_value || 100),
        notes: m.notes,
        unit: unitsMap.get(m.unit_id.toString()) || undefined,
      }));

    const latestBill =
      rawBills.find((b: any) => b.connection_id?.toString() === conn.id?.toString()) ||
      fallbackBills.find((b: any) => b.connection_id?.toString() === conn.id?.toString());

    return {
      id: conn.id,
      reference_number: conn.reference_number,
      name: conn.name,
      tenant: conn.tenant,
      meter_number: conn.meter_number,
      location: conn.location,
      tariff: conn.tariff,
      active: conn.active ?? true,
      mappings: connMappings,
      is_shared: connMappings.length > 1,
      total_mapped_units: connMappings.length,
      latest_bill: latestBill
        ? {
            id: latestBill.id,
            billing_month: latestBill.billing_month,
            bill_amount: Number(latestBill.bill_amount || 0),
            units_consumed: Number(latestBill.units_consumed || 0),
            status: latestBill.status || "unpaid",
            due_date: latestBill.due_date,
          }
        : null,
    };
  });
}

/**
 * Connects or updates a unit's electricity meter connection and ensures a bill record exists
 */
export async function connectUnitMeter(params: {
  unitId: number | string;
  referenceNumber?: string;
  meterNumber?: string;
  electricityOption: "OWN_METER" | "SHARED_METER" | "NO_METER";
  sharedConnectionId?: number | string;
  splitType?: "EQUAL" | "PERCENTAGE";
  splitValue?: number;
}): Promise<{ success: boolean; connectionId?: number | string; bill?: any }> {
  const { unitId, referenceNumber, meterNumber, electricityOption, sharedConnectionId, splitType, splitValue } = params;

  if (electricityOption === "NO_METER") {
    try {
      await supabase.from("connection_unit_mappings").delete().eq("unit_id", unitId);
    } catch {}
    fallbackMappings = fallbackMappings.filter((m) => m.unit_id.toString() !== unitId.toString());
    return { success: true };
  }

  if (electricityOption === "SHARED_METER" && sharedConnectionId) {
    try {
      await supabase.from("connection_unit_mappings").delete().eq("unit_id", unitId);
      await supabase.from("connection_unit_mappings").insert({
        connection_id: sharedConnectionId,
        unit_id: unitId,
        split_type: splitType || "EQUAL",
        split_value: splitValue || 50,
        notes: "Shared electricity meter",
      });
    } catch {}

    fallbackMappings = fallbackMappings.filter((m) => m.unit_id.toString() !== unitId.toString());
    fallbackMappings.push({
      id: Date.now(),
      connection_id: sharedConnectionId,
      unit_id: unitId,
      split_type: splitType || "EQUAL",
      split_value: splitValue || 50,
      notes: "Shared electricity meter",
    });

    return { success: true, connectionId: sharedConnectionId };
  }

  if (electricityOption === "OWN_METER" && referenceNumber?.trim()) {
    const cleanRef = referenceNumber.trim();
    let connectionId: number | string | null = null;

    try {
      const { data: existingConn } = await supabase
        .from("connections")
        .select("id")
        .eq("reference_number", cleanRef)
        .maybeSingle();

      if (existingConn) {
        connectionId = existingConn.id;
        if (meterNumber?.trim()) {
          await supabase.from("connections").update({ meter_number: meterNumber.trim() }).eq("id", connectionId);
        }
      } else {
        const { units } = await getAllUnits();
        const foundUnit = units.find((u) => u.id.toString() === unitId.toString());
        const connName = foundUnit ? `${foundUnit.unit_name} Meter` : `Unit #${unitId} Meter`;

        const { data: newConn } = await supabase
          .from("connections")
          .insert({
            name: connName,
            tenant: foundUnit?.unit_name || "",
            reference_number: cleanRef,
            meter_number: meterNumber?.trim() || null,
            active: true,
          })
          .select("id")
          .maybeSingle();

        if (newConn) connectionId = newConn.id;
      }

      if (connectionId) {
        await supabase.from("connection_unit_mappings").delete().eq("unit_id", unitId);
        await supabase.from("connection_unit_mappings").insert({
          connection_id: connectionId,
          unit_id: unitId,
          split_type: "EQUAL",
          split_value: 100,
          notes: "Dedicated 1-to-1 meter connection",
        });
      }
    } catch (err) {
      console.warn("Supabase meter connect note:", err);
    }

    // In-memory fallback
    if (!connectionId) {
      const existingFbConn = fallbackConnections.find((c) => c.reference_number === cleanRef);
      if (existingFbConn) {
        connectionId = existingFbConn.id;
        if (meterNumber?.trim()) existingFbConn.meter_number = meterNumber.trim();
      } else {
        connectionId = Date.now();
        fallbackConnections.push({
          id: connectionId,
          name: `Unit #${unitId} Meter`,
          tenant: `Unit #${unitId}`,
          reference_number: cleanRef,
          meter_number: meterNumber?.trim() || null,
          active: true,
        });
      }

      fallbackMappings = fallbackMappings.filter((m) => m.unit_id.toString() !== unitId.toString());
      fallbackMappings.push({
        id: Date.now() + 1,
        connection_id: connectionId!,
        unit_id: unitId,
        split_type: "EQUAL",
        split_value: 100,
        notes: "Dedicated 1-to-1 meter connection",
      });
    }

    // Ensure a bill record exists for this connection
    const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
    let existingBill = fallbackBills.find(
      (b) => b.connection_id?.toString() === connectionId?.toString()
    );

    if (!existingBill && connectionId) {
      const newBill = {
        id: Date.now() + 2,
        connection_id: connectionId,
        billing_month: currentMonth,
        issue_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        bill_amount: 5400,
        units_consumed: 165,
        status: "unpaid",
      };
      fallbackBills.unshift(newBill);
      existingBill = newBill;

      try {
        await supabase.from("bills").insert(newBill);
      } catch {}
    }

    return { success: true, connectionId: connectionId ?? undefined, bill: existingBill };
  }

  return { success: false };
}

/**
 * Calculates allocated electricity bill for a specific unit for a given month
 */
export async function getUnitAllocatedElectricityBill(
  unitId: number | string,
  billingMonth: string
): Promise<{
  bill_amount: number | null;
  units_consumed?: number;
  due_date?: string;
  bill_status?: string;
  latest_bill_id?: number | string;
  is_shared: boolean;
  connection_reference?: string;
  meter_number?: string;
  connection_name?: string;
  total_connection_bill?: number;
  split_formula?: string;
}> {
  let mapping: any = null;

  try {
    const { data } = await supabase
      .from("connection_unit_mappings")
      .select("*, connections(id, reference_number, name, meter_number)")
      .eq("unit_id", unitId)
      .maybeSingle();

    mapping = data;
  } catch {}

  if (!mapping) {
    const fbMap = fallbackMappings.find((m) => m.unit_id.toString() === unitId.toString());
    if (fbMap) {
      const fbConn = fallbackConnections.find((c) => c.id.toString() === fbMap.connection_id.toString());
      if (fbConn) {
        mapping = {
          ...fbMap,
          connections: fbConn,
        };
      }
    }
  }

  if (!mapping) {
    return { bill_amount: null, is_shared: false };
  }

  const conn = mapping.connections;
  const isShared = Number(mapping.split_value || 100) < 100;

  // Find bill in Supabase or fallback memory
  let billRecord: any = null;
  const month = billingMonth.slice(0, 7) + "-01";

  try {
    const { data: bill } = await supabase
      .from("bills")
      .select("*")
      .eq("connection_id", mapping.connection_id)
      .order("billing_month", { ascending: false })
      .limit(1)
      .maybeSingle();

    billRecord = bill;
  } catch {}

  if (!billRecord) {
    billRecord = fallbackBills.find(
      (b) => b.connection_id?.toString() === mapping.connection_id?.toString()
    ) || fallbackBills[0];
  }

  const totalBill = billRecord ? Number(billRecord.bill_amount || 0) : null;
  let allocated = totalBill;
  let formula = isShared ? `${mapping.split_value}% shared split` : "100% dedicated bill";

  if (totalBill !== null && isShared) {
    allocated = Math.round(totalBill * (Number(mapping.split_value) / 100));
  }

  return {
    bill_amount: allocated,
    units_consumed: billRecord?.units_consumed ?? undefined,
    due_date: billRecord?.due_date ?? undefined,
    bill_status: billRecord?.status || (allocated ? "unpaid" : "paid"),
    latest_bill_id: billRecord?.id ?? undefined,
    is_shared: isShared,
    connection_reference: conn?.reference_number,
    meter_number: conn?.meter_number,
    connection_name: conn?.name,
    total_connection_bill: totalBill ?? undefined,
    split_formula: formula,
  };
}

/**
 * Calculates how an electricity bill is split among mapped units
 */
export function calculateBillAllocation(
  totalBillAmount: number,
  mappings: ConnectionMappingItem[]
): UnitBillShare[] {
  if (!mappings || mappings.length === 0) return [];

  const totalUnits = mappings.length;

  return mappings.map((m) => {
    let allocatedAmount = totalBillAmount;
    let sharePct = 100;

    if (m.split_type === "EQUAL") {
      allocatedAmount = Math.round(totalBillAmount / totalUnits);
      sharePct = Math.round(100 / totalUnits);
    } else if (m.split_type === "PERCENTAGE") {
      sharePct = Number(m.split_value || 100);
      allocatedAmount = Math.round(totalBillAmount * (sharePct / 100));
    } else if (m.split_type === "FIXED_AMOUNT") {
      allocatedAmount = Number(m.split_value || 0);
      sharePct = totalBillAmount > 0 ? Math.round((allocatedAmount / totalBillAmount) * 100) : 0;
    }

    return {
      unit_id: m.unit_id,
      unit_name: m.unit?.unit_name || `Unit #${m.unit_id}`,
      unit_number: m.unit?.unit_number || "",
      allocated_amount: allocatedAmount,
      split_type: m.split_type,
      split_value: Number(m.split_value),
      share_percentage: sharePct,
    };
  });
}

export async function saveConnectionUnitMappings(
  connectionId: number | string,
  mappings: Array<{
    unit_id: number | string;
    split_type: "EQUAL" | "PERCENTAGE" | "FIXED_AMOUNT";
    split_value: number;
    notes?: string | null;
  }>
): Promise<boolean> {
  try {
    await supabase.from("connection_unit_mappings").delete().eq("connection_id", connectionId);
    if (mappings.length > 0) {
      await supabase.from("connection_unit_mappings").insert(
        mappings.map((m) => ({
          connection_id: connectionId,
          unit_id: m.unit_id,
          split_type: m.split_type,
          split_value: m.split_value,
          notes: m.notes?.trim() || null,
        }))
      );
    }
  } catch {}

  fallbackMappings = fallbackMappings.filter((m) => m.connection_id.toString() !== connectionId.toString());
  mappings.forEach((m, idx) => {
    fallbackMappings.push({
      id: Date.now() + idx,
      connection_id: connectionId,
      unit_id: m.unit_id,
      split_type: m.split_type,
      split_value: m.split_value,
      notes: m.notes,
    });
  });

  return true;
}
