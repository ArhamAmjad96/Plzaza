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
  const connectionIdStr = formData.get("connection_id") as string;
  const billingMonthInput = formData.get("billing_month") as string;
  const paymentAmountStr = formData.get("payment_amount") as string;
  const paymentMethod = (formData.get("payment_method") as string) || "Cash";
  const transactionReference = (formData.get("transaction_reference") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!connectionIdStr || !billingMonthInput || !paymentAmountStr) {
    throw new Error("Missing required payment fields.");
  }

  const connectionId = parseInt(connectionIdStr, 10);
  const payment = parseFloat(paymentAmountStr) || 0;

  if (payment <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const res = await recordPaymentTransaction({
    connectionId,
    billingMonth: billingMonthInput,
    amount: payment,
    paymentMethod,
    transactionReference,
    notes,
  });

  revalidatePath("/rent");
  revalidatePath("/");
  revalidatePath(`/tenants/${connectionId}`);

  return { success: true, payment: res };
}
