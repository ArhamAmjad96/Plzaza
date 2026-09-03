import { runPlazaWideIESCOBillSync, generateMonthlyRentForActiveLeases } from "./service";
import { getMonthlyLedgers, normalizeBillingMonth } from "@/lib/ledgers/service";
import { getTenantsWithLeases } from "@/lib/tenants/service";
import {
  dispatchRentCreatedNotification,
  dispatchRentReminderNotification,
  dispatchRentDueTodayNotification,
  dispatchRentOverdueNotification,
  dispatchElectricityBillNotification,
} from "@/lib/notifications/service";
import { logActivity } from "@/lib/logs/service";

/**
 * Returns current date and time parameters in the business timezone (Asia/Karachi)
 */
export function getKarachiNow(customDate?: Date) {
  const date = customDate || new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const formatter = new Intl.DateTimeFormat("en-CA", options); // Format: YYYY-MM-DD
  const [yearStr, monthStr, dayStr] = formatter.format(date).split("-");

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  return {
    year,
    month,
    day,
    dateStr: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    monthStr: `${year}-${String(month).padStart(2, "0")}-01`,
  };
}

/**
 * Security helper to verify CRON_SECRET on scheduled webhook requests
 */
export function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET || "plaza_dev_cron_secret_2026";
  const authHeader = request.headers.get("authorization");
  const xCronHeader = request.headers.get("x-cron-secret");

  if (xCronHeader && xCronHeader === cronSecret) return true;
  if (authHeader && authHeader === `Bearer ${cronSecret}`) return true;

  // Development bypass if local request
  const host = request.headers.get("host") || "";
  if (process.env.NODE_ENV === "development" && (host.includes("localhost") || host.includes("127.0.0.1"))) {
    return true;
  }

  return false;
}

export interface DailyAutomationResults {
  success: boolean;
  timestamp: string;
  karachiDate: string;
  billSync: {
    totalChecked: number;
    totalSynced: number;
    totalSkipped: number;
    totalFailed: number;
  };
  rentSafety: {
    totalLeasesChecked: number;
    createdCount: number;
    skippedCount: number;
  };
  reminders: {
    day: number;
    evaluatedCount: number;
    sentCount: number;
    skippedPaidCount: number;
    alreadySentCount: number;
  };
  logs: string[];
}

/**
 * DAILY AUTOMATION ENGINE:
 * 1. Executes plaza-wide IESCO bill synchronization
 * 2. Runs safety fallback for missing current-month rent
 * 3. Evaluates and sends scheduled rent reminders (1st, 8th, 10th, 13th)
 * 4. Logs full audit results
 */
