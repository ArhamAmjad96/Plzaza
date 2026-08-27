"use server";

import { revalidatePath } from "next/cache";
import {
  createTenantWithLease,
  vacateTenantLease,
  updateTenantLease,
} from "@/lib/tenants/service";

export async function createTenantAction(formData: FormData) {
  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const cnic = formData.get("cnic") as string;
  const emergencyContact = formData.get("emergency_contact") as string;
  const unitId = formData.get("unit_id") as string;
  const monthlyRent = parseFloat(formData.get("monthly_rent") as string) || 0;
  const rentDueDay = parseInt(formData.get("rent_due_day") as string, 10) || 5;
  const securityAmount = parseFloat(formData.get("security_amount") as string) || 0;
  const securityPaid = parseFloat(formData.get("security_paid") as string) || 0;
  const moveInDate = formData.get("move_in_date") as string;
  const leaseStartDate = formData.get("lease_start_date") as string;
  const leaseEndDate = formData.get("lease_end_date") as string;
  const notes = formData.get("notes") as string;
  const referenceNumber = (formData.get("reference_number") as string)?.trim() || null;
  const meterNumber = (formData.get("meter_number") as string)?.trim() || null;

  if (!fullName || !unitId) {
    throw new Error("Tenant Full Name and Unit assignment are required.");
  }

  const res = await createTenantWithLease({
    fullName,
    phone,
    cnic,
    emergencyContact,
    unitId,
    monthlyRent,
    rentDueDay,
    securityAmount,
    securityPaid,
    moveInDate,
    leaseStartDate,
    leaseEndDate: leaseEndDate || null,
    notes,
    referenceNumber,
    meterNumber,
  });

  revalidatePath("/tenants");
  revalidatePath("/units");
  revalidatePath("/rent");
  revalidatePath("/connections");
  revalidatePath("/logs");
  revalidatePath("/");

  return { success: true, ...res };
}

export async function vacateTenantAction(formData: FormData) {
  const leaseId = formData.get("lease_id") as string;
  const unitId = formData.get("unit_id") as string;
  const tenantId = formData.get("tenant_id") as string;
  const vacateReason = formData.get("vacate_reason") as string;

  if (!leaseId || !unitId || !tenantId) {
    throw new Error("Missing required lease identification fields.");
  }

  await vacateTenantLease({
    leaseId,
    unitId,
    tenantId,
    vacateReason,
  });

  revalidatePath("/tenants");
  revalidatePath("/units");
  revalidatePath("/rent");
  revalidatePath("/");

  return { success: true };
}

export async function updateTenantLeaseAction(formData: FormData) {
  const tenantId = formData.get("tenant_id") as string;
  const leaseId = (formData.get("lease_id") as string) || null;
  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const cnic = formData.get("cnic") as string;
  const emergencyContact = formData.get("emergency_contact") as string;
  const monthlyRent = parseFloat(formData.get("monthly_rent") as string);
  const rentDueDay = parseInt(formData.get("rent_due_day") as string, 10);
  const securityAmount = parseFloat(formData.get("security_amount") as string);
  const securityPaid = parseFloat(formData.get("security_paid") as string);
  const notes = formData.get("notes") as string;

  if (!tenantId || !fullName) {
    throw new Error("Tenant Name is required.");
  }

  await updateTenantLease({
    tenantId,
    leaseId: leaseId || undefined,
    fullName,
    phone,
    cnic,
    emergencyContact,
    monthlyRent: isNaN(monthlyRent) ? undefined : monthlyRent,
    rentDueDay: isNaN(rentDueDay) ? undefined : rentDueDay,
    securityAmount: isNaN(securityAmount) ? undefined : securityAmount,
    securityPaid: isNaN(securityPaid) ? undefined : securityPaid,
    notes,
  });

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath("/units");
  revalidatePath("/rent");
  revalidatePath("/");

  return { success: true };
}

// Preserve backward-compatible legacy function signature
export async function updateTenant(id: string, formData: FormData) {
  return updateTenantLeaseAction(formData);
}