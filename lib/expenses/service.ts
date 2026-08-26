import { supabase } from "@/lib/supabase/server";
import { getPrimaryPlaza } from "@/lib/units/service";

export type GeneralExpenseCategory =
  | "Generator Fuel / Maintenance"
  | "Security Guard Salary"
  | "Janitorial / Sweeper / Cleaning"
  | "Common Area Utilities"
  | "Waste Disposal"
  | "Government Taxes / Property Tax"
  | "Building Maintenance / Repairs"
  | "Legal / Admin"
  | "Other";

export interface ExpenseItem {
  id: number | string;
  plaza_id?: number | string | null;
  category: GeneralExpenseCategory;
  title: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  paid_to?: string | null;
  receipt_voucher_no: string;
  is_recurring: boolean;
  notes?: string | null;
  created_at?: string;
}

export interface ExpenseStats {
  totalExpenses: number;
  staffSalaries: number;
  utilitiesAndFuel: number;
  cleaningAndWaste: number;
  maintenanceAndRepairs: number;
  adminAndTaxes: number;
}

let fallbackExpenses: ExpenseItem[] = [];

export function resetGeneralExpensesMemory(): void {
  fallbackExpenses = [];
}

export function generateVoucherNumber(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `EXP-${yy}${mm}-${randomSuffix}`;
}

export async function getPlazaExpenses(monthInput?: string | null): Promise<{
  expenses: ExpenseItem[];
  stats: ExpenseStats;
  selectedMonth: string;
}> {
  const d = new Date();
  const selectedMonth = monthInput || `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  let expList: ExpenseItem[] = [];

  try {
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (!error && expenses) {
      expList = expenses as ExpenseItem[];
    } else {
      expList = [...fallbackExpenses];
    }
  } catch {
    expList = [...fallbackExpenses];
  }

  // Filter by selected month if not "ALL"
  const filtered = selectedMonth === "ALL" 
    ? expList 
    : expList.filter((e) => e.expense_date.startsWith(selectedMonth));

  // Compute stats
  let totalExpenses = 0;
  let staffSalaries = 0;
  let utilitiesAndFuel = 0;
  let cleaningAndWaste = 0;
  let maintenanceAndRepairs = 0;
  let adminAndTaxes = 0;

  for (const e of filtered) {
    const amt = Number(e.amount) || 0;
    totalExpenses += amt;

    if (e.category === "Security Guard Salary") {
      staffSalaries += amt;
    } else if (
      e.category === "Generator Fuel / Maintenance" ||
      e.category === "Common Area Utilities"
    ) {
      utilitiesAndFuel += amt;
    } else if (
      e.category === "Janitorial / Sweeper / Cleaning" ||
      e.category === "Waste Disposal"
    ) {
      cleaningAndWaste += amt;
    } else if (
      e.category === "Building Maintenance / Repairs"
    ) {
      maintenanceAndRepairs += amt;
    } else if (
      e.category === "Government Taxes / Property Tax" ||
      e.category === "Legal / Admin"
    ) {
      adminAndTaxes += amt;
    }
  }

  return {
    expenses: filtered,
    stats: {
      totalExpenses,
      staffSalaries,
      utilitiesAndFuel,
      cleaningAndWaste,
      maintenanceAndRepairs,
      adminAndTaxes,
    },
    selectedMonth,
  };
}

export async function createGeneralExpense(data: {
  category: GeneralExpenseCategory;
  title: string;
  amount: number;
  expenseDate?: string;
  paymentMethod?: string;
  paidTo?: string | null;
  isRecurring?: boolean;
  notes?: string | null;
}): Promise<ExpenseItem> {
  const plaza = await getPrimaryPlaza();
  const today = data.expenseDate || new Date().toISOString().split("T")[0];
  const voucherNo = generateVoucherNumber(today);

  const item: ExpenseItem = {
    id: Date.now(),
    plaza_id: plaza.id,
    category: data.category,
    title: data.title.trim(),
    amount: Number(data.amount) || 0,
    expense_date: today,
    payment_method: data.paymentMethod || "Cash",
    paid_to: data.paidTo?.trim() || null,
    receipt_voucher_no: voucherNo,
    is_recurring: Boolean(data.isRecurring),
    notes: data.notes?.trim() || null,
    created_at: new Date().toISOString(),
  };

  try {
    const { data: dbItem, error } = await supabase
      .from("expenses")
      .insert({
        plaza_id: plaza.id,
        category: item.category,
        title: item.title,
        amount: item.amount,
        expense_date: item.expense_date,
        payment_method: item.payment_method,
        paid_to: item.paid_to,
        receipt_voucher_no: item.receipt_voucher_no,
        is_recurring: item.is_recurring,
        notes: item.notes,
      })
      .select()
      .maybeSingle();

    if (!error && dbItem) {
      item.id = dbItem.id;
    }
  } catch {
    // Non-blocking
  }

  fallbackExpenses = [item, ...fallbackExpenses];
  return item;
}

export async function deleteGeneralExpense(id: number | string): Promise<boolean> {
  try {
    await supabase.from("expenses").delete().eq("id", id);
  } catch {
    // Non-blocking
  }

  fallbackExpenses = fallbackExpenses.filter((e) => e.id.toString() !== id.toString());
  return true;
}
