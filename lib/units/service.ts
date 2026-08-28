import { supabase } from "@/lib/supabase/server";
import { resetTenantsMemory } from "@/lib/tenants/service";
import { resetGeneralExpensesMemory } from "@/lib/expenses/service";
import { resetComplaintsMemory } from "@/lib/complaints/service";
import { resetComplaintExpensesMemory } from "@/lib/complaints/expenses-service";
import { resetElectricityMemory } from "@/lib/electricity/service";
import { getStore, updateStore } from "@/lib/storage/fileStore";
import { logActivity } from "@/lib/logs/service";

export interface UnitItem {
  id: number | string;
  plaza_id: number | string;
  unit_number: string;
  unit_name: string;
  unit_type: "SHOP" | "ROOM" | "OTHER";
  floor: string;
  default_monthly_rent: number;
  default_security_amount: number;
  default_rent_due_day: number;
  status: "OCCUPIED" | "VACANT" | "INACTIVE";
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  tenant_name?: string;
  tenant_id?: number | string;
  lease_id?: number | string;
  reference_number?: string;
  meter_number?: string;
}

export interface PlazaItem {
  id: number | string;
  name: string;
  address?: string | null;
  description?: string | null;
  floors?: string[];
  active: boolean;
}

export interface UnitStats {
  totalUnits: number;
  totalShops: number;
  totalRooms: number;
  occupiedCount: number;
  vacantCount: number;
  inactiveCount: number;
  occupancyRate: number;
}

export interface UnitElectricitySetup {
  option: "OWN_METER" | "SHARED_METER" | "NO_METER";
  referenceNumber?: string;
  meterNumber?: string;
  sharedConnectionId?: number | string;
  splitType?: "EQUAL" | "PERCENTAGE";
  splitValue?: number;
}

export function resetUnitsMemory(): void {
  updateStore((s) => {
    s.units = [];
  });
}

/**
 * Resets all plaza data across all modules (Units, Tenants, Leases, Ledgers, Meters, Dues, Expenses, Complaints)
 */
export async function resetAllPlazaData(options?: {
  name?: string;
  address?: string;
  floors?: string[];
}): Promise<void> {
  const plaza = await getPrimaryPlaza();

  // 1. Delete all records from Supabase in reverse dependency order
  try {
    await supabase.from("payments").delete().neq("id", 0);
  } catch {}
  try {
    await supabase.from("complaint_expenses").delete().neq("id", 0);
  } catch {}
  try {
    await supabase.from("complaints").delete().neq("id", 0);
  } catch {}
  try {
    await supabase.from("tenant_accounts").delete().neq("id", 0);
  } catch {}
  try {
    await supabase.from("tenant_monthly_ledgers").delete().neq("id", 0);
  } catch {}
  try {
    await supabase.from("leases").delete().neq("id", 0);
  } catch {}
  try {
    await supabase.from("tenants").delete().neq("id", 0);
  } catch {}
  try {
    await supabase.from("connection_unit_mappings").delete().neq("id", 0);
  } catch {}
  try {
    await supabase.from("bills").delete().neq("id", 0);
  } catch {}
  try {
    await supabase.from("connections").delete().neq("id", 0);
  } catch {}
  try {
    await supabase.from("expenses").delete().neq("id", 0);
  } catch {}
  try {
    await supabase.from("units").delete().neq("id", 0);
  } catch {}

  // 2. Wipe store and reset in all modules
  updateStore((s) => {
    s.units = [];
    s.tenants = [];
    s.leases = [];
    s.connections = [];
    s.connection_unit_mappings = [];
    s.bills = [];
    s.payments = [];
    s.expenses = [];
    s.complaints = [];
    s.complaint_expenses = [];
    s.plaza = {
      id: plaza.id,
      name: options?.name?.trim() || "",
      address: options?.address?.trim() || "",
      description: "",
      floors: options?.floors || [],
      active: Boolean(options?.name && options?.floors && options.floors.length > 0),
    };
  });

  resetTenantsMemory();
  resetGeneralExpensesMemory();
  resetComplaintsMemory();
  resetComplaintExpensesMemory();
  resetElectricityMemory();

  try {
    const store = getStore();
    await supabase.from("plazas").upsert({
      id: plaza.id,
      name: store.plaza.name,
      location: store.plaza.address,
      description: store.plaza.description,
      floors: store.plaza.floors,
      active: store.plaza.active,
    });
  } catch {}
}

/**
 * Returns baseline smart suggestions for unit pricing
 */
export function getUnitPricingDefaults(unitType: string, floor: string = "Ground"): {
  suggestedRent: number;
  suggestedSecurity: number;
  suggestedDueDay: number;
  suggestedFloor: string;
} {
  const isRoom = unitType.toUpperCase() === "ROOM";

  if (isRoom) {
    return {
      suggestedRent: 8500,
      suggestedSecurity: 10000,
      suggestedDueDay: 5,
      suggestedFloor: floor || "Residential Flats",
    };
  }

  const lowerFloor = floor.toLowerCase();
  let rent = 28000;
  if (lowerFloor.includes("ground") || lowerFloor.includes("middle")) {
    rent = 30000;
  } else if (lowerFloor.includes("basement")) {
    rent = 28000;
  } else if (lowerFloor.includes("1st") || lowerFloor.includes("first")) {
    rent = 28000;
  }

  return {
    suggestedRent: rent,
    suggestedSecurity: 50000,
    suggestedDueDay: 5,
    suggestedFloor: floor || "Ground Floor",
  };
}

/**
 * Gets or initializes the primary plaza record
 */
export async function getPrimaryPlaza(): Promise<PlazaItem> {
  const store = getStore();
  if (store.plaza && store.plaza.name) {
    return store.plaza;
  }

  try {
    const { data: plaza, error } = await supabase
      .from("plazas")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && plaza && plaza.name) {
      const pItem: PlazaItem = {
        id: plaza.id,
        name: plaza.name,
        address: plaza.location || plaza.address || "",
        description: plaza.description || "",
        floors: Array.isArray(plaza.floors) ? plaza.floors : [],
        active: Boolean(plaza.name),
      };
      updateStore((s) => {
        s.plaza = pItem;
      });
      return pItem;
    }
  } catch {
    // Non-blocking
  }

  return store.plaza || {
    id: 1,
    name: "",
    address: "",
    description: "",
    floors: [],
    active: false,
  };
}

/**
 * Updates or configures the Plaza metadata & custom floors
 */
export async function savePlazaDetails(data: {
  name: string;
  address?: string;
  description?: string;
  floors?: string[];
}): Promise<PlazaItem> {
  const plaza = await getPrimaryPlaza();
  const trimmedName = data.name.trim();
  const validFloors = data.floors && data.floors.length > 0 ? data.floors : plaza.floors || [];
  const isNowActive = Boolean(trimmedName && validFloors.length > 0);

  const updated: PlazaItem = {
    id: plaza.id || 1,
    name: trimmedName || plaza.name,
    address: data.address !== undefined ? data.address.trim() : plaza.address,
    description: data.description !== undefined ? data.description.trim() : plaza.description,
    floors: validFloors,
    active: isNowActive,
  };

  updateStore((s) => {
    s.plaza = updated;
  });

  try {
    await supabase.from("plazas").upsert({
      id: updated.id,
      name: updated.name,
      location: updated.address,
      description: updated.description,
      floors: updated.floors,
      active: updated.active,
    });
  } catch {
    // Fallback
  }

  return updated;
}

/**
 * Bulk creates or reconfigures units for a plaza
 */
