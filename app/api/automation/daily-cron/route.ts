import { NextResponse } from "next/server";
import { runDailyAutomationJob, verifyCronSecret } from "@/lib/automation/scheduler";

export async function POST(request: Request) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { error: "Unauthorized. Valid CRON_SECRET header required." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const customDate = body?.customDate ? new Date(body.customDate) : undefined;
    const forceReminders = Boolean(body?.forceReminders);

    const result = await runDailyAutomationJob({ customDate, forceReminders });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Daily automation run failed." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { error: "Unauthorized. Valid CRON_SECRET header required." },
        { status: 401 }
      );
    }

    const result = await runDailyAutomationJob();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Daily automation run failed." },
      { status: 500 }
    );
  }
}
