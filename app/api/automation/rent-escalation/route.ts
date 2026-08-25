import { NextResponse } from "next/server";
import { getEligibleRentEscalations, applyRentEscalation } from "@/lib/automation/service";

export async function GET() {
  try {
    const eligible = await getEligibleRentEscalations();
    return NextResponse.json({ eligible });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch eligible escalations." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leaseId, customNewRent } = body;
    if (!leaseId) {
      return NextResponse.json({ error: "leaseId is required." }, { status: 400 });
    }
    const result = await applyRentEscalation(leaseId, customNewRent);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to apply rent escalation." },
      { status: 500 }
    );
  }
}
