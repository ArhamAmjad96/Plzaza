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
  const email = (formData.get("email") as string)?.trim() || null;
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
  const electricityOption = (formData.get("electricity_option") as any) || undefined;
  const referenceNumber = (formData.get("reference_number") as string)?.trim() || null;
  const meterNumber = (formData.get("meter_number") as string)?.trim() || null;
  const sharedConnectionId = (formData.get("shared_connection_id") as string)?.trim() || null;
  const splitType = (formData.get("split_type") as any) || undefined;
  const splitValue = parseFloat(formData.get("split_value") as string) || undefined;

  const createPortalLogin = formData.get("create_portal_login") === "true";
  const loginUsername = (formData.get("login_username") as string)?.trim() || undefined;
  const loginEmail = (formData.get("login_email") as string)?.trim() || email;
  const loginPassword = (formData.get("login_password") as string)?.trim() || undefined;

  if (!fullName || !unitId) {
    throw new Error("Tenant Full Name and Unit assignment are required.");
  }

  const res = await createTenantWithLease({
    fullName,
    phone,
    cnic,
    email,
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
    electricityOption,
    referenceNumber,
    meterNumber,
    sharedConnectionId,
    splitType,
    splitValue,
    createPortalLogin,
    loginUsername,
    loginEmail,
    loginPassword,
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
  const unitId = formData.get("unit_id") as string;
  const referenceNumber = (formData.get("reference_number") as string)?.trim() || null;
  const meterNumber = (formData.get("meter_number") as string)?.trim() || null;

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

  if (unitId && referenceNumber) {
    try {
      const { connectUnitMeter } = await import("@/lib/electricity/service");
      await connectUnitMeter({
        unitId,
        referenceNumber,
        meterNumber: meterNumber || undefined,
        electricityOption: "OWN_METER",
      });
    } catch (e) {
      console.warn("Auto meter connect error during tenant update:", e);
    }
  }

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath("/units");
  revalidatePath("/connections");
  revalidatePath("/rent");
  revalidatePath("/");

  return { success: true };
}

// Preserve backward-compatible legacy function signature
export async function updateTenant(id: string, formData: FormData) {
  return updateTenantLeaseAction(formData);
}