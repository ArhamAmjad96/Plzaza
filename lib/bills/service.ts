import { supabase } from "@/lib/supabase/server";
import { getStore, updateStore } from "@/lib/storage/fileStore";
import { formatMonthSlug } from "./bill-storage";

export interface ElectricityBillItem {
  id: number | string;
  connection_id: number | string;
  plaza_id?: number | string;
  unit_id?: number | string | null;
  reference_number: string;
  billing_month: string; // e.g. "2026-08-01"
  issue_date?: string | null;
  due_date?: string | null;
  bill_amount: number;
  amount_due?: number;
  late_payment_amount?: number | null;
  units_consumed?: number | null;
  present_reading?: number | null;
  previous_reading?: number | null;
  consumer_name?: string | null;
  meter_number?: string | null;
  tariff?: string | null;
  status: "paid" | "unpaid" | "overdue" | string;
  bill_file_path?: string | null;
  bill_file_url?: string | null;
  bill_image_url?: string | null; // backward compatibility
  pdf_url?: string | null;        // backward compatibility
  file_type?: string | null;
  source_url?: string | null;
  fetched_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SaveElectricityBillInput {
  connectionId: number | string;
  plazaId?: number | string;
  unitId?: number | string | null;
  referenceNumber: string;
  billingMonth: string;
  issueDate?: string | null;
  dueDate?: string | null;
  billAmount: number;
  latePaymentAmount?: number | null;
  unitsConsumed?: number | null;
  presentReading?: number | null;
  previousReading?: number | null;
  consumerName?: string | null;
  meterNumber?: string | null;
  tariff?: string | null;
  status?: string;
  billFilePath?: string | null;
  billFileUrl?: string | null;
  fileType?: string;
  sourceUrl?: string | null;
}

/**
 * Saves or updates a bill record in persistent memory, JSON fileStore, and Supabase.
 * Enforces uniqueness on (connection_id + billing_month) or (reference_number + billing_month).
 */
export async function saveElectricityBillRecord(
  input: SaveElectricityBillInput
): Promise<ElectricityBillItem> {
  const store = getStore();
  const plazaId = input.plazaId || store.plaza?.id || 1;
  const nowIso = new Date().toISOString();

  // Normalize billing month (e.g. "2026-08-01")
  const rawMonth = input.billingMonth || nowIso.slice(0, 7) + "-01";
  const normalizedMonth = rawMonth.length === 7 ? `${rawMonth}-01` : rawMonth;
  const cleanRef = input.referenceNumber.replace(/[^0-9]/g, "");

  // 1. Check existing bill in fileStore by (connection_id + month) or (reference_number + month)
  const existingBill = (store.bills || []).find(
    (b: any) =>
      (b.connection_id?.toString() === input.connectionId.toString() ||
        (b.reference_number && b.reference_number.replace(/[^0-9]/g, "") === cleanRef)) &&
      formatMonthSlug(b.billing_month) === formatMonthSlug(normalizedMonth)
  );

  const billId = existingBill ? existingBill.id : Date.now();

  const billRecord: ElectricityBillItem = {
    id: billId,
    connection_id: input.connectionId,
    plaza_id: plazaId,
    unit_id: input.unitId ?? existingBill?.unit_id ?? null,
    reference_number: cleanRef,
    billing_month: normalizedMonth,
    issue_date: input.issueDate || existingBill?.issue_date || nowIso.split("T")[0],
    due_date: input.dueDate || existingBill?.due_date || null,
    bill_amount: Number(input.billAmount || existingBill?.bill_amount || 0),
    amount_due: Number(input.billAmount || existingBill?.bill_amount || 0),
    late_payment_amount: input.latePaymentAmount ?? existingBill?.late_payment_amount ?? null,
    units_consumed: input.unitsConsumed ?? existingBill?.units_consumed ?? 0,
    present_reading: input.presentReading ?? existingBill?.present_reading ?? null,
    previous_reading: input.previousReading ?? existingBill?.previous_reading ?? null,
    consumer_name: input.consumerName || existingBill?.consumer_name || null,
    meter_number: input.meterNumber || existingBill?.meter_number || null,
    tariff: input.tariff || existingBill?.tariff || null,
    status: input.status || existingBill?.status || "unpaid",
    bill_file_path: input.billFilePath || existingBill?.bill_file_path || null,
    bill_file_url: input.billFileUrl || existingBill?.bill_file_url || null,
    bill_image_url: input.billFileUrl || existingBill?.bill_image_url || null,
    pdf_url: input.billFileUrl || existingBill?.pdf_url || null,
    file_type: input.fileType || existingBill?.file_type || "image/png",
    source_url: input.sourceUrl || existingBill?.source_url || null,
    fetched_at: nowIso,
    created_at: existingBill?.created_at || nowIso,
    updated_at: nowIso,
  };

  // 2. Persist to local JSON Store
  updateStore((s) => {
    const idx = (s.bills || []).findIndex(
      (b: any) =>
        b.id?.toString() === billId.toString() ||
        ((b.connection_id?.toString() === input.connectionId.toString() ||
          (b.reference_number && b.reference_number.replace(/[^0-9]/g, "") === cleanRef)) &&
          formatMonthSlug(b.billing_month) === formatMonthSlug(normalizedMonth))
    );

    if (idx !== -1) {
      s.bills[idx] = { ...s.bills[idx], ...billRecord };
    } else {
      s.bills = [billRecord, ...(s.bills || [])];
    }
  });

  // 3. Persist to Supabase 'bills' / 'electricity_bills' table
  try {
    const supabasePayload = {
      connection_id: input.connectionId,
      billing_month: normalizedMonth,
      issue_date: billRecord.issue_date,
      due_date: billRecord.due_date,
      bill_amount: billRecord.bill_amount,
      units_consumed: billRecord.units_consumed,
      present_reading: billRecord.present_reading,
      previous_reading: billRecord.previous_reading,
      meter_number: billRecord.meter_number,
      tariff: billRecord.tariff,
      status: billRecord.status,
      bill_image_url: billRecord.bill_file_url,
      pdf_url: billRecord.bill_file_url,
    };

    await supabase.from("bills").upsert(supabasePayload, {
      onConflict: "connection_id,billing_month",
    });
  } catch (err) {
    // Non-blocking fallback
  }

  return billRecord;
}

/**
 * Retrieves all historical bills for a connection, ordered latest month first
 */
export async function getBillsForConnection(
  connectionId: number | string
): Promise<ElectricityBillItem[]> {
  const store = getStore();
  let bills: ElectricityBillItem[] = (store.bills || []).filter(
    (b: any) => b.connection_id?.toString() === connectionId.toString()
  );

  try {
    const { data: supaBills, error } = await supabase
      .from("bills")
      .select("*")
      .eq("connection_id", connectionId)
      .order("billing_month", { ascending: false });

    if (!error && supaBills && supaBills.length > 0) {
      // Merge unique bills from Supabase and local store
      const map = new Map<string, ElectricityBillItem>();
      supaBills.forEach((b: any) => {
        const item: ElectricityBillItem = {
          ...b,
          bill_amount: Number(b.bill_amount || 0),
          bill_file_url: b.bill_image_url || b.pdf_url || b.bill_file_url,
        };
        map.set(formatMonthSlug(b.billing_month), item);
      });

      bills.forEach((b) => {
        const key = formatMonthSlug(b.billing_month);
        if (!map.has(key)) {
          map.set(key, b);
        } else {
          // Merge missing local fields
          const existing = map.get(key)!;
          map.set(key, { ...existing, ...b, bill_file_url: b.bill_file_url || existing.bill_file_url });
        }
      });

      bills = Array.from(map.values());
    }
  } catch {}

  // Sort descending by billing month
  return bills.sort((a, b) => b.billing_month.localeCompare(a.billing_month));
}

/**
 * Retrieves all historical bills for a specific unit
 */
export async function getBillsForUnit(unitId: number | string): Promise<{
  bills: ElectricityBillItem[];
  connection_id?: number | string;
  reference_number?: string;
  is_shared: boolean;
  split_value: number;
}> {
  const store = getStore();
  const mapping = (store.connection_unit_mappings || []).find(
    (m: any) => m.unit_id?.toString() === unitId.toString()
  );

  const unit = (store.units || []).find((u: any) => u.id?.toString() === unitId.toString());
  const ref = mapping
    ? (store.connections || []).find((c: any) => c.id?.toString() === mapping.connection_id?.toString())?.reference_number
    : (unit as any)?.reference_number;

  const connectionId = mapping?.connection_id || (unit as any)?.id;

  if (!connectionId && !ref) {
    return { bills: [], is_shared: false, split_value: 100 };
  }

  let bills: ElectricityBillItem[] = [];
  if (connectionId) {
    bills = await getBillsForConnection(connectionId);
  }

  // Also look up by reference number if bills list is empty
  if (bills.length === 0 && ref) {
    const cleanRef = ref.replace(/[^0-9]/g, "");
    bills = (store.bills || []).filter(
      (b: any) => b.reference_number && b.reference_number.replace(/[^0-9]/g, "") === cleanRef
    );
  }

  return {
    bills: bills.sort((a, b) => b.billing_month.localeCompare(a.billing_month)),
    connection_id: connectionId,
    reference_number: ref,
    is_shared: Number(mapping?.split_value || 100) < 100,
    split_value: Number(mapping?.split_value || 100),
  };
}

/**
 * Gets a single bill by ID or reference and month
 */
export async function getBillById(
  id: number | string
): Promise<ElectricityBillItem | null> {
  const store = getStore();
  const bill = (store.bills || []).find((b: any) => b.id?.toString() === id.toString());
  if (bill) return bill;

  try {
    const { data: supaBill } = await supabase
      .from("bills")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (supaBill) {
      return {
        ...supaBill,
        bill_amount: Number(supaBill.bill_amount || 0),
        bill_file_url: supaBill.bill_image_url || supaBill.pdf_url || supaBill.bill_file_url,
      };
    }
  } catch {}

  return null;
}
