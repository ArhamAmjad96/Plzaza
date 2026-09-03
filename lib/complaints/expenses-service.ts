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

let fallbackExpenses: ComplaintExpenseItem[] = [];

export function resetComplaintExpensesMemory(): void {
  fallbackExpenses = [];
}

/**
 * Retrieves all repair expenses logged against a specific complaint
 */
export async function getComplaintExpenses(
  complaintId: number | string
): Promise<ComplaintExpenseSummary> {
  let list: ComplaintExpenseItem[] = [];

  try {
    const { data: expenses, error } = await supabase
      .from("complaint_expenses")
      .select("*")
      .eq("complaint_id", complaintId)
      .order("expense_date", { ascending: false });

    if (!error && expenses) {
      list = expenses as ComplaintExpenseItem[];
    } else {
      const { getStore } = await import("@/lib/storage/fileStore");
      const storeList: any[] = getStore().complaint_expenses || fallbackExpenses;
      list = storeList.filter(
        (e) => e.complaint_id?.toString() === complaintId.toString()
      );
    }
  } catch {
    const { getStore } = await import("@/lib/storage/fileStore");
    const storeList: any[] = getStore().complaint_expenses || fallbackExpenses;
    list = storeList.filter(
      (e) => e.complaint_id?.toString() === complaintId.toString()
    );
  }

  let totalCost = 0;
  let materialCost = 0;
  let labourCost = 0;
  let otherCost = 0;

  for (const exp of list) {
    const amt = Number(exp.amount) || 0;
    totalCost += amt;
    if (exp.expense_type === "MATERIAL") materialCost += amt;
    else if (exp.expense_type === "LABOUR") labourCost += amt;
    else otherCost += amt;
  }

  return {
    items: list,
    totalCost,
    materialCost,
    labourCost,
    otherCost,
  };
}

/**
 * Retrieves all complaint expenses across all complaints
 */
export async function getAllComplaintExpenses(): Promise<ComplaintExpenseItem[]> {
  try {
    const { data: allExpenses, error } = await supabase
      .from("complaint_expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (!error && allExpenses) {
      return allExpenses as ComplaintExpenseItem[];
    }
  } catch {
    // Non-blocking
  }

  try {
    const { getStore } = await import("@/lib/storage/fileStore");
    const storeList: any[] = getStore().complaint_expenses || fallbackExpenses;
    return storeList;
  } catch {}

  return fallbackExpenses;
}

/**
 * Retrieves a map of total repair expenses keyed by complaint ID
 */
export async function getAllComplaintExpensesMap(): Promise<Record<string, number>> {
  const map: Record<string, number> = {};

  try {
    const { data: allExpenses, error } = await supabase
      .from("complaint_expenses")
      .select("complaint_id, amount");

    if (!error && allExpenses) {
      for (const row of allExpenses) {
        const key = row.complaint_id.toString();
        map[key] = (map[key] || 0) + (Number(row.amount) || 0);
      }
      return map;
    }
  } catch {
    // Non-blocking
  }

  try {
    const { getStore } = await import("@/lib/storage/fileStore");
    const storeList: any[] = getStore().complaint_expenses || fallbackExpenses;
    for (const row of storeList) {
      const key = row.complaint_id?.toString();
      if (key) {
        map[key] = (map[key] || 0) + (Number(row.amount) || 0);
      }
    }
    return map;
  } catch {}

  for (const row of fallbackExpenses) {
    const key = row.complaint_id.toString();
    map[key] = (map[key] || 0) + (Number(row.amount) || 0);
  }

  return map;
}

/**
 * Logs a new repair expense for a complaint
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
  const today = data.expenseDate || new Date().toISOString().split("T")[0];

  const item: ComplaintExpenseItem = {
    id: Date.now(),
    complaint_id: data.complaintId,
    expense_type: data.expenseType,
    description: data.description.trim(),
    amount: Number(data.amount) || 0,
    vendor_name: data.vendorName?.trim() || null,
    payment_method: data.paymentMethod || "Cash",
    expense_date: today,
    created_at: new Date().toISOString(),
  };

  try {
    const { data: dbItem, error } = await supabase
      .from("complaint_expenses")
      .insert({
        complaint_id: item.complaint_id,
        expense_type: item.expense_type,
        description: item.description,
        amount: item.amount,
        vendor_name: item.vendor_name,
        payment_method: item.payment_method,
        expense_date: item.expense_date,
      })
      .select()
      .maybeSingle();

    if (!error && dbItem) {
      item.id = dbItem.id;
    }
  } catch {
    // Non-blocking
  }

  try {
    const { updateStore } = await import("@/lib/storage/fileStore");
    updateStore((s) => {
      if (!s.complaint_expenses) s.complaint_expenses = [];
      s.complaint_expenses.unshift(item);
    });
  } catch {}

  fallbackExpenses = [item, ...fallbackExpenses];
  return item;
}

/**
 * Updates an existing complaint repair expense
 */
export async function updateComplaintExpense(
  id: number | string,
  data: Partial<ComplaintExpenseItem>
): Promise<ComplaintExpenseItem | null> {
  const patch: any = { ...data };
  if (patch.amount !== undefined) patch.amount = Number(patch.amount) || 0;

  let result: ComplaintExpenseItem | null = null;

  try {
    const { data: updated, error } = await supabase
      .from("complaint_expenses")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (!error && updated) {
      result = updated as ComplaintExpenseItem;
    }
  } catch {
    // Non-blocking
  }

  try {
    const { updateStore } = await import("@/lib/storage/fileStore");
    updateStore((s) => {
      if (s.complaint_expenses) {
        const storeIdx = s.complaint_expenses.findIndex((e: any) => e.id?.toString() === id.toString());
        if (storeIdx !== -1) {
          s.complaint_expenses[storeIdx] = { ...s.complaint_expenses[storeIdx], ...patch };
          result = s.complaint_expenses[storeIdx];
        }
      }
    });
  } catch {}

  const idx = fallbackExpenses.findIndex((e) => e.id?.toString() === id.toString());
  if (idx !== -1) {
    fallbackExpenses[idx] = { ...fallbackExpenses[idx], ...patch };
    if (!result) result = fallbackExpenses[idx];
  }

  return result;
}

/**
 * Deletes a complaint expense
 */
export async function deleteComplaintExpense(id: number | string): Promise<boolean> {
  try {
    await supabase.from("complaint_expenses").delete().eq("id", id);
  } catch {
    // Non-blocking
  }

  try {
    const { updateStore } = await import("@/lib/storage/fileStore");
    updateStore((s) => {
      if (s.complaint_expenses) {
        s.complaint_expenses = s.complaint_expenses.filter((e: any) => e.id?.toString() !== id.toString());
      }
    });
  } catch {}

  fallbackExpenses = fallbackExpenses.filter((e) => e.id.toString() !== id.toString());
  return true;
}
