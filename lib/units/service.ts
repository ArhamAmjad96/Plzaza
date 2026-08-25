import { supabase } from "@/lib/supabase/server";

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
  name: "Main Commercial Plaza",
  address: "Commercial Center",
  description: "Commercial building with shops and rentable rooms.",
  floors: ["Basement", "Ground Floor", "1st Floor", "Residential Flats"],
  active: true,
};

// Flexible in-memory units array
let fallbackUnitsMemory: UnitItem[] = [
  // Basement Shops
  { id: 1, plaza_id: 1, unit_number: "B-01", unit_name: "Basement Shop B-01", unit_type: "SHOP", floor: "Basement", default_monthly_rent: 28000, default_security_amount: 50000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 2, plaza_id: 1, unit_number: "B-02", unit_name: "Basement Shop B-02", unit_type: "SHOP", floor: "Basement", default_monthly_rent: 28000, default_security_amount: 50000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 3, plaza_id: 1, unit_number: "B-03", unit_name: "Basement Shop B-03", unit_type: "SHOP", floor: "Basement", default_monthly_rent: 28000, default_security_amount: 50000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 4, plaza_id: 1, unit_number: "B-04", unit_name: "Basement Shop B-04", unit_type: "SHOP", floor: "Basement", default_monthly_rent: 28000, default_security_amount: 50000, default_rent_due_day: 5, status: "VACANT" },

  // Ground Floor Shops
  { id: 5, plaza_id: 1, unit_number: "G-01", unit_name: "Ground Shop G-01", unit_type: "SHOP", floor: "Ground Floor", default_monthly_rent: 30000, default_security_amount: 50000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 6, plaza_id: 1, unit_number: "G-02", unit_name: "Ground Shop G-02", unit_type: "SHOP", floor: "Ground Floor", default_monthly_rent: 30000, default_security_amount: 50000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 7, plaza_id: 1, unit_number: "G-03", unit_name: "Ground Shop G-03", unit_type: "SHOP", floor: "Ground Floor", default_monthly_rent: 30000, default_security_amount: 50000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 8, plaza_id: 1, unit_number: "G-04", unit_name: "Ground Shop G-04", unit_type: "SHOP", floor: "Ground Floor", default_monthly_rent: 30000, default_security_amount: 50000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 9, plaza_id: 1, unit_number: "G-05", unit_name: "Ground Shop G-05", unit_type: "SHOP", floor: "Ground Floor", default_monthly_rent: 30000, default_security_amount: 50000, default_rent_due_day: 5, status: "OCCUPIED" },

  // 1st Floor Shops
  { id: 10, plaza_id: 1, unit_number: "F-01", unit_name: "1st Floor Shop F-01", unit_type: "SHOP", floor: "1st Floor", default_monthly_rent: 28000, default_security_amount: 50000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 11, plaza_id: 1, unit_number: "F-02", unit_name: "1st Floor Shop F-02", unit_type: "SHOP", floor: "1st Floor", default_monthly_rent: 28000, default_security_amount: 50000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 12, plaza_id: 1, unit_number: "F-03", unit_name: "1st Floor Shop F-03", unit_type: "SHOP", floor: "1st Floor", default_monthly_rent: 28000, default_security_amount: 50000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 13, plaza_id: 1, unit_number: "F-04", unit_name: "1st Floor Shop F-04", unit_type: "SHOP", floor: "1st Floor", default_monthly_rent: 28000, default_security_amount: 50000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 14, plaza_id: 1, unit_number: "F-05", unit_name: "1st Floor Shop F-05", unit_type: "SHOP", floor: "1st Floor", default_monthly_rent: 28000, default_security_amount: 50000, default_rent_due_day: 5, status: "VACANT" },

  // Flat 1 Rooms
  { id: 15, plaza_id: 1, unit_number: "FL1-R1", unit_name: "Flat 1 Room 1", unit_type: "ROOM", floor: "Residential Flats", default_monthly_rent: 8500, default_security_amount: 10000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 16, plaza_id: 1, unit_number: "FL1-R2", unit_name: "Flat 1 Room 2", unit_type: "ROOM", floor: "Residential Flats", default_monthly_rent: 8500, default_security_amount: 10000, default_rent_due_day: 5, status: "OCCUPIED" },

  // Flat 2 Rooms
  { id: 17, plaza_id: 1, unit_number: "FL2-R1", unit_name: "Flat 2 Room 1", unit_type: "ROOM", floor: "Residential Flats", default_monthly_rent: 8500, default_security_amount: 10000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 18, plaza_id: 1, unit_number: "FL2-R2", unit_name: "Flat 2 Room 2", unit_type: "ROOM", floor: "Residential Flats", default_monthly_rent: 8500, default_security_amount: 10000, default_rent_due_day: 5, status: "OCCUPIED" },

  // Flat 3 Rooms
  { id: 19, plaza_id: 1, unit_number: "FL3-R1", unit_name: "Flat 3 Room 1", unit_type: "ROOM", floor: "Residential Flats", default_monthly_rent: 8500, default_security_amount: 10000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 20, plaza_id: 1, unit_number: "FL3-R2", unit_name: "Flat 3 Room 2", unit_type: "ROOM", floor: "Residential Flats", default_monthly_rent: 8500, default_security_amount: 10000, default_rent_due_day: 5, status: "VACANT" },

  // Flat 4 Rooms
  { id: 21, plaza_id: 1, unit_number: "FL4-R1", unit_name: "Flat 4 Room 1", unit_type: "ROOM", floor: "Residential Flats", default_monthly_rent: 8500, default_security_amount: 10000, default_rent_due_day: 5, status: "OCCUPIED" },
  { id: 22, plaza_id: 1, unit_number: "FL4-R2", unit_name: "Flat 4 Room 2", unit_type: "ROOM", floor: "Residential Flats", default_monthly_rent: 8500, default_security_amount: 10000, default_rent_due_day: 5, status: "OCCUPIED" },
];

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
        floors: plaza.floors || dynamicPlazaMemory.floors || ["Basement", "Ground Floor", "1st Floor", "Residential Flats"],
      };
    }
  } catch (err) {
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
  } catch (err) {
    // Fallback
  }

  dynamicPlazaMemory = updated;
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
  replaceExisting: boolean = false
): Promise<{ count: number }> {
  const plaza = await getPrimaryPlaza();

  if (replaceExisting) {
    fallbackUnitsMemory = [];
    try {
      await supabase.from("units").delete().eq("plaza_id", plaza.id);
    } catch {
      // Non-blocking
    }
  }

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

    if (!error && units && units.length > 0) {
      unitsList = units as UnitItem[];
    } else {
      unitsList = [...fallbackUnitsMemory];
    }
  } catch (err) {
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
      createdUnit = newUnit;
    }
  } catch (err) {
    // Fallback
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
    fallbackUnitsMemory.push(createdUnit);
  }

  // Handle Automatic Electricity Setup behind the scenes
  if (data.electricity && createdUnit) {
    const { option, referenceNumber, meterNumber, sharedConnectionId, splitType, splitValue } = data.electricity;

    if (option === "OWN_METER" && referenceNumber?.trim()) {
      const cleanRef = referenceNumber.trim();
      try {
        const { data: existingConn } = await supabase
          .from("connections")
          .select("id")
          .eq("reference_number", cleanRef)
          .maybeSingle();

        let connectionId = existingConn?.id;

        if (!connectionId) {
          const { data: newConn } = await supabase
            .from("connections")
            .insert({
              name: `${createdUnit.unit_name} Meter`,
              tenant: createdUnit.unit_name,
              reference_number: cleanRef,
              meter_number: meterNumber?.trim() || null,
              active: true,
            })
            .select("id")
            .maybeSingle();

          connectionId = newConn?.id;
        }

        if (connectionId) {
          await supabase.from("connection_unit_mappings").upsert({
            connection_id: connectionId,
            unit_id: createdUnit.id,
            split_type: "EQUAL",
            split_value: 100,
          });
        }
      } catch (connErr) {
        console.warn("Electricity link note:", connErr);
      }
    } else if (option === "SHARED_METER" && sharedConnectionId) {
      try {
        await supabase.from("connection_unit_mappings").upsert({
          connection_id: sharedConnectionId,
          unit_id: createdUnit.id,
          split_type: splitType || "EQUAL",
          split_value: splitValue || 50,
        });
      } catch (connErr) {
        console.warn("Shared electricity link note:", connErr);
      }
    }
  }

  return createdUnit;
}

