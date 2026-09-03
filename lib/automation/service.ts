import { supabase } from "@/lib/supabase/server";
import { generateMonthlyChargesAll, normalizeBillingMonth } from "@/lib/ledgers/service";
import { getTenantsWithLeases } from "@/lib/tenants/service";
import { fetchIescoBillHtml } from "@/lib/iesco/fetch-bill";
import { parseBill } from "@/lib/iesco/parse-bill";
import { generateBillImage } from "@/lib/iesco/generate-image";
import { storeBillImage } from "@/lib/iesco/save-bill-image";

export interface RentEscalationCandidate {
  lease_id: number | string;
  tenant_id: number | string;
  tenant_name: string;
  unit_name: string;
  current_rent: number;
  annual_increase_pct: number;
  new_rent: number;
  next_escalation_date: string;
  is_due_now: boolean;
}

export interface AutomationRunStatus {
  last_ledger_generation?: string;
  last_bill_sync?: string;
  total_active_tenants: number;
  total_connections: number;
  eligible_escalations: number;
}

function parseBillingMonth(value: string | null) {
  if (!value) return null;

  const match = value
    .trim()
    .toUpperCase()
    .match(/^([A-Z]{3})\s+(\d{2})$/);

  if (!match) return null;

  const monthMap: Record<string, number> = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };

  const month = monthMap[match[1]];
  if (month === undefined) return null;

  const year = 2000 + Number(match[2]);
  return new Date(Date.UTC(year, month, 1));
}

import { isLeaseActiveInMonth } from "@/lib/ledgers/service";
import { logActivity } from "@/lib/logs/service";
import { getStore, updateStore } from "@/lib/storage/fileStore";

/**
 * 1. AUTOMATIC MONTH-START RENT RECORD GENERATION
 * Enforces (lease_id + billing_month) uniqueness.
 * Sets due date strictly to 10th of every month.
 * Skips existing records without resetting payment states.
 */
