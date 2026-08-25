import { NextResponse } from "next/server";
import { runMonthlyLedgerAutomation } from "@/lib/automation/service";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const month = body.month || null;
    const result = await runMonthlyLedgerAutomation(month);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to run ledger automation." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const result = await runMonthlyLedgerAutomation();
  return NextResponse.json(result);
}