export async function bulkConfigurePlazaUnits(
  unitsData: Array<{
    unit_number: string;
    unit_name: string;
    unit_type: "SHOP" | "ROOM" | "OTHER";
    floor: string;
    default_monthly_rent: number;
    default_security_amount: number;
    default_rent_due_day?: number;
  }>,
  replaceExisting: boolean = false,
  plazaMetadata?: {
    name?: string;
    address?: string;
    floors?: string[];
  }
): Promise<{ count: number }> {
  const currentPlaza = await getPrimaryPlaza();
  const activeName = plazaMetadata?.name?.trim() || currentPlaza.name;
  const activeAddress = plazaMetadata?.address?.trim() || currentPlaza.address || undefined;
  const activeFloors = plazaMetadata?.floors || currentPlaza.floors || undefined;

  if (replaceExisting) {
    await resetAllPlazaData({
      name: activeName,
      address: activeAddress,
      floors: activeFloors,
    });
  } else if (plazaMetadata && plazaMetadata.name) {
    await savePlazaDetails({
      name: activeName,
      address: activeAddress,
      floors: activeFloors,
    });
  }

  const plaza = await getPrimaryPlaza();
  let nextId = Date.now();
  const created: UnitItem[] = [];

  for (const u of unitsData) {
    const item: UnitItem = {
      id: nextId++,
      plaza_id: plaza.id,
      unit_number: u.unit_number.trim(),
      unit_name: u.unit_name.trim(),
      unit_type: u.unit_type,
      floor: u.floor.trim(),
      default_monthly_rent: Number(u.default_monthly_rent) || 0,
      default_security_amount: Number(u.default_security_amount) || 0,
      default_rent_due_day: u.default_rent_due_day || 5,
      status: "VACANT",
      created_at: new Date().toISOString(),
    };

    try {
      const { data: dbItem } = await supabase.from("units").insert({
        plaza_id: plaza.id,
        unit_number: item.unit_number,
        unit_name: item.unit_name,
        unit_type: item.unit_type,
        floor: item.floor,
        default_monthly_rent: item.default_monthly_rent,
        default_security_amount: item.default_security_amount,
        default_rent_due_day: item.default_rent_due_day,
        status: "VACANT",
      }).select().maybeSingle();

      if (dbItem) {
        created.push(dbItem);
        continue;
      }
    } catch {
      // Fallback
    }

    created.push(item);
  }

  updateStore((s) => {
    s.units = [...s.units, ...created];
  });

  logActivity({
    category: "PLAZA",
    action: replaceExisting ? "PLAZA_REBUILT" : "PLAZA_CONFIGURED",
    title: replaceExisting ? "Plaza Rebuilt & Configured" : "Plaza Units Configured",
    description: `Configured ${created.length} units for ${activeName || "Plaza"}.`,
    metadata: { unitCount: created.length, plazaName: activeName },
    href: "/units",
  });

  return { count: created.length };
}

/**
 * Retrieves all units with statistics and filtering
 */
