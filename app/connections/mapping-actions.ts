"use server";

import { revalidatePath } from "next/cache";
import { saveConnectionUnitMappings } from "@/lib/electricity/service";

export async function updateConnectionMappingsAction(
  connectionId: number | string,
  mappings: Array<{
    unit_id: number | string;
    split_type: "EQUAL" | "PERCENTAGE" | "FIXED_AMOUNT";
    split_value: number;
    notes?: string | null;
  }>
) {
  await saveConnectionUnitMappings(connectionId, mappings);

  revalidatePath("/connections");
  revalidatePath(`/connections/${connectionId}`);
  revalidatePath("/units");
  revalidatePath("/rent");
  revalidatePath("/");

  return { success: true };
}
