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

let fallbackExpenses: ExpenseItem[] = [
  {
    id: 1,
    plaza_id: 1,
    category: "Security Guard Salary",
    title: "Monthly Security Guard Salary",
    amount: 25000,
    expense_date: "2026-08-01",
    payment_method: "Cash",
    paid_to: "Guard Muhammad Iqbal",
    receipt_voucher_no: "EXP-2608-001",
    is_recurring: true,
    notes: "Monthly day/night security guard duty",
  },
  {
    id: 2,
    plaza_id: 1,
    category: "Janitorial / Sweeper / Cleaning",
    title: "Sweeper & Plaza Cleaning Wages",
    amount: 8000,
    expense_date: "2026-08-01",
    payment_method: "Cash",
    paid_to: "Sweeper Boota Masih",
    receipt_voucher_no: "EXP-2608-002",
    is_recurring: true,
    notes: "Daily stairs, corridors, and entrance sweeping",
  },
  {
    id: 3,
    plaza_id: 1,
    category: "Generator Fuel / Maintenance",
    title: "Backup Generator Diesel Fuel (80 Litres)",
    amount: 15000,
    expense_date: "2026-08-05",
    payment_method: "Cash",
    paid_to: "Total Petroleum Station",
    receipt_voucher_no: "EXP-2608-003",
    is_recurring: false,
    notes: "Diesel purchase for power outages",
  },
];

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

    if (!error && expenses && expenses.length > 0) {
      expList = expenses as ExpenseItem[];
    } else {
      expList = [...fallbackExpenses];
    }
  } catch (err) {
    expList = [...fallbackExpenses];
  }

  // Filter by selected month
  const filtered = expList.filter((e) => e.expense_date.startsWith(selectedMonth));

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
    } else if (e.category === "Building Maintenance / Repairs") {
      maintenanceAndRepairs += amt;
    } else {
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

export async function createPlazaExpense(data: {
  category: GeneralExpenseCategory;
  title: string;
  amount: number;
  expenseDate: string;
  paymentMethod?: string;
  paidTo?: string | null;
  isRecurring?: boolean;
  notes?: string | null;
}): Promise<ExpenseItem> {
  const plaza = await getPrimaryPlaza();
  const receiptVoucherNo = generateVoucherNumber(data.expenseDate);

  try {
    const { data: newExpense, error } = await supabase
      .from("expenses")
      .insert({
        plaza_id: plaza.id,
        category: data.category,
        title: data.title.trim(),
        amount: data.amount,
        expense_date: data.expenseDate,
        payment_method: data.paymentMethod || "Cash",
        paid_to: data.paidTo?.trim() || null,
        receipt_voucher_no: receiptVoucherNo,
        is_recurring: Boolean(data.isRecurring),
        notes: data.notes?.trim() || null,
      })
      .select()
      .maybeSingle();

    if (!error && newExpense) {
      return newExpense;
    }
  } catch (err) {
    // Fallback
  }

  const fallback: ExpenseItem = {
    id: Date.now(),
    plaza_id: plaza.id,
    category: data.category,
    title: data.title.trim(),
    amount: data.amount,
    expense_date: data.expenseDate,
    payment_method: data.paymentMethod || "Cash",
    paid_to: data.paidTo?.trim() || null,
    receipt_voucher_no: receiptVoucherNo,
    is_recurring: Boolean(data.isRecurring),
    notes: data.notes?.trim() || null,
    created_at: new Date().toISOString(),
  };

  fallbackExpenses.unshift(fallback);
  return fallback;
}

export async function deletePlazaExpense(id: number | string): Promise<boolean> {
  try {
    await supabase.from("expenses").delete().eq("id", id);
  } catch (err) {
    // Fallback
  }

  fallbackExpenses = fallbackExpenses.filter((e) => e.id.toString() !== id.toString());
  return true;
}

export const createGeneralExpense = createPlazaExpense;
export const deleteGeneralExpense = deletePlazaExpense;

