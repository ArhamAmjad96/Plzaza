import { NextResponse } from "next/server";
import { runPlazaWideIESCOBillSync } from "@/lib/automation/service";

export async function POST() {
  try {
    const result = await runPlazaWideIESCOBillSync();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to sync IESCO bills." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const result = await runPlazaWideIESCOBillSync();
  return NextResponse.json(result);
}
