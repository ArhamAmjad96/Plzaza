"use server";

import { revalidatePath } from "next/cache";
import {
  recordPaymentTransaction,
  deletePaymentTransaction,
  getReceiptData,
  PaymentType,
} from "@/lib/payments/service";

export async function createPaymentAction(formData: FormData) {
  const connectionIdStr = (formData.get("connection_id") as string) || "1";
  const tenantIdStr = (formData.get("tenant_id") as string) || null;
  const leaseIdStr = (formData.get("lease_id") as string) || null;
  const unitIdStr = (formData.get("unit_id") as string) || null;
  const billingMonth = formData.get("billing_month") as string;
  const paymentType = ((formData.get("payment_type") as string) || "RENT") as PaymentType;
  const amountStr = formData.get("amount") as string;
  const paymentDate = formData.get("payment_date") as string;
  const paymentMethod = formData.get("payment_method") as string;
  const transactionReference = (formData.get("transaction_reference") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!billingMonth || !amountStr) {
    throw new Error("Missing required payment fields.");
  }

  const connectionId = parseInt(connectionIdStr, 10);
  const amount = parseFloat(amountStr);

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const payment = await recordPaymentTransaction({
    connectionId,
    tenantId: tenantIdStr ? parseInt(tenantIdStr, 10) : undefined,
    leaseId: leaseIdStr ? parseInt(leaseIdStr, 10) : undefined,
    unitId: unitIdStr ? parseInt(unitIdStr, 10) : undefined,
    billingMonth,
    paymentType,
    amount,
    paymentDate: paymentDate || new Date().toISOString().split("T")[0],
    paymentMethod: paymentMethod || "Cash",
    transactionReference,
    notes,
  });

  revalidatePath("/rent");
  revalidatePath("/tenants");
  revalidatePath("/units");
  revalidatePath("/tenant/payments");
  revalidatePath("/tenant");
  revalidatePath("/");
  if (connectionId) revalidatePath(`/tenants/${connectionId}`);
  if (tenantIdStr) revalidatePath(`/tenants/${tenantIdStr}`);

  return { success: true, payment };
}

export async function deletePaymentAction(
  paymentId: number | string,
  connectionId: number | string,
  billingMonth: string
) {
  const success = await deletePaymentTransaction(
    paymentId,
    connectionId,
    billingMonth
  );

  revalidatePath("/rent");
  revalidatePath("/tenants");
  revalidatePath("/units");
  revalidatePath("/tenant/payments");
  revalidatePath("/tenant");
  revalidatePath("/");
  if (connectionId) revalidatePath(`/tenants/${connectionId}`);

  return { success };
}

export async function getReceiptDataAction(paymentId: number | string) {
  try {
    const data = await getReceiptData(paymentId);
    return { success: true, receipt: data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to fetch receipt data." };
  }
}
