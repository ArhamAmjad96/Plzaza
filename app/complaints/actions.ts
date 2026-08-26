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

  await updateComplaint(id, {
    status: status || undefined,
    priority: priority || undefined,
    assigned_to: assignedTo || undefined,
    resolution_notes: resolutionNotes || undefined,
  });

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
