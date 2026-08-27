import { supabase } from "@/lib/supabase/server";
import { getTenantsWithLeases } from "@/lib/tenants/service";
import { getUnitAllocatedElectricityBill } from "@/lib/electricity/service";
import { getStore } from "@/lib/storage/fileStore";

export type PaymentStatus = "paid" | "partially_paid" | "unpaid" | "overdue";
export type IndependentStatus = "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE";

export interface LedgerItem {
  // Identification
  id?: number | string;
  account_id?: number | string;
  tenant_id?: number | string;
  lease_id?: number | string;
  unit_id?: number | string;
  connection_id: number;
  tenant_name: string;
  shop_name: string;
  unit_number?: string;
  unit_type?: string;
  floor?: string;
  reference_number?: string;
  billing_month: string;

  // Rent metrics
  rent_amount: number;
  rent_due_date?: string;
  rent_paid: number;
  rent_status: IndependentStatus;

  // Electricity metrics (with split support)
  electricity_amount: number | null;
  electricity_due_date?: string | null;
  electricity_paid: number;
  electricity_status: IndependentStatus;
  has_electricity_bill: boolean;
  electricity_is_shared?: boolean;
  split_formula?: string;

  // Security deposit metrics
  security_required: number;
  security_paid: number;
  security_remaining: number;
  security_status: "PAID" | "PARTIAL" | "UNPAID";

  // Additional charges & prior balance
  maintenance_amount: number;
  other_charges: number;
  previous_balance: number;

  // Overall totals
  total_payable: number;
  paid_amount: number;
  remaining_balance: number;
  status: PaymentStatus;
  notes?: string | null;
}

export interface LedgerStats {
  total_expected: number;
  total_collected: number;
  total_outstanding: number;
  electricity_outstanding: number;
  collection_rate: number;
  total_active_accounts: number;
  paid_count: number;
  partial_count: number;
  unpaid_count: number;
  overdue_count: number;
}

/**
 * Normalizes any month string (e.g. "2026-08" or "2026-08-15") into "2026-08-01"
 */
export function normalizeBillingMonth(monthInput?: string | null): string {
  if (!monthInput) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  }
  const clean = monthInput.trim().slice(0, 7);
  return `${clean}-01`;
}

/**
 * Evaluates independent charge status (Rent or Electricity)
 */
export function evaluateIndependentStatus(
  amount: number | null,
  paid: number,
  dueDateStr?: string | null
): IndependentStatus {
  if (amount === null || amount === undefined || amount <= 0) {
    return paid > 0 ? "PAID" : "UNPAID";
  }

  if (paid >= amount) return "PAID";
  if (paid > 0) return "PARTIAL";

  if (dueDateStr) {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    if (today > dueDate) return "OVERDUE";
  }

  return "UNPAID";
}

/**
 * Evaluates single source of truth overall ledger status
 */
export function calculateLedgerStatus(
  totalPayable: number,
  paidAmount: number,
  dueDateStr?: string | null
): PaymentStatus {
  const remaining = totalPayable - paidAmount;
  if (remaining <= 0) return "paid";
  if (paidAmount > 0) return "partially_paid";

  if (dueDateStr) {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    if (today > dueDate) return "overdue";
  }

  return "unpaid";
}

/**
 * Retrieves all monthly tenant accounts & financial ledgers with independent statuses
 */
