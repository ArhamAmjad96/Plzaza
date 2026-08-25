import { supabase } from "@/lib/supabase/server";

export type ExpenseType = "MATERIAL" | "LABOUR" | "OTHER";

export interface ComplaintExpenseItem {
  id: number | string;
  complaint_id: number | string;
  expense_type: ExpenseType;
  description: string;
  amount: number;
  vendor_name?: string | null;
  payment_method: string;
  expense_date: string;
  created_at?: string;
}

export interface ComplaintExpenseSummary {
  items: ComplaintExpenseItem[];
  totalCost: number;
  materialCost: number;
  labourCost: number;
  otherCost: number;
}

/**
 * Auto-seeds sample complaint expenses if table is empty
 */
async function seedSampleExpensesIfEmpty(): Promise<void> {
  try {
    const { data: existing } = await supabase.from("complaint_expenses").select("id").limit(1);
    if (existing && existing.length > 0) return;

    const { data: complaints } = await supabase.from("complaints").select("id, complaint_number").limit(3);
    if (!complaints || complaints.length === 0) return;

    const c1 = complaints[0];
    const initial = [
      {
        complaint_id: c1.id,
        expense_type: "MATERIAL",
        description: "Waterproofing chemical sealant & membrane",
        amount: 8500,
        vendor_name: "Diamond Paints & Chemicals",
        payment_method: "Cash",
      },
      {
        complaint_id: c1.id,
        expense_type: "LABOUR",
        description: "Plumber & mason repair labour",
        amount: 4000,
        vendor_name: "Plumber Aslam",
        payment_method: "Cash",
      },
      {
        complaint_id: c1.id,
        expense_type: "OTHER",
        description: "Material transport & debris clearance",
        amount: 1000,
        vendor_name: "Local Transport",
        payment_method: "Cash",
      },
    ];

    for (const item of initial) {
      await supabase.from("complaint_expenses").insert(item);
    }
  } catch (err) {
    console.warn("Expense seed note:", err);
  }
}

/**
 * Retrieves all expenses for a specific complaint
 */
export async function getExpensesForComplaint(
  complaintId: number | string
): Promise<ComplaintExpenseSummary> {
  await seedSampleExpensesIfEmpty();

  const { data: raw, error } = await supabase
    .from("complaint_expenses")
    .select("*")
    .eq("complaint_id", complaintId)
    .order("expense_date", { ascending: false });

  if (error || !raw) {
    return {
      items: [],
      totalCost: 0,
      materialCost: 0,
      labourCost: 0,
      otherCost: 0,
    };
  }

  const items: ComplaintExpenseItem[] = raw.map((r: any) => ({
    id: r.id,
    complaint_id: r.complaint_id,
    expense_type: r.expense_type,
    description: r.description,
    amount: Number(r.amount || 0),
    vendor_name: r.vendor_name,
    payment_method: r.payment_method || "Cash",
    expense_date: r.expense_date,
    created_at: r.created_at,
  }));

  const totalCost = items.reduce((sum, i) => sum + i.amount, 0);
  const materialCost = items.filter((i) => i.expense_type === "MATERIAL").reduce((sum, i) => sum + i.amount, 0);
  const labourCost = items.filter((i) => i.expense_type === "LABOUR").reduce((sum, i) => sum + i.amount, 0);
  const otherCost = items.filter((i) => i.expense_type === "OTHER").reduce((sum, i) => sum + i.amount, 0);

  return {
    items,
    totalCost,
    materialCost,
    labourCost,
    otherCost,
  };
}

/**
 * Retrieves aggregated total expenses mapped by complaintId
 */
export async function getAllComplaintExpensesMap(): Promise<Record<string, number>> {
  await seedSampleExpensesIfEmpty();

  const { data: raw } = await supabase
    .from("complaint_expenses")
    .select("complaint_id, amount");

  const map: Record<string, number> = {};
  if (raw) {
    raw.forEach((r: any) => {
      const idStr = r.complaint_id.toString();
      map[idStr] = (map[idStr] || 0) + Number(r.amount || 0);
    });
  }

  return map;
}

/**
 * Adds an expense line item to a complaint
 */
export async function addComplaintExpense(data: {
  complaintId: number | string;
  expenseType: ExpenseType;
  description: string;
  amount: number;
  vendorName?: string | null;
  paymentMethod?: string;
  expenseDate?: string;
}): Promise<ComplaintExpenseItem> {
  const { data: expense, error } = await supabase
    .from("complaint_expenses")
    .insert({
      complaint_id: data.complaintId,
      expense_type: data.expenseType,
      description: data.description.trim(),
      amount: data.amount,
      vendor_name: data.vendorName?.trim() || null,
      payment_method: data.paymentMethod || "Cash",
      expense_date: data.expenseDate || new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) {
    console.error("ADD COMPLAINT EXPENSE ERROR:", error);
    throw new Error(error.message || "Failed to add expense.");
  }

  return expense;
}

/**
 * Deletes an expense line item
 */
export async function deleteComplaintExpense(id: number | string): Promise<boolean> {
  const { error } = await supabase.from("complaint_expenses").delete().eq("id", id);
  if (error) throw error;
  return true;
}