export async function getAllUnits(): Promise<{
  units: UnitItem[];
  plaza: PlazaItem;
  stats: UnitStats;
}> {
  const plaza = await getPrimaryPlaza();
  const store = getStore();

  let unitsList: UnitItem[] = store.units || [];
  let rawLeases: any[] = store.leases || [];
  let rawTenants: any[] = store.tenants || [];

  try {
    const [unitsRes, leasesRes, tenantsRes] = await Promise.all([
      supabase
        .from("units")
        .select("*")
        .order("floor", { ascending: true })
        .order("unit_number", { ascending: true }),
      supabase
        .from("leases")
        .select("*")
        .eq("status", "ACTIVE"),
      supabase
        .from("tenants")
        .select("*"),
    ]);

    if (!unitsRes.error && unitsRes.data && unitsRes.data.length > 0) {
      unitsList = unitsRes.data as UnitItem[];
    }
    if (!leasesRes.error && leasesRes.data && leasesRes.data.length > 0) {
      rawLeases = leasesRes.data;
    }
    if (!tenantsRes.error && tenantsRes.data && tenantsRes.data.length > 0) {
      rawTenants = tenantsRes.data;
    }
  } catch {}

  const tenantMap = new Map<string, any>();
  rawTenants.forEach((t) => tenantMap.set(t.id.toString(), t));

  const leaseByUnit = new Map<string, any>();
  rawLeases.forEach((l) => {
    if (l.status === "ACTIVE") {
      leaseByUnit.set(l.unit_id.toString(), l);
    }
  });

  const storeData = getStore();
  const connMap = new Map<string, any>();
  (storeData.connection_unit_mappings || []).forEach((m) => {
    const c = (storeData.connections || []).find((cn) => cn.id.toString() === m.connection_id.toString());
    if (c) connMap.set(m.unit_id.toString(), c);
  });

  const enrichedUnits: UnitItem[] = unitsList.map((u) => {
    const activeLease = leaseByUnit.get(u.id.toString());
    const tenant = activeLease ? tenantMap.get(activeLease.tenant_id.toString()) : null;
    const isOccupied = Boolean(activeLease || u.status === "OCCUPIED");
    const conn = connMap.get(u.id.toString());

    return {
      ...u,
      status: isOccupied ? ("OCCUPIED" as const) : u.status,
      tenant_name: tenant ? tenant.full_name : (u as any).tenant_name || (isOccupied ? "Active Tenant" : undefined),
      tenant_id: tenant?.id,
      lease_id: activeLease?.id,
      monthly_rent: activeLease?.monthly_rent || u.default_monthly_rent,
      reference_number: conn?.reference_number || (u as any).reference_number,
      meter_number: conn?.meter_number || (u as any).meter_number,
    } as any;
  });

  // Calculate stats
  const totalUnits = enrichedUnits.length;
  const totalShops = enrichedUnits.filter((u) => u.unit_type === "SHOP").length;
  const totalRooms = enrichedUnits.filter((u) => u.unit_type === "ROOM").length;
  const occupiedCount = enrichedUnits.filter((u) => u.status === "OCCUPIED").length;
  const vacantCount = enrichedUnits.filter((u) => u.status === "VACANT").length;
  const inactiveCount = enrichedUnits.filter((u) => u.status === "INACTIVE").length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedCount / totalUnits) * 100) : 0;

  return {
    units: enrichedUnits,
    plaza,
    stats: {
      totalUnits,
      totalShops,
      totalRooms,
      occupiedCount,
      vacantCount,
      inactiveCount,
      occupancyRate,
    },
  };
}

/**
 * Creates a new physical unit in the plaza and automatically handles electricity linking
 */
export async function createUnit(data: {
  plazaId?: number | string;
  unitNumber: string;
  unitName: string;
  unitType: "SHOP" | "ROOM" | "OTHER";
  floor: string;
  defaultMonthlyRent: number;
  defaultSecurityAmount: number;
  defaultRentDueDay?: number;
  status?: "OCCUPIED" | "VACANT" | "INACTIVE";
  notes?: string | null;
  electricity?: UnitElectricitySetup;
}): Promise<UnitItem> {
  const plaza = await getPrimaryPlaza();
  const plazaId = data.plazaId || plaza.id;

  let createdUnit: UnitItem | null = null;

  try {
    const { data: newUnit, error } = await supabase
      .from("units")
      .insert({
        plaza_id: plazaId,
        unit_number: data.unitNumber.trim(),
        unit_name: data.unitName.trim(),
        unit_type: data.unitType,
        floor: data.floor.trim(),
        default_monthly_rent: data.defaultMonthlyRent,
        default_security_amount: data.defaultSecurityAmount,
        default_rent_due_day: data.defaultRentDueDay || 5,
        status: data.status || "VACANT",
        notes: data.notes?.trim() || null,
      })
      .select()
      .maybeSingle();

    if (!error && newUnit) {
      createdUnit = newUnit as UnitItem;
    }
  } catch {
    // Non-blocking
  }

  if (!createdUnit) {
    createdUnit = {
      id: Date.now(),
      plaza_id: plazaId,
      unit_number: data.unitNumber.trim(),
      unit_name: data.unitName.trim(),
      unit_type: data.unitType,
      floor: data.floor.trim(),
      default_monthly_rent: data.defaultMonthlyRent,
      default_security_amount: data.defaultSecurityAmount,
      default_rent_due_day: data.defaultRentDueDay || 5,
      status: data.status || "VACANT",
      notes: data.notes?.trim() || null,
      created_at: new Date().toISOString(),
    };
  }

  updateStore((s) => {
    s.units = [createdUnit!, ...s.units.filter((u) => u.id.toString() !== createdUnit!.id.toString())];
  });

  // Handle electricity linking
  if (data.electricity && data.electricity.option !== "NO_METER") {
    await configureUnitElectricity(createdUnit.id, data.electricity, createdUnit.unit_name);
  }

  logActivity({
    category: "UNITS",
    action: "UNIT_CREATED",
    title: "New Unit Created",
    description: `Added unit ${createdUnit.unit_number} (${createdUnit.unit_name}) on ${createdUnit.floor}.`,
    metadata: { unitId: createdUnit.id, unitNumber: createdUnit.unit_number, floor: createdUnit.floor },
    href: `/units/${createdUnit.unit_number}`,
  });

  return createdUnit;
}