export async function runDailyAutomationJob(options?: {
  customDate?: Date;
  forceReminders?: boolean;
  skipBillSync?: boolean;
}): Promise<DailyAutomationResults> {
  const now = getKarachiNow(options?.customDate);
  const logs: string[] = [];
  logs.push(`[${now.dateStr} PKT] Starting Daily Plaza Automation Job...`);

  // ─── 1. IESCO Electricity Sync ───
  let billSync = { totalChecked: 0, totalSynced: 0, totalSkipped: 0, totalFailed: 0 };
  if (!options?.skipBillSync) {
    logs.push("Running IESCO electricity sync...");
    billSync = await runPlazaWideIESCOBillSync();
    logs.push(
      `Electricity Sync: Checked ${billSync.totalChecked}, Synced ${billSync.totalSynced}, Skipped ${billSync.totalSkipped}, Failed ${billSync.totalFailed}`
    );
  } else {
    logs.push("Skipping electricity sync as requested.");
  }

  // ─── 2. Rent Safety Check (Current Month) ───
  logs.push(`Checking rent safety for ${now.monthStr.slice(0, 7)}...`);
  const rentSafety = await generateMonthlyRentForActiveLeases(now.monthStr);
  logs.push(
    `Rent Safety: Checked ${rentSafety.totalLeasesChecked}, Created ${rentSafety.createdCount}, Skipped ${rentSafety.skippedCount}`
  );

  // ─── 3. Scheduled Rent Reminders ───
  const { items: ledgers } = await getMonthlyLedgers(now.monthStr);
  const { tenants } = await getTenantsWithLeases();
  const activeTenantsMap = new Map<string, any>();
  tenants.forEach((tv) => {
    if (tv.is_active && tv.tenant) {
      activeTenantsMap.set(tv.tenant.id.toString(), tv);
    }
  });

  let sentCount = 0;
  let skippedPaidCount = 0;
  let alreadySentCount = 0;
  let evaluatedCount = 0;

  const targetDay = now.day;
  const isReminderDay =
    options?.forceReminders || targetDay === 1 || targetDay === 8 || targetDay === 10 || targetDay === 13;

  if (isReminderDay) {
    logs.push(`Evaluating scheduled reminders for Day ${targetDay}...`);

    for (const item of ledgers) {
      if (!item.tenant_id) continue;
      const tv = activeTenantsMap.get(item.tenant_id.toString());
      if (!tv || !tv.lease) continue;

      evaluatedCount++;
      const isPaid =
        item.status === "paid" ||
        item.rent_status === "PAID" ||
        item.rent_paid >= item.rent_amount ||
        item.paid_amount >= item.total_payable;
      const remainingRent = Math.max(0, item.rent_amount - item.rent_paid);

      // Day 1: RENT_CREATED
      if (targetDay === 1) {
        const res = await dispatchRentCreatedNotification({
          tenantId: item.tenant_id,
          leaseId: tv.lease.id,
          monthStr: now.monthStr,
          rentAmount: item.rent_amount,
          dueDateStr: item.rent_due_date || `${now.year}-${String(now.month).padStart(2, "0")}-10`,
        });
        if (res.created) sentCount++;
        else alreadySentCount++;
      }
      // Day 8: RENT_REMINDER (only if unpaid)
      else if (targetDay === 8) {
        if (isPaid) {
          skippedPaidCount++;
        } else {
          const res = await dispatchRentReminderNotification({
            tenantId: item.tenant_id,
            leaseId: tv.lease.id,
            monthStr: now.monthStr,
            remainingAmount: remainingRent,
            dueDateStr: item.rent_due_date || `${now.year}-${String(now.month).padStart(2, "0")}-10`,
          });
          if (res.created) sentCount++;
          else alreadySentCount++;
        }
      }
      // Day 10: RENT_DUE_TODAY (only if unpaid)
      else if (targetDay === 10) {
        if (isPaid) {
          skippedPaidCount++;
        } else {
          const res = await dispatchRentDueTodayNotification({
            tenantId: item.tenant_id,
            leaseId: tv.lease.id,
            monthStr: now.monthStr,
            remainingAmount: remainingRent,
          });
          if (res.created) sentCount++;
          else alreadySentCount++;
        }
      }
      // Day 13: RENT_OVERDUE (only if unpaid / partial)
      else if (targetDay >= 13) {
        if (isPaid) {
          skippedPaidCount++;
        } else {
          const res = await dispatchRentOverdueNotification({
            tenantId: item.tenant_id,
            leaseId: tv.lease.id,
            monthStr: now.monthStr,
            remainingAmount: remainingRent,
          });
          if (res.created) sentCount++;
          else alreadySentCount++;
        }
      }
    }
  }

  logs.push(
    `Reminders Summary: Evaluated ${evaluatedCount}, Sent ${sentCount}, Skipped (Paid) ${skippedPaidCount}, Already Sent ${alreadySentCount}`
  );

  // ─── 4. Record Daily Audit Log ───
  await logActivity({
    category: "SYSTEM",
    action: "DAILY_AUTOMATION_COMPLETED",
    title: `Daily Automation Run — ${now.dateStr}`,
    description: `Daily check completed. Bills synced: ${billSync.totalSynced}, Rent created: ${rentSafety.createdCount}, Notifications dispatched: ${sentCount}.`,
    metadata: {
      karachiDate: now.dateStr,
      billSync: { synced: billSync.totalSynced, checked: billSync.totalChecked },
      rentSafety: { created: rentSafety.createdCount, skipped: rentSafety.skippedCount },
      reminders: { sent: sentCount, skippedPaid: skippedPaidCount },
    },
  });

  return {
    success: true,
    timestamp: new Date().toISOString(),
    karachiDate: now.dateStr,
    billSync: {
      totalChecked: billSync.totalChecked,
      totalSynced: billSync.totalSynced,
      totalSkipped: billSync.totalSkipped,
      totalFailed: billSync.totalFailed,
    },
    rentSafety: {
      totalLeasesChecked: rentSafety.totalLeasesChecked,
      createdCount: rentSafety.createdCount,
      skippedCount: rentSafety.skippedCount,
    },
    reminders: {
      day: targetDay,
      evaluatedCount,
      sentCount,
      skippedPaidCount,
      alreadySentCount,
    },
    logs,
  };
}
