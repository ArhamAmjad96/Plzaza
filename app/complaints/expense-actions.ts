"use server";

import { revalidatePath } from "next/cache";
import {
  addComplaintExpense,
  deleteComplaintExpense,
  ExpenseType,
} from "@/lib/complaints/expenses-service";

export async function addComplaintExpenseAction(formData: FormData) {
  const complaintId = formData.get("complaint_id") as string;
  const expenseType = (formData.get("expense_type") as ExpenseType) || "MATERIAL";
  const description = formData.get("description") as string;
  const amountStr = formData.get("amount") as string;
  const vendorName = (formData.get("vendor_name") as string)?.trim() || null;
  const paymentMethod = (formData.get("payment_method") as string) || "Cash";
  const expenseDate = formData.get("expense_date") as string;

  if (!complaintId || !description || !amountStr) {
    throw new Error("Missing required expense fields.");
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Expense amount must be greater than 0.");
  }

  const expense = await addComplaintExpense({
    complaintId,
    expenseType,
    description,
    amount,
    vendorName,
    paymentMethod,
    expenseDate,
  });

  revalidatePath("/complaints");
  revalidatePath("/");
  return { success: true, expense };
}

export async function deleteComplaintExpenseAction(id: number | string) {
  const success = await deleteComplaintExpense(id);
  revalidatePath("/complaints");
  revalidatePath("/");
  return { success };
}
