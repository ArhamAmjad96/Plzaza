import { supabase } from "@/lib/supabase/server";
import { normalizeBillingMonth, getOrCreateTenantLedger } from "@/lib/ledgers/service";
import { getStore, updateStore } from "@/lib/storage/fileStore";

export type PaymentType = "RENT" | "ELECTRICITY" | "SECURITY" | "MAINTENANCE" | "OTHER";
export type PaymentMethod = "Cash" | "Bank Transfer" | "Online" | "Cheque" | "Other";

export interface PaymentTransaction {
  id: number | string;
  tenant_id?: number | string | null;
  lease_id?: number | string | null;
  ledger_id?: number | string | null;
  connection_id: number | string;
  payment_type: PaymentType;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_reference?: string | null;
  receipt_number: string;
  notes?: string | null;
  created_at?: string;
  tenant_name?: string;
  shop_name?: string;
  unit_name?: string;
  unit_number?: string;
}

export interface ReceiptData {
  receipt_number: string;
  payment_date: string;
  payment_amount: number;
  payment_type: PaymentType;
  payment_method: string;
  transaction_reference?: string | null;
  notes?: string | null;
  tenant_name: string;
  shop_name: string;
  unit_number?: string;
  reference_number?: string;
  billing_month: string;
  rent_amount: number;
  electricity_amount: number | null;
  previous_balance: number;
  maintenance_amount: number;
  other_charges: number;
  total_payable: number;
  total_paid: number;
  remaining_balance: number;
}

/**
 * Generates unique formatted Receipt Number (e.g. RCP-2608-00145)
 */