export async function getMonthlyLedgers(
  billingMonthInput?: string | null,
  statusFilter?: string | null
): Promise<{ items: LedgerItem[]; stats: LedgerStats }> {
  const billingMonth = normalizeBillingMonth(billingMonthInput);
  const [year, month] = billingMonth.split("-").map(Number);

  // 1. Fetch tenants with leases and existing connections in parallel
  const [{ tenants }, connsRes, paymentsRes, customLedgerRowsRes] = await Promise.all([
    getTenantsWithLeases(),
    supabase.from("connections").select("*"),
    supabase.from("payments").select("*"),
    supabase
      .from("tenant_monthly_ledgers")
      .select("*")
      .eq("billing_month", billingMonth),
  ]);

  const activeTenants = tenants.filter((tv) => tv.is_active && tv.unit);
  const connections = connsRes.data || [];
  const store = getStore();

  let allPayments: any[] = store.payments || [];
  if (paymentsRes.data && paymentsRes.data.length > 0) {
    allPayments = paymentsRes.data;
  }

  const customRows = customLedgerRowsRes.data || [];

  const items: LedgerItem[] = [];

  for (const tv of activeTenants) {
    const { tenant, lease, unit } = tv;
    if (!unit || !lease) continue;

    // A. Rent calculation
    const rentAmount = Number(lease.monthly_rent || unit.default_monthly_rent || 0);
    const rentDueDay = Number(lease.rent_due_day || 5);
    const rentDueDateStr = `${year}-${String(month).padStart(2, "0")}-${String(rentDueDay).padStart(2, "0")}`;

    // B. Electricity allocation via Phase 3 mapping
    const elecData = await getUnitAllocatedElectricityBill(unit.id, billingMonth);
    const elecAmount = elecData.bill_amount;
    const hasElecBill = elecAmount !== null;
    const elecDueDateStr = `${year}-${String(month).padStart(2, "0")}-18`; // IESCO standard due window

    // C. Security info
    const secReq = Number(lease.security_amount || 0);
    const secPaid = Number(lease.security_paid || 0);
    const secRem = Math.max(0, secReq - secPaid);
    const secStatus = lease.security_status || (secPaid >= secReq ? "PAID" : secPaid > 0 ? "PARTIAL" : "UNPAID");

    // D. Maintenance & other charges
    const customRow = customRows.find(
      (r: any) =>
        (tv.connection_id && r.connection_id?.toString() === tv.connection_id?.toString()) ||
        r.tenant_name?.toLowerCase() === tenant.full_name.toLowerCase()
    );

    const maintenanceAmount = Number(customRow?.maintenance_amount || 0);
    const otherCharges = Number(customRow?.other_charges || 0);
    const previousBalance = 0; // Dynamic carryover

    // E. Total Payable
    const effectiveElec = elecAmount !== null ? elecAmount : 0;
    const totalPayable = rentAmount + effectiveElec + maintenanceAmount + otherCharges + previousBalance;

    // F. Payments recorded
    const targetMonthPrefix = billingMonth.slice(0, 7);
    const connPayments = allPayments.filter((p: any) => {
      const matchesEntity =
        (tenant?.id && p.tenant_id?.toString() === tenant.id.toString()) ||
        (lease?.id && p.lease_id?.toString() === lease.id.toString()) ||
        (unit?.id && (p.unit_id?.toString() === unit.id.toString() || p.connection_id?.toString() === unit.id.toString())) ||
        (tv.connection_id && p.connection_id?.toString() === tv.connection_id.toString()) ||
        (p.tenant_name && p.tenant_name.toLowerCase().trim() === tenant.full_name.toLowerCase().trim());

      if (!matchesEntity) return false;

      const pMonth = p.billing_month ? p.billing_month.slice(0, 7) : (p.payment_date ? p.payment_date.slice(0, 7) : "");
      return !pMonth || pMonth === targetMonthPrefix;
    });

    const totalPaid = connPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const remainingBalance = Math.max(0, totalPayable - totalPaid);

    // G. Independent Statuses
    const rentPaidAmount = Math.min(rentAmount, totalPaid);
    const elecPaidAmount = Math.max(0, Math.min(effectiveElec, totalPaid - rentAmount));

    const rentStatus = evaluateIndependentStatus(rentAmount, rentPaidAmount, rentDueDateStr);
    const electricityStatus = hasElecBill
      ? evaluateIndependentStatus(elecAmount, elecPaidAmount, elecDueDateStr)
      : "UNPAID";

    const overallStatus = calculateLedgerStatus(totalPayable, totalPaid, rentDueDateStr);

    items.push({
      tenant_id: tenant.id,
      lease_id: lease.id,
      unit_id: unit.id,
      connection_id: Number(tv.connection_id || unit.id),
      tenant_name: tenant.full_name,
      shop_name: unit.unit_name,
      unit_number: unit.unit_number,
      unit_type: unit.unit_type,
      floor: unit.floor,
      reference_number: elecData.connection_reference,
      billing_month: billingMonth,

      rent_amount: rentAmount,
      rent_due_date: rentDueDateStr,
      rent_paid: rentPaidAmount,
      rent_status: rentStatus,

      electricity_amount: elecAmount,
      electricity_due_date: hasElecBill ? elecDueDateStr : null,
      electricity_paid: elecPaidAmount,
      electricity_status: electricityStatus,
      has_electricity_bill: hasElecBill,
      electricity_is_shared: elecData.is_shared,
      split_formula: elecData.split_formula,

      security_required: secReq,
      security_paid: secPaid,
      security_remaining: secRem,
      security_status: secStatus,

      maintenance_amount: maintenanceAmount,
      other_charges: otherCharges,
      previous_balance: previousBalance,

      total_payable: totalPayable,
      paid_amount: totalPaid,
      remaining_balance: remainingBalance,
      status: overallStatus,
      notes: customRow?.notes || null,
    });
  }

  // Filter items by status if requested
  const filteredItems = items.filter((item) => {
    if (!statusFilter || statusFilter === "all") return true;
    return item.status === statusFilter;
  });

  // Calculate high-level collection stats
  const total_expected = items.reduce((sum, i) => sum + i.total_payable, 0);
  const total_collected = items.reduce((sum, i) => sum + i.paid_amount, 0);
  const total_outstanding = items.reduce((sum, i) => sum + i.remaining_balance, 0);
  const electricity_outstanding = items.reduce(
    (sum, i) => sum + (i.electricity_amount !== null ? Math.max(0, i.electricity_amount - i.electricity_paid) : 0),
    0
  );
  const collection_rate = total_expected > 0 ? Math.round((total_collected / total_expected) * 100) : 0;

  const paid_count = items.filter((i) => i.status === "paid").length;
  const partial_count = items.filter((i) => i.status === "partially_paid").length;
  const unpaid_count = items.filter((i) => i.status === "unpaid").length;
  const overdue_count = items.filter((i) => i.status === "overdue").length;

  return {
    items: filteredItems,
    stats: {
      total_expected,
      total_collected,
      total_outstanding,
      electricity_outstanding,
      collection_rate,
      total_active_accounts: items.length,
      paid_count,
      partial_count,
      unpaid_count,
      overdue_count,
    },
  };
}

