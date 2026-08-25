"use server";

import { revalidatePath } from "next/cache";
import {
  runMonthlyLedgerAutomation,
  runPlazaWideIESCOBillSync,
  applyRentEscalation,
} from "@/lib/automation/service";

export async function triggerLedgerGenerationAction(monthInput?: string) {
  const result = await runMonthlyLedgerAutomation(monthInput);
  revalidatePath("/rent");
  revalidatePath("/automation");
  revalidatePath("/");
  return result;
}

export async function triggerBillSyncAction() {
  const result = await runPlazaWideIESCOBillSync();
  revalidatePath("/connections");
  revalidatePath("/bills");
  revalidatePath("/automation");
  revalidatePath("/");
  return result;
}

export async function applyRentEscalationAction(leaseId: number | string, customNewRent?: number) {
  const result = await applyRentEscalation(leaseId, customNewRent);
  revalidatePath("/tenants");
  revalidatePath("/rent");
  revalidatePath("/automation");
  revalidatePath("/");
  return result;
}
