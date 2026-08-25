import { supabase } from "@/lib/supabase/server";
import { getMonthlyLedgers, normalizeBillingMonth, LedgerItem } from "@/lib/ledgers/service";
import { getPlazaExpenses, ExpenseItem } from "@/lib/expenses/service";
import { getTenantsWithLeases, TenantLeaseView } from "@/lib/tenants/service";
import { getAllComplaintExpensesMap } from "@/lib/complaints/expenses-service";

export interface ExpenseCategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface FinancialOverviewReport {
  selectedMonth: string;
  selectedMonthLabel: string;
  generatedAt: string;

  // P&L Net Cash Flow
  grossRevenue: number;
  rentCollected: number;
  otherIncome: number;
  totalOperatingExpenses: number;
  generalExpensesTotal: number;
  maintenanceExpensesTotal: number;
  netProfit: number;
  profitMarginPct: number;

  // Rent Collection Metrics
  totalRentExpected: number;
  totalRentCollected: number;
  totalRentOutstanding: number;
  rentCollectionRatePct: number;
  rentLedgers: LedgerItem[];

  // Electricity Utility Metrics
  totalElectricityBills: number;
  totalElectricityAmount: number;
  totalElectricityUnits: number;
  electricityPaidAmount: number;
  electricityOutstandingAmount: number;
  electricityBills: Array<{
    id: number | string;
    reference_number: string;
    connection_name: string;
    billing_month: string;
    units_consumed: number;
    bill_amount: number;
    status: string;
    due_date?: string;
  }>;

  // Security Deposit Registry
  totalSecurityHeld: number;
  totalSecurityRequired: number;
  securityDeposits: Array<{
    tenant_name: string;
    unit_name: string;
    floor: string;
    security_amount: number;
    security_paid: number;
    security_remaining: number;
    status: string;
  }>;

  // Expense Breakdown
  expenseCategories: ExpenseCategoryBreakdown[];
  expensesList: ExpenseItem[];
}

export async function getFinancialOverviewReport(
  monthInput?: string | null
): Promise<FinancialOverviewReport> {
  const selectedMonth = normalizeBillingMonth(monthInput);
  const now = new Date();
  const generatedAt = now.toLocaleString("en-PK", { timeZone: "Asia/Karachi" });

  const [
    { items: ledgers, stats: ledgerStats },
    { expenses, stats: expStats },
    { tenants },
    maintenanceExpenseMap,
    billsRes,
    connsRes,
  ] = await Promise.all([
    getMonthlyLedgers(selectedMonth),
    getPlazaExpenses(selectedMonth),
    getTenantsWithLeases(),
    getAllComplaintExpensesMap(),
    supabase.from("bills").select("*").order("billing_month", { ascending: false }),
    supabase.from("connections").select("*"),
  ]);

  const rawBills = billsRes.data || [];
  const rawConns = connsRes.data || [];

  const connsMap = new Map<string, any>();
  rawConns.forEach((c) => connsMap.set(c.id.toString(), c));

  // 1. REVENUE METRICS
  const rentCollected = ledgerStats.total_collected;
  const otherIncome = 0;
  const grossRevenue = rentCollected + otherIncome;

  // 2. EXPENSE METRICS
  const generalExpensesTotal = expStats.totalExpenses;
  const maintenanceExpensesTotal = Object.values(maintenanceExpenseMap).reduce((sum, v) => sum + v, 0);
  const totalOperatingExpenses = generalExpensesTotal + maintenanceExpensesTotal;

  // 3. NET CASH FLOW & PROFIT
  const netProfit = grossRevenue - totalOperatingExpenses;
  const profitMarginPct = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

  // 4. RENT COLLECTION
  const totalRentExpected = ledgerStats.total_expected;
  const totalRentCollected = ledgerStats.total_collected;
  const totalRentOutstanding = ledgerStats.total_outstanding;
  const rentCollectionRatePct = ledgerStats.collection_rate;

  // 5. ELECTRICITY UTILITY
  const monthBills = rawBills.filter(
    (b: any) => b.billing_month?.startsWith(selectedMonth.slice(0, 7))
  );
  const totalElectricityBills = monthBills.length;
  const totalElectricityAmount = monthBills.reduce((sum, b: any) => sum + Number(b.bill_amount || 0), 0);
  const totalElectricityUnits = monthBills.reduce((sum, b: any) => sum + Number(b.units_consumed || 0), 0);
  const electricityPaidAmount = monthBills
    .filter((b: any) => b.status === "paid")
    .reduce((sum, b: any) => sum + Number(b.bill_amount || 0), 0);
  const electricityOutstandingAmount = totalElectricityAmount - electricityPaidAmount;

  const formattedElectricityBills = monthBills.map((b: any) => {
    const conn = connsMap.get(b.connection_id?.toString());
    return {
      id: b.id,
      reference_number: conn?.reference_number || b.reference_number || "N/A",
      connection_name: conn?.name || "Electricity Meter",
      billing_month: b.billing_month,
      units_consumed: Number(b.units_consumed || 0),
      bill_amount: Number(b.bill_amount || 0),
      status: b.status || "unpaid",
      due_date: b.due_date,
    };
  });

  // 6. SECURITY DEPOSITS
  const activeTenants = tenants.filter((t) => t.is_active && t.lease);
  const totalSecurityHeld = activeTenants.reduce((sum, t) => sum + Number(t.lease?.security_paid || 0), 0);
  const totalSecurityRequired = activeTenants.reduce((sum, t) => sum + Number(t.lease?.security_amount || 0), 0);

  const securityDeposits = activeTenants.map((t) => {
    const secReq = Number(t.lease?.security_amount || 0);
    const secPaid = Number(t.lease?.security_paid || 0);
    const secRem = Math.max(0, secReq - secPaid);
    return {
      tenant_name: t.tenant.full_name,
      unit_name: t.unit?.unit_name || "Unit",
      floor: t.unit?.floor || "Plaza",
      security_amount: secReq,
      security_paid: secPaid,
      security_remaining: secRem,
      status: t.lease?.security_status || (secPaid >= secReq ? "PAID" : "PARTIAL"),
    };
  });

  // 7. EXPENSE BREAKDOWN BY CATEGORY
  const catMap: Record<string, number> = {};
  expenses.forEach((e) => {
    catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount || 0);
  });
  if (maintenanceExpensesTotal > 0) {
    catMap["Maintenance & Repairs"] = (catMap["Maintenance & Repairs"] || 0) + maintenanceExpensesTotal;
  }

  const expenseCategories: ExpenseCategoryBreakdown[] = Object.entries(catMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalOperatingExpenses > 0 ? Math.round((amount / totalOperatingExpenses) * 100) : 0,
  })).sort((a, b) => b.amount - a.amount);

  return {
    selectedMonth,
    selectedMonthLabel: selectedMonth,
    generatedAt,
    grossRevenue,
    rentCollected,
    otherIncome,
    totalOperatingExpenses,
    generalExpensesTotal,
    maintenanceExpensesTotal,
    netProfit,
    profitMarginPct,
    totalRentExpected,
    totalRentCollected,
    totalRentOutstanding,
    rentCollectionRatePct,
    rentLedgers: ledgers,
    totalElectricityBills,
    totalElectricityAmount,
    totalElectricityUnits,
    electricityPaidAmount,
    electricityOutstandingAmount,
    electricityBills: formattedElectricityBills,
    totalSecurityHeld,
    totalSecurityRequired,
    securityDeposits,
    expenseCategories,
    expensesList: expenses,
  };
}