/**
 * Compatibility helper for existing single tenant ledger queries
 */
export async function getOrCreateTenantLedger(
  connectionId: number | string,
  billingMonthInput?: string | null
): Promise<LedgerItem | null> {
  const month = normalizeBillingMonth(billingMonthInput);
  const { items } = await getMonthlyLedgers(month);
  return items.find((i) => i.connection_id.toString() === connectionId.toString() || i.unit_id?.toString() === connectionId.toString()) || items[0] || null;
}

/**
 * Batch generates monthly ledger records for all active tenants
 */
export async function generateMonthlyChargesAll(billingMonthStr: string): Promise<number> {
  const month = normalizeBillingMonth(billingMonthStr);
  const { items } = await getMonthlyLedgers(month);

  let count = 0;
  for (const item of items) {
    await supabase.from("tenant_monthly_ledgers").upsert(
      {
        connection_id: item.connection_id,
        tenant_name: item.tenant_name,
        billing_month: month,
        rent_amount: item.rent_amount,
        maintenance_amount: item.maintenance_amount,
        other_charges: item.other_charges,
        paid_amount: item.paid_amount,
        notes: item.notes,
      },
      { onConflict: "connection_id,billing_month" }
    );
    count++;
  }

  return count;
}

/**
 * Returns all monthly ledger items as a flat array
 */
export async function getMonthlyLedgersAll(billingMonthStr?: string | null): Promise<LedgerItem[]> {
  const { items } = await getMonthlyLedgers(billingMonthStr);
  return items;
}