export function generateReceiptNumber(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RCP-${yy}${mm}-${randomSuffix}`;
}

/**
 * Records a categorized payment transaction and syncs ledger accounts
 */
export async function recordPaymentTransaction(params: {
  connectionId?: number | string;
  tenantId?: number | string;
  leaseId?: number | string | null;
  unitId?: number | string;
  billingMonth: string;
  paymentType?: PaymentType;
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  transactionReference?: string | null;
  notes?: string | null;
}): Promise<PaymentTransaction> {
  const {
    connectionId = 1,
    tenantId = null,
    leaseId = null,
    unitId = null,
    billingMonth,
    paymentType = "RENT",
    amount,
    paymentDate = new Date().toISOString().split("T")[0],
    paymentMethod = "Cash",
    transactionReference = null,
    notes = null,
  } = params;

  const month = normalizeBillingMonth(billingMonth);
  const receiptNumber = generateReceiptNumber(paymentDate);

  // 1. Insert Payment Row in Supabase if available
  let dbPayment: any = null;
  try {
    const { data: payment, error: insertErr } = await supabase
      .from("payments")
      .insert({
        connection_id: connectionId,
        tenant_id: tenantId,
        lease_id: leaseId,
        payment_type: paymentType,
        amount: amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_reference: transactionReference,
        receipt_number: receiptNumber,
        notes: notes,
      })
      .select()
      .maybeSingle();

    if (!insertErr && payment) {
      dbPayment = payment;
    }
  } catch {}

  const finalPayment: PaymentTransaction = dbPayment || {
    id: Date.now(),
    connection_id: connectionId,
    tenant_id: tenantId,
    lease_id: leaseId,
    payment_type: paymentType,
    amount,
    payment_date: paymentDate,
    payment_method: paymentMethod,
    transaction_reference: transactionReference,
    receipt_number: receiptNumber,
    notes,
    created_at: new Date().toISOString(),
  };

  // 2. Persist to fileStore
  updateStore((s) => {
    s.payments = [finalPayment, ...(s.payments || [])];

    if (paymentType === "SECURITY" && leaseId) {
      const idx = s.leases.findIndex((l) => l.id.toString() === leaseId.toString());
      if (idx !== -1) {
        const newPaid = Number(s.leases[idx].security_paid || 0) + amount;
        const secReq = Number(s.leases[idx].security_amount || 0);
        s.leases[idx].security_paid = newPaid;
        s.leases[idx].security_status = newPaid >= secReq && secReq > 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";
      }
    }
  });

  // 3. If Payment is for SECURITY in Supabase
  if (paymentType === "SECURITY" && leaseId) {
    try {
      const { data: lease } = await supabase.from("leases").select("security_paid, security_amount").eq("id", leaseId).single();
      if (lease) {
        const newPaid = Number(lease.security_paid || 0) + amount;
        const secReq = Number(lease.security_amount || 0);
        const newStatus = newPaid >= secReq && secReq > 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";
        await supabase.from("leases").update({ security_paid: newPaid, security_status: newStatus }).eq("id", leaseId);
      }
    } catch {}
  }

  return finalPayment;
}

/**
 * Retrieves all payments for a specific connection or tenant
 */
export async function getPaymentsForConnection(
  connectionId: number | string
): Promise<PaymentTransaction[]> {
  try {
    const { data: payments, error } = await supabase
      .from("payments")
      .select("*")
      .or(`connection_id.eq.${connectionId},tenant_id.eq.${connectionId}`)
      .order("payment_date", { ascending: false })
      .order("id", { ascending: false });

    if (!error && payments && payments.length > 0) {
      return payments.map((p) => ({
        ...p,
        payment_type: p.payment_type || "RENT",
      }));
    }
  } catch {}

  const store = getStore();
  const filtered = (store.payments || []).filter(
    (p) =>
      p.connection_id?.toString() === connectionId.toString() ||
      p.tenant_id?.toString() === connectionId.toString()
  );
  return filtered;
}

/**
 * Retrieves all payments for a specific tenant across all past and active leases
 */
export async function getPaymentsForTenant(
  tenantId: number | string
): Promise<PaymentTransaction[]> {
  try {
    const { data: payments, error } = await supabase
      .from("payments")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("payment_date", { ascending: false })
      .order("id", { ascending: false });

    if (!error && payments && payments.length > 0) {
      return payments.map((p) => ({
        ...p,
        payment_type: p.payment_type || "RENT",
      }));
    }
  } catch {}

  const store = getStore();
  return (store.payments || []).filter((p) => p.tenant_id?.toString() === tenantId.toString());
}

/**
 * Deletes / reverses a payment transaction and restores ledger remaining balance
 */
export async function deletePaymentTransaction(
  paymentId: number | string,
  connectionId: number | string,
  billingMonth: string
): Promise<boolean> {
  try {
    const { data: payment } = await supabase.from("payments").select("*").eq("id", paymentId).single();
    if (payment && payment.payment_type === "SECURITY" && payment.lease_id) {
      // Revert lease security_paid
      const { data: lease } = await supabase.from("leases").select("security_paid, security_amount").eq("id", payment.lease_id).single();
      if (lease) {
        const newPaid = Math.max(0, Number(lease.security_paid || 0) - Number(payment.amount || 0));
        const secReq = Number(lease.security_amount || 0);
        const newStatus = newPaid >= secReq && secReq > 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";
        await supabase.from("leases").update({ security_paid: newPaid, security_status: newStatus }).eq("id", payment.lease_id);
      }
    }

    const { error } = await supabase.from("payments").delete().eq("id", paymentId);
    if (error) throw error;

    // Recalculate ledger paid_amount
    const month = normalizeBillingMonth(billingMonth);
    const { data: remainingPayments } = await supabase.from("payments").select("amount").eq("connection_id", connectionId);
    const totalPaid = (remainingPayments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    await supabase
      .from("tenant_monthly_ledgers")
      .update({ paid_amount: totalPaid, updated_at: new Date().toISOString() })
      .eq("connection_id", connectionId)
      .eq("billing_month", month);

    return true;
  } catch (err) {
    console.error("Delete payment error:", err);
    return false;
  }
}

/**
 * Fetches complete receipt payload for printable and shareable receipt UI
 */
export async function getReceiptData(paymentId: number | string): Promise<ReceiptData | null> {
  const { data: payment, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (error || !payment) return null;

  const { data: connection } = await supabase
    .from("connections")
    .select("*")
    .eq("id", payment.connection_id)
    .maybeSingle();

  const billingMonth = normalizeBillingMonth(payment.payment_date);
  const ledger = await getOrCreateTenantLedger(payment.connection_id, billingMonth);

  return {
    receipt_number: payment.receipt_number,
    payment_date: payment.payment_date,
    payment_amount: Number(payment.amount),
    payment_type: payment.payment_type || "RENT",
    payment_method: payment.payment_method || "Cash",
    transaction_reference: payment.transaction_reference,
    notes: payment.notes,
    tenant_name: connection?.tenant || connection?.name || "Tenant",
    shop_name: connection?.name || "Unit",
    reference_number: connection?.reference_number,
    billing_month: billingMonth,
    rent_amount: ledger?.rent_amount || 0,
    electricity_amount: ledger?.electricity_amount || null,
    previous_balance: ledger?.previous_balance || 0,
    maintenance_amount: ledger?.maintenance_amount || 0,
    other_charges: ledger?.other_charges || 0,
    total_payable: ledger?.total_payable || 0,
    total_paid: ledger?.paid_amount || 0,
    remaining_balance: ledger?.remaining_balance || 0,
  };
}
