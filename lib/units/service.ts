import { supabase } from "@/lib/supabase/server";
import { resetTenantsMemory } from "@/lib/tenants/service";
import { resetGeneralExpensesMemory } from "@/lib/expenses/service";
import { resetComplaintsMemory } from "@/lib/complaints/service";
import { resetComplaintExpensesMemory } from "@/lib/complaints/expenses-service";
import { resetElectricityMemory } from "@/lib/electricity/service";

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

let dynamicPlazaMemory: PlazaItem = {
  id: 1,
  name: "My Commercial Plaza",
  address: "",
  description: "",
  floors: [],
  active: true,
};

// Flexible in-memory units array
let fallbackUnitsMemory: UnitItem[] = [];

export function resetUnitsMemory(): void {
  fallbackUnitsMemory = [];
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

  // 2. Wipe in-memory fallback state in all modules
  fallbackUnitsMemory = [];
  resetTenantsMemory();
  resetGeneralExpensesMemory();
  resetComplaintsMemory();
  resetComplaintExpensesMemory();
  resetElectricityMemory();

  // 3. Update plaza profile if options provided
  dynamicPlazaMemory = {
    id: plaza.id,
    name: options?.name?.trim() || "My Commercial Plaza",
    address: options?.address?.trim() || "",
    description: "",
    floors: options?.floors || [],
    active: true,
  };

  try {
    await supabase.from("plazas").upsert({
      id: plaza.id,
      name: dynamicPlazaMemory.name,
      location: dynamicPlazaMemory.address,
      description: dynamicPlazaMemory.description,
      floors: dynamicPlazaMemory.floors,
      active: true,
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
  try {
    const { data: plaza, error } = await supabase
      .from("plazas")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!error && plaza) {
      return {
        ...plaza,
        floors: plaza.floors || dynamicPlazaMemory.floors || [],
      };
    }
  } catch {
    // Non-blocking
  }

  return dynamicPlazaMemory;
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
  const updated: PlazaItem = {
    ...plaza,
    name: data.name.trim() || plaza.name,
    address: data.address?.trim() || plaza.address,
    description: data.description?.trim() || plaza.description,
    floors: data.floors && data.floors.length > 0 ? data.floors : plaza.floors,
  };

  try {
    await supabase.from("plazas").upsert({
      id: plaza.id,
      name: updated.name,
      location: updated.address,
      description: updated.description,
      floors: updated.floors,
      active: true,
    });
  } catch {
    // Fallback
  }

  dynamicPlazaMemory = updated;
  return updated;
}

/**
 * Bulk creates or reconfigures units for a plaza (clearing all previous plaza data if replaceExisting is true)
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
  replaceExisting: boolean = false
): Promise<{ count: number }> {
  if (replaceExisting) {
    await resetAllPlazaData();
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

  fallbackUnitsMemory = [...fallbackUnitsMemory, ...created];
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

  let unitsList: UnitItem[] = [];

  try {
    const { data: units, error } = await supabase
      .from("units")
      .select("*")
      .order("floor", { ascending: true })
      .order("unit_number", { ascending: true });

    if (!error && units) {
      unitsList = units as UnitItem[];
    } else {
      unitsList = [...fallbackUnitsMemory];
    }
  } catch {
    unitsList = [...fallbackUnitsMemory];
  }

  // Calculate stats
  const totalUnits = unitsList.length;
  const totalShops = unitsList.filter((u) => u.unit_type === "SHOP").length;
  const totalRooms = unitsList.filter((u) => u.unit_type === "ROOM").length;
  const occupiedCount = unitsList.filter((u) => u.status === "OCCUPIED").length;
  const vacantCount = unitsList.filter((u) => u.status === "VACANT").length;
  const inactiveCount = unitsList.filter((u) => u.status === "INACTIVE").length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedCount / totalUnits) * 100) : 0;

  return {
    units: unitsList,
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
    fallbackUnitsMemory = [createdUnit, ...fallbackUnitsMemory];
  }

  // Handle electricity linking
  if (data.electricity && data.electricity.option !== "NO_METER") {
    await configureUnitElectricity(createdUnit.id, data.electricity, createdUnit.unit_name);
  }

  return createdUnit;
}

/**
 * Updates an existing unit
 */
export async function updateUnit(
  id: number | string,
  data: Partial<UnitItem>
): Promise<UnitItem | null> {
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
      return updated as UnitItem;
    }
  } catch {
    // Non-blocking
  }

  const idx = fallbackUnitsMemory.findIndex((u) => u.id.toString() === id.toString());
  if (idx !== -1) {
    fallbackUnitsMemory[idx] = { ...fallbackUnitsMemory[idx], ...data };
    return fallbackUnitsMemory[idx];
  }

  return null;
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

  fallbackUnitsMemory = fallbackUnitsMemory.filter((u) => u.id.toString() !== id.toString());
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
