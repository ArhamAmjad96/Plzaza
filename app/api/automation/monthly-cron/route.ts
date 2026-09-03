import { NextResponse } from "next/server";
import { generateMonthlyRentForActiveLeases } from "@/lib/automation/service";
import { verifyCronSecret, getKarachiNow } from "@/lib/automation/scheduler";
import { getTenantsWithLeases } from "@/lib/tenants/service";
import { dispatchRentCreatedNotification } from "@/lib/notifications/service";

export async function POST(request: Request) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { error: "Unauthorized. Valid CRON_SECRET header required." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const targetMonth = body?.month || null;
    const rentResult = await generateMonthlyRentForActiveLeases(targetMonth);

    // Trigger Day 1 RENT_CREATED notifications for all active candidates
    let notifsSent = 0;
    try {
      const now = getKarachiNow();
      const monthStr = rentResult.month;
      const { tenants } = await getTenantsWithLeases();

      for (const tv of tenants) {
        if (tv.is_active && tv.lease && tv.tenant) {
          const res = await dispatchRentCreatedNotification({
            tenantId: tv.tenant.id,
            leaseId: tv.lease.id,
            monthStr,
            rentAmount: Number(tv.lease.monthly_rent || 0),
            dueDateStr: rentResult.dueDate,
          });
          if (res.created) notifsSent++;
        }
      }
    } catch {}

    return NextResponse.json({
      success: true,
      rentResult,
      notificationsSent: notifsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Monthly cron automation failed." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