export async function generateMonthlyRentForActiveLeases(monthInput?: string | null) {
  const month = normalizeBillingMonth(monthInput);
  const [year, monthNum] = month.split("-").map(Number);
  const dueDay = 10;
  const dueDateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`;

  const { tenants } = await getTenantsWithLeases();
  const activeCandidates = tenants.filter(
    (tv) => tv.is_active && tv.lease && tv.unit && isLeaseActiveInMonth(tv.lease, month)
  );

  const logs: string[] = [];
  let createdCount = 0;
  let skippedCount = 0;

  // 1. Fetch existing ledger records from DB and local store
  const { data: dbExisting } = await supabase
    .from("tenant_monthly_ledgers")
    .select("tenant_name, connection_id, billing_month")
    .eq("billing_month", month);

  const store = getStore();
  const existingLedgerRows = dbExisting || [];

  for (const tv of activeCandidates) {
    const { tenant, lease, unit } = tv;
    if (!lease || !unit) continue;

    // Check if record already exists for this tenant/lease in this billing month
    const alreadyExists =
      existingLedgerRows.some(
        (r: any) =>
          (tv.connection_id && r.connection_id?.toString() === tv.connection_id?.toString()) ||
          r.tenant_name?.toLowerCase() === tenant.full_name.toLowerCase()
      ) ||
      (store.monthly_ledgers || []).some(
        (l: any) =>
          (l.tenant_id?.toString() === tenant.id?.toString() ||
            l.lease_id?.toString() === lease.id?.toString() ||
            l.tenant_name?.toLowerCase() === tenant.full_name.toLowerCase()) &&
          l.billing_month?.slice(0, 7) === month.slice(0, 7)
      );

    if (alreadyExists) {
      skippedCount++;
      logs.push(`Skipped ${tenant.full_name} (${unit.unit_name}): rent record for ${month.slice(0, 7)} already exists.`);
      continue;
    }

    const rentAmount = Number(lease.monthly_rent || unit.default_monthly_rent || 0);

    // Persist new rent record to Supabase
    try {
      await supabase.from("tenant_monthly_ledgers").insert({
        connection_id: tv.connection_id || unit.id,
        tenant_name: tenant.full_name,
        billing_month: month,
        rent_amount: rentAmount,
        maintenance_amount: 0,
        other_charges: 0,
        paid_amount: 0,
        notes: `Auto-generated monthly rent. Due on ${dueDateStr}`,
      });
    } catch {
      // Non-blocking fallback
    }

    // Persist to local JSON fallback store
    updateStore((s) => {
      if (!s.monthly_ledgers) s.monthly_ledgers = [];
      s.monthly_ledgers.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        tenant_id: tenant.id,
        lease_id: lease.id,
        unit_id: unit.id,
        connection_id: tv.connection_id || unit.id,
        tenant_name: tenant.full_name,
        unit_name: unit.unit_name,
        billing_month: month,
        rent_amount: rentAmount,
        rent_due_date: dueDateStr,
        rent_paid: 0,
        rent_status: "UNPAID",
        total_payable: rentAmount,
        paid_amount: 0,
        remaining_balance: rentAmount,
        status: "unpaid",
        created_at: new Date().toISOString(),
      });
    });

    createdCount++;
    logs.push(`✓ Generated rent of PKR ${rentAmount.toLocaleString()} for ${tenant.full_name} (${unit.unit_name}) due on ${dueDateStr}.`);
  }

  // Record audit log
  await logActivity({
    category: "SYSTEM",
    action: "MONTHLY_RENT_AUTO_GENERATED",
    title: `Monthly Rent Generated for ${month.slice(0, 7)}`,
    description: `Auto-generated ${createdCount} new rent record(s), ${skippedCount} existing skipped. Due date: ${dueDateStr}.`,
    metadata: { month, dueDate: dueDateStr, createdCount, skippedCount },
  });

  return {
    success: true,
    month,
    dueDate: dueDateStr,
    totalLeasesChecked: activeCandidates.length,
    createdCount,
    generatedCount: createdCount,
    skippedCount,
    logs,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 1. AUTOMATIC MONTH-START LEDGER GENERATION (Unified Wrapper)
 */
export async function runMonthlyLedgerAutomation(monthInput?: string | null) {
  return generateMonthlyRentForActiveLeases(monthInput);
}

/**
 * 2. AUTOMATIC PLAZA-WIDE IESCO BILL SYNC
 */
/**
 * 2. AUTOMATIC PLAZA-WIDE IESCO BILL SYNC
 * Iterates through all active connections, fetches live bills via saved 14-digit reference numbers,
 * stores bill images persistently, enforces (connection_id + billing_month) uniqueness,
 * and maintains failure isolation across connections.
 */
export async function runPlazaWideIESCOBillSync() {
  const { getConnectionsWithMappings } = await import("@/lib/electricity/service");
  let connections = await getConnectionsWithMappings();
  let activeConnections = connections.filter((c) => c.active && c.reference_number);

  // Fallback to store/Supabase directly if mappings empty
  if (activeConnections.length === 0) {
    const store = getStore();
    const fallbackConns = store.connections || [];
    if (fallbackConns.length > 0) {
      activeConnections = fallbackConns.filter((c: any) => c.active && c.reference_number);
    } else {
      const { data: dbConns } = await supabase
        .from("connections")
        .select("*")
        .eq("active", true);
      activeConnections = (dbConns || []).filter((c: any) => c.reference_number);
    }
  }

  if (activeConnections.length === 0) {
    return {
      success: true,
      totalChecked: 0,
      totalSynced: 0,
      totalSkipped: 0,
      totalFailed: 0,
      logs: ["No active electricity connections with reference numbers found."],
      timestamp: new Date().toISOString(),
    };
  }

  const logs: string[] = [];
  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (const conn of activeConnections) {
    const cleanRef = (conn.reference_number || "").replace(/[^0-9]/g, "");
    const connName = conn.name || `Connection #${cleanRef}`;

    if (!cleanRef || cleanRef.length < 10) {
      logs.push(`⚠ Skipped ${connName}: invalid reference number (${conn.reference_number}).`);
      skipped++;
      continue;
    }

    logs.push(`Checking reference #${cleanRef} (${connName})...`);

    // Failure isolation with up to 2 retries for transient scraping errors
    let html: string | null = null;
    let scrapeError: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        html = await fetchIescoBillHtml(cleanRef);
        if (html) break;
      } catch (err: any) {
        scrapeError = err;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500)); // Brief pause before retry
        }
      }
    }

    if (!html) {
      logs.push(`✕ Error checking ${connName}: ${scrapeError?.message || "Failed to retrieve IESCO bill."}`);
      failed++;
      continue;
    }

    try {
      const parsed = parseBill(html);
      if (!parsed || !parsed.bill_month) {
        logs.push(`⚠ Could not parse valid bill for ${connName}.`);
        failed++;
        continue;
      }

      const billMonthDate = parseBillingMonth(parsed.bill_month);
      if (!billMonthDate) {
        logs.push(`⚠ Invalid billing month format: ${parsed.bill_month}`);
        failed++;
        continue;
      }

      const billingMonthStr = billMonthDate.toISOString().split("T")[0];
      const billAmount = Number(parsed.grand_total || 0);

      // Check if bill already exists in Supabase or local store
      const store = getStore();
      const existingInStore = (store.bills || []).some(
        (b: any) =>
          (b.connection_id?.toString() === conn.id.toString() ||
            (b.reference_number && b.reference_number.replace(/[^0-9]/g, "") === cleanRef)) &&
          b.billing_month?.slice(0, 7) === billingMonthStr.slice(0, 7)
      );

      const { data: dbExisting } = await supabase
        .from("bills")
        .select("id")
        .eq("connection_id", conn.id)
        .eq("billing_month", billingMonthStr)
        .maybeSingle();

      if (existingInStore || dbExisting) {
        skipped++;
        logs.push(`Bill for ${billingMonthStr} already exists for ${connName}.`);
        continue;
      }

      // Generate screenshot and store persistently
      let billImageUrl: string | null = null;
      try {
        const pngBuffer = await generateBillImage(html);
        billImageUrl = await storeBillImage(pngBuffer, conn.id, billingMonthStr, cleanRef);
      } catch {
        // Non-blocking fallback
      }

      const { saveElectricityBillRecord } = await import("@/lib/bills/service");
      await saveElectricityBillRecord({
        connectionId: conn.id,
        referenceNumber: cleanRef,
        billingMonth: billingMonthStr,
        billAmount: billAmount,
        dueDate: parsed.due_date,
        unitsConsumed: parsed.units_consumed,
        presentReading: parsed.present_reading,
        previousReading: parsed.previous_reading,
        meterNumber: parsed.meter_number || conn.meter_number || null,
        tariff: parsed.tariff,
        consumerName: parsed.name_address || connName,
        billFileUrl: billImageUrl,
        status: "unpaid",
      });

      synced++;
      logs.push(`✓ Synced new bill of PKR ${billAmount.toLocaleString()} for ${billingMonthStr} (${connName}).`);
    } catch (err: any) {
      logs.push(`✕ Processing error for ${connName}: ${err?.message || String(err)}`);
      failed++;
    }
  }

  // Audit activity log
  await logActivity({
    category: "ELECTRICITY",
    action: "IESCO_BILLS_SYNCED",
    title: "Plaza-wide Electricity Bill Sync",
    description: `Checked ${activeConnections.length} connection(s): ${synced} new bill(s) synced, ${skipped} skipped, ${failed} failed.`,
    metadata: { totalChecked: activeConnections.length, synced, skipped, failed },
  });

  return {
    success: true,
    totalChecked: activeConnections.length,
    totalSynced: synced,
    totalSkipped: skipped,
    totalFailed: failed,
    logs,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 3. ANNUAL RENT ESCALATION TRACKING & RULES
 */
export async function getEligibleRentEscalations(): Promise<RentEscalationCandidate[]> {
  const { tenants } = await getTenantsWithLeases();
  const activeTenants = tenants.filter((t) => t.is_active && t.lease);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const candidates: RentEscalationCandidate[] = [];

  for (const tv of activeTenants) {
    const { tenant, lease, unit } = tv;
    if (!lease) continue;

    const currentRent = Number(lease.monthly_rent || 0);
    const increasePct = Number(lease.annual_increase_pct || 10);
    const newRent = Math.round(currentRent * (1 + increasePct / 100));

    // Determine next escalation date
    let nextEscDateStr = lease.next_escalation_date;
    if (!nextEscDateStr) {
      const baseDate = new Date(lease.lease_start_date || lease.move_in_date || today);
      baseDate.setFullYear(baseDate.getFullYear() + 1);
      nextEscDateStr = baseDate.toISOString().split("T")[0];
    }

    const nextEscDate = new Date(nextEscDateStr);
    nextEscDate.setHours(0, 0, 0, 0);

    // If due within next 60 days or overdue
    const diffDays = Math.round((nextEscDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isDueNow = diffDays <= 0;

    if (diffDays <= 60) {
      candidates.push({
        lease_id: lease.id,
        tenant_id: tenant.id,
        tenant_name: tenant.full_name,
        unit_name: unit?.unit_name || "Unit",
        current_rent: currentRent,
        annual_increase_pct: increasePct,
        new_rent: newRent,
        next_escalation_date: nextEscDateStr,
        is_due_now: isDueNow,
      });
    }
  }

  return candidates.sort((a, b) => a.next_escalation_date.localeCompare(b.next_escalation_date));
}

/**
 * Applies scheduled annual rent escalation to a lease
 */
export async function applyRentEscalation(leaseId: number | string, customNewRent?: number) {
  const { data: lease } = await supabase.from("leases").select("*").eq("id", leaseId).single();
  if (!lease) throw new Error("Lease not found.");

  const currentRent = Number(lease.monthly_rent || 0);
  const increasePct = Number(lease.annual_increase_pct || 10);
  const targetRent = customNewRent || Math.round(currentRent * (1 + increasePct / 100));

  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const { error } = await supabase
    .from("leases")
    .update({
      monthly_rent: targetRent,
      last_escalation_date: today.toISOString().split("T")[0],
      next_escalation_date: nextYear.toISOString().split("T")[0],
      updated_at: today.toISOString(),
    })
    .eq("id", leaseId);

  if (error) throw error;
  return { success: true, oldRent: currentRent, newRent: targetRent };
}