/**
 * Updates an existing unit
 */
export async function updateUnit(
  id: number | string,
  data: Partial<UnitItem>
): Promise<UnitItem | null> {
  let result: UnitItem | null = null;

  // 1. Immediately update file store to ensure all fields persist
  updateStore((s) => {
    const idx = s.units.findIndex((u) => u.id.toString() === id.toString());
    if (idx !== -1) {
      s.units[idx] = { ...s.units[idx], ...data };
      result = s.units[idx];
    }
  });

  // 2. Sync to Supabase
  try {
    const { data: updated, error } = await supabase
      .from("units")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (!error && updated) {
      updateStore((s) => {
        const idx = s.units.findIndex((u) => u.id.toString() === id.toString());
        if (idx !== -1) s.units[idx] = { ...s.units[idx], ...data, ...updated };
      });
      return { ...result, ...updated } as UnitItem;
    }
  } catch {
    // Non-blocking
  }

  return result;
}

/**
 * Deletes a physical unit
 */
export async function deleteUnit(id: number | string): Promise<boolean> {
  try {
    await supabase.from("units").delete().eq("id", id);
  } catch {
    // Non-blocking
  }

  updateStore((s) => {
    s.units = s.units.filter((u) => u.id.toString() !== id.toString());
  });

  logActivity({
    category: "UNITS",
    action: "UNIT_DELETED",
    title: "Unit Removed",
    description: `Deleted unit record #${id}.`,
    metadata: { unitId: id },
    href: "/units",
  });

  return true;
}

/**
 * Configures dedicated or shared electricity linking for a unit
 */
export async function configureUnitElectricity(
  unitId: number | string,
  electricity: UnitElectricitySetup,
  unitName?: string
): Promise<void> {
  if (electricity.option === "NO_METER") {
    try {
      await supabase.from("connection_unit_mappings").delete().eq("unit_id", unitId);
    } catch {}
    return;
  }

  let connectionId: number | string | null = null;

  if (electricity.option === "OWN_METER" && electricity.referenceNumber) {
    try {
      const { data: existingConn } = await supabase
        .from("connections")
        .select("id")
        .eq("reference_number", electricity.referenceNumber.trim())
        .maybeSingle();

      if (existingConn) {
        connectionId = existingConn.id;
      } else {
        const { data: newConn } = await supabase
          .from("connections")
          .insert({
            reference_number: electricity.referenceNumber.trim(),
            name: `${unitName || "Unit"} Meter`,
            meter_number: electricity.meterNumber?.trim() || null,
            active: true,
          })
          .select()
          .maybeSingle();

        if (newConn) {
          connectionId = newConn.id;
        }
      }
    } catch {}
  } else if (electricity.option === "SHARED_METER" && electricity.sharedConnectionId) {
    connectionId = electricity.sharedConnectionId;
  }

  if (connectionId) {
    try {
      await supabase.from("connection_unit_mappings").upsert({
        connection_id: connectionId,
        unit_id: unitId,
        split_type: electricity.splitType || "PERCENTAGE",
        split_value: electricity.splitValue || 50,
        notes: `Mapped for unit #${unitId}`,
      });
    } catch {}
  }
}