/**
 * Updates an existing physical unit
 */
export async function updateUnit(
  id: number | string,
  data: Partial<{
    unitNumber: string;
    unitName: string;
    unitType: "SHOP" | "ROOM" | "OTHER";
    floor: string;
    defaultMonthlyRent: number;
    defaultSecurityAmount: number;
    defaultRentDueDay: number;
    status: "OCCUPIED" | "VACANT" | "INACTIVE";
    notes: string | null;
  }>
): Promise<UnitItem | null> {
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (data.unitNumber !== undefined) updatePayload.unit_number = data.unitNumber.trim();
  if (data.unitName !== undefined) updatePayload.unit_name = data.unitName.trim();
  if (data.unitType !== undefined) updatePayload.unit_type = data.unitType;
  if (data.floor !== undefined) updatePayload.floor = data.floor.trim();
  if (data.defaultMonthlyRent !== undefined) updatePayload.default_monthly_rent = data.defaultMonthlyRent;
  if (data.defaultSecurityAmount !== undefined) updatePayload.default_security_amount = data.defaultSecurityAmount;
  if (data.defaultRentDueDay !== undefined) updatePayload.default_rent_due_day = data.defaultRentDueDay;
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.notes !== undefined) updatePayload.notes = data.notes;

  try {
    const { data: updatedUnit, error } = await supabase
      .from("units")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (!error && updatedUnit) {
      return updatedUnit;
    }
  } catch (err) {
    // Fallback to local memory
  }

  const idx = fallbackUnitsMemory.findIndex((u) => u.id.toString() === id.toString());
  if (idx !== -1) {
    fallbackUnitsMemory[idx] = {
      ...fallbackUnitsMemory[idx],
      ...data,
      unit_number: data.unitNumber ?? fallbackUnitsMemory[idx].unit_number,
      unit_name: data.unitName ?? fallbackUnitsMemory[idx].unit_name,
      unit_type: data.unitType ?? fallbackUnitsMemory[idx].unit_type,
      floor: data.floor ?? fallbackUnitsMemory[idx].floor,
      default_monthly_rent: data.defaultMonthlyRent ?? fallbackUnitsMemory[idx].default_monthly_rent,
      default_security_amount: data.defaultSecurityAmount ?? fallbackUnitsMemory[idx].default_security_amount,
      default_rent_due_day: data.defaultRentDueDay ?? fallbackUnitsMemory[idx].default_rent_due_day,
      status: data.status ?? fallbackUnitsMemory[idx].status,
    };
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
  } catch (err) {
    // Fallback
  }

  fallbackUnitsMemory = fallbackUnitsMemory.filter((u) => u.id.toString() !== id.toString());
  return true;
}
