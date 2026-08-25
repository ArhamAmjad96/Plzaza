"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase/server";
import {
  getAllUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  savePlazaDetails,
  bulkConfigurePlazaUnits,
  UnitElectricitySetup,
} from "@/lib/units/service";

export async function savePlazaDetailsAction(formData: FormData) {
  const name = (formData.get("name") as string) || "Main Commercial Plaza";
  const address = (formData.get("address") as string) || "";
  const description = (formData.get("description") as string) || "";
  const floorsRaw = formData.get("floors") as string;

  let floors: string[] | undefined = undefined;
  if (floorsRaw) {
    try {
      floors = JSON.parse(floorsRaw);
    } catch {
      floors = floorsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  const plaza = await savePlazaDetails({
    name,
    address,
    description,
    floors,
  });

  revalidatePath("/");
  revalidatePath("/units");
  revalidatePath("/settings");
  return { success: true, plaza };
}

export async function getAvailableUnitsAction() {
  const { units } = await getAllUnits();
  return units;
}

export async function bulkConfigurePlazaAction(formData: FormData) {
  const unitsJson = formData.get("units_json") as string;
  const replaceExisting = formData.get("replace_existing") === "true";

  if (!unitsJson) {
    throw new Error("No unit configuration provided.");
  }

  const unitsList = JSON.parse(unitsJson);
  const result = await bulkConfigurePlazaUnits(unitsList, replaceExisting);

  revalidatePath("/");
  revalidatePath("/units");
  revalidatePath("/rent");
  revalidatePath("/settings");
  return { success: true, count: result.count };
}

export async function createUnitAction(formData: FormData) {
  const unitNumber = formData.get("unit_number") as string;
  const unitName = formData.get("unit_name") as string;
  const unitType = (formData.get("unit_type") as string) || "SHOP";
  const floor = (formData.get("floor") as string) || "Ground";
  const defaultMonthlyRent = parseFloat(formData.get("default_monthly_rent") as string) || 0;
  const defaultSecurityAmount = parseFloat(formData.get("default_security_amount") as string) || 0;
  const defaultRentDueDay = parseInt(formData.get("default_rent_due_day") as string, 10) || 5;
  const status = (formData.get("status") as any) || "VACANT";
  const notes = (formData.get("notes") as string)?.trim() || null;

  // Electricity setup details
  const electricityOption = (formData.get("electricity_option") as any) || "NO_METER";
  const referenceNumber = (formData.get("reference_number") as string)?.trim();
  const meterNumber = (formData.get("meter_number") as string)?.trim();
  const sharedConnectionId = formData.get("shared_connection_id") as string;
  const splitType = (formData.get("split_type") as any) || "EQUAL";
  const splitValue = parseFloat(formData.get("split_value") as string) || 50;

  if (!unitNumber || !unitName) {
    throw new Error("Unit Number and Unit Name are required.");
  }

  const electricity: UnitElectricitySetup = {
    option: electricityOption,
    referenceNumber,
    meterNumber,
    sharedConnectionId: sharedConnectionId ? parseInt(sharedConnectionId, 10) : undefined,
    splitType,
    splitValue,
  };

  const unit = await createUnit({
    unitNumber,
    unitName,
    unitType: unitType as any,
    floor,
    defaultMonthlyRent,
    defaultSecurityAmount,
    defaultRentDueDay,
    status,
    notes,
    electricity,
  });

  revalidatePath("/units");
  revalidatePath("/connections");
  revalidatePath("/");
  return { success: true, unit };
}

export async function getExistingConnectionsAction() {
  try {
    const { data } = await supabase
      .from("connections")
      .select("id, name, reference_number, meter_number")
      .eq("active", true);
    return data || [];
  } catch {
    return [];
  }
}

export async function updateUnitAction(id: number | string, formData: FormData) {
  const unitNumber = formData.get("unit_number") as string;
  const unitName = formData.get("unit_name") as string;
  const unitType = formData.get("unit_type") as string;
  const floor = formData.get("floor") as string;
  const defaultMonthlyRent = parseFloat(formData.get("default_monthly_rent") as string);
  const defaultSecurityAmount = parseFloat(formData.get("default_security_amount") as string);
  const defaultRentDueDay = parseInt(formData.get("default_rent_due_day") as string, 10);
  const status = formData.get("status") as any;
  const notes = (formData.get("notes") as string)?.trim() || null;

  const unit = await updateUnit(id, {
    unitNumber: unitNumber || undefined,
    unitName: unitName || undefined,
    unitType: (unitType as any) || undefined,
    floor: floor || undefined,
    defaultMonthlyRent: isNaN(defaultMonthlyRent) ? undefined : defaultMonthlyRent,
    defaultSecurityAmount: isNaN(defaultSecurityAmount) ? undefined : defaultSecurityAmount,
    defaultRentDueDay: isNaN(defaultRentDueDay) ? undefined : defaultRentDueDay,
    status: status || undefined,
    notes,
  });

  revalidatePath("/units");
  revalidatePath("/");
  return { success: true, unit };
}

export async function toggleUnitStatusAction(id: number | string, newStatus: "OCCUPIED" | "VACANT" | "INACTIVE") {
  const unit = await updateUnit(id, { status: newStatus });
  revalidatePath("/units");
  revalidatePath("/");
  return { success: true, unit };
}

export async function deleteUnitAction(id: number | string) {
  const success = await deleteUnit(id);
  revalidatePath("/units");
  revalidatePath("/");
  return { success };
}

export async function connectUnitMeterAction(formData: FormData) {
  const unitId = formData.get("unit_id") as string;
  const referenceNumber = (formData.get("reference_number") as string)?.trim();
  const meterNumber = (formData.get("meter_number") as string)?.trim();
  const electricityOption = (formData.get("electricity_option") as any) || "OWN_METER";
  const sharedConnectionId = formData.get("shared_connection_id") as string;
  const splitType = (formData.get("split_type") as any) || "EQUAL";
  const splitValue = parseFloat(formData.get("split_value") as string) || 50;

  if (!unitId) {
    throw new Error("Unit ID is required.");
  }

  const { connectUnitMeter } = await import("@/lib/electricity/service");
  await connectUnitMeter({
    unitId,
    referenceNumber,
    meterNumber,
    electricityOption,
    sharedConnectionId,
    splitType,
    splitValue,
  });

  revalidatePath(`/units/${unitId}`);
  revalidatePath("/units");
  revalidatePath("/connections");
  revalidatePath("/rent");
  revalidatePath("/");

  return { success: true };
}
