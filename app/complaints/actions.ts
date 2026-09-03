"use server";

import { revalidatePath } from "next/cache";
import {
  createComplaint,
  updateComplaint,
  deleteComplaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from "@/lib/complaints/service";

export async function createComplaintAction(formData: FormData) {
  const unitId = formData.get("unit_id") as string;
  const tenantId = (formData.get("tenant_id") as string) || null;
  const category = (formData.get("category") as ComplaintCategory) || "Other";
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const priority = ((formData.get("priority") as string) || "MEDIUM") as ComplaintPriority;
  const assignedTo = (formData.get("assigned_to") as string)?.trim() || null;
  const complaintDate = formData.get("complaint_date") as string;

  if (!unitId || !title) {
    throw new Error("Unit and Complaint Title are required.");
  }

  const complaint = await createComplaint({
    unitId,
    tenantId,
    category,
    title,
    description,
    priority,
    assignedTo,
    complaintDate,
  });

  revalidatePath("/complaints");
  revalidatePath("/");
  return { success: true, complaint };
}

export async function updateComplaintAction(id: number | string, formData: FormData) {
  const status = formData.get("status") as ComplaintStatus;
  const priority = formData.get("priority") as ComplaintPriority;
  const assignedTo = (formData.get("assigned_to") as string)?.trim() || null;
  const resolutionNotes = (formData.get("resolution_notes") as string)?.trim() || null;
  const expenseAmountStr = formData.get("expense_amount") as string;
  const expenseDescription = (formData.get("expense_description") as string)?.trim() || "Repair & Maintenance";

  await updateComplaint(id, {
    status: status || undefined,
    priority: priority || undefined,
    assigned_to: assignedTo || undefined,
    resolution_notes: resolutionNotes || undefined,
  });

  if (expenseAmountStr !== null && expenseAmountStr !== undefined && expenseAmountStr.trim() !== "") {
    const expenseAmount = parseFloat(expenseAmountStr);
    if (!isNaN(expenseAmount) && expenseAmount > 0) {
      const { getComplaintExpenses, addComplaintExpense, updateComplaintExpense } = await import("@/lib/complaints/expenses-service");
      const existingExpenses = await getComplaintExpenses(id);
      if (existingExpenses.items.length > 0) {
        // Update the existing expense
        await updateComplaintExpense(existingExpenses.items[0].id, {
          amount: expenseAmount,
          description: expenseDescription,
          vendor_name: assignedTo || undefined,
        });
      } else {
        // Add new expense
        await addComplaintExpense({
          complaintId: id,
          expenseType: "MATERIAL",
          description: expenseDescription,
          amount: expenseAmount,
          vendorName: assignedTo || null,
          expenseDate: new Date().toISOString().split("T")[0],
        });
      }
    }
  }

  revalidatePath("/complaints");
  revalidatePath("/");
  return { success: true };
}

export async function deleteComplaintAction(id: number | string) {
  const success = await deleteComplaint(id);
  revalidatePath("/complaints");
  revalidatePath("/");
  return { success };
}
