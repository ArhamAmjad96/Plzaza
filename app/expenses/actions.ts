"use server";

import { revalidatePath } from "next/cache";
import {
  createGeneralExpense,
  deleteGeneralExpense,
  GeneralExpenseCategory,
} from "@/lib/expenses/service";

export async function createGeneralExpenseAction(formData: FormData) {
  const category = (formData.get("category") as GeneralExpenseCategory) || "Other";
  const title = formData.get("title") as string;
  const amountStr = formData.get("amount") as string;
  const expenseDate = formData.get("expense_date") as string;
  const paymentMethod = (formData.get("payment_method") as string) || "Cash";
  const paidTo = (formData.get("paid_to") as string)?.trim() || null;
  const isRecurring = formData.get("is_recurring") === "true";
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!title || !amountStr) {
    throw new Error("Title and Amount are required.");
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const expense = await createGeneralExpense({
    category,
    title,
    amount,
    expenseDate,
    paymentMethod,
    paidTo,
    isRecurring,
    notes,
  });

  revalidatePath("/expenses");
  revalidatePath("/");
  return { success: true, expense };
}

export async function deleteGeneralExpenseAction(id: number | string) {
  const success = await deleteGeneralExpense(id);
  revalidatePath("/expenses");
  revalidatePath("/");
  return { success };
}
