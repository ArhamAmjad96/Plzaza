"use server";

import { revalidatePath } from "next/cache";
import { generateMonthlyChargesAll, normalizeBillingMonth } from "@/lib/ledgers/service";
import { recordPaymentTransaction } from "@/lib/payments/service";

export async function generateMonthlyChargesAction(billingMonthStr: string) {
  try {
    const month = normalizeBillingMonth(billingMonthStr);
    const count = await generateMonthlyChargesAll(month);
    revalidatePath("/rent");
    revalidatePath("/");
    return { success: true, count, message: `Generated ${count} monthly ledger records.` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to generate charges." };
  }
}

export async function recordPaymentAction(formData: FormData) {
  const connectionIdStr = (formData.get("connection_id") as string) || "1";
  const billingMonthInput = (formData.get("billing_month") as string) || new Date().toISOString().slice(0, 7);
  const paymentAmountStr = (formData.get("amount") || formData.get("payment_amount")) as string;
  const paymentType = (formData.get("payment_type") as any) || "RENT";
  const paymentMethod = (formData.get("payment_method") as string) || "Cash";
  const paymentDate = (formData.get("payment_date") as string) || new Date().toISOString().split("T")[0];
  const transactionReference = (formData.get("transaction_reference") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!paymentAmountStr) {
    throw new Error("Missing payment amount.");
  }

  const payment = parseFloat(paymentAmountStr) || 0;
  if (payment <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const connectionId = isNaN(Number(connectionIdStr)) ? connectionIdStr : Number(connectionIdStr);

  const res = await recordPaymentTransaction({
    connectionId,
    billingMonth: billingMonthInput,
    paymentType,
    amount: payment,
    paymentDate,
    paymentMethod,
    transactionReference,
    notes,
  });

  revalidatePath("/rent");
  revalidatePath("/units");
  revalidatePath("/");
  revalidatePath(`/tenants/${connectionId}`);

  return { success: true, payment: res };
}
