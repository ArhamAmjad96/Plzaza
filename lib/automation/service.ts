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

/**
 * 1. AUTOMATIC MONTH-START LEDGER GENERATION
 */
export async function runMonthlyLedgerAutomation(monthInput?: string | null) {
  const month = normalizeBillingMonth(monthInput);
  const count = await generateMonthlyChargesAll(month);
  return {
    success: true,
    month,
    generatedCount: count,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 2. AUTOMATIC PLAZA-WIDE IESCO BILL SYNC
 */
export async function runPlazaWideIESCOBillSync() {
  const { data: connections, error } = await supabase
    .from("connections")
    .select("*")
    .eq("active", true);

  if (error || !connections || connections.length === 0) {
    return { totalChecked: 0, totalSynced: 0, totalFailed: 0, logs: ["No active connections found."] };
  }

  const logs: string[] = [];
  let synced = 0;
  let failed = 0;

  for (const conn of connections) {
    try {
      logs.push(`Checking reference #${conn.reference_number} (${conn.name})...`);

      const html = await fetchIescoBillHtml(conn.reference_number);
      const parsed = parseBill(html);

      if (!parsed || !parsed.bill_month) {
        logs.push(`⚠ Could not parse valid bill for ${conn.name}.`);
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

      // Check if bill already exists in DB
      const { data: existingBill } = await supabase
        .from("bills")
        .select("id")
        .eq("connection_id", conn.id)
        .eq("billing_month", billingMonthStr)
        .maybeSingle();

      if (!existingBill) {
        // Generate screenshot if needed
        let billImageUrl: string | null = null;
        try {
          const pngBuffer = await generateBillImage(html);
          billImageUrl = await storeBillImage(pngBuffer, conn.id, billingMonthStr);
        } catch {
          // Non-blocking
        }

        // Insert new bill
        const { error: insertErr } = await supabase
          .from("bills")
          .insert({
            connection_id: conn.id,
            billing_month: billingMonthStr,
            bill_amount: billAmount,
            due_date: parsed.due_date,
            units_consumed: parsed.units_consumed,
            present_reading: parsed.present_reading,
            previous_reading: parsed.previous_reading,
            tariff: parsed.tariff,
            bill_image_url: billImageUrl,
            pdf_url: billImageUrl,
            status: "unpaid",
          });

        if (insertErr) {
          logs.push(`✕ Failed to insert bill for ${conn.name}: ${insertErr.message}`);
          failed++;
          continue;
        }

        synced++;
        logs.push(`✓ Synced new bill of Rs. ${billAmount} for ${billingMonthStr} (${conn.name}).`);
      } else {
        logs.push(`Bill for ${billingMonthStr} already exists for ${conn.name}.`);
      }
    } catch (err) {
      logs.push(`✕ Error checking ${conn.name}: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  return {
    totalChecked: connections.length,
    totalSynced: synced,
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
