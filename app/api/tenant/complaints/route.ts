import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth/tenant-context";
import { createComplaint, ComplaintCategory, ComplaintPriority } from "@/lib/complaints/service";

export async function POST(request: Request) {
  try {
    let context;
    try {
      context = await getTenantContext({ allowUnauthorized: true });
    } catch (authErr: any) {
      if (authErr.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Please log in to submit a complaint." }, { status: 401 });
      }
      if (authErr.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Only tenant accounts can submit maintenance requests here." }, { status: 403 });
      }
      throw authErr;
    }

    const body = await request.json();
    const title = body?.title?.trim();
    const category = (body?.category || "General") as ComplaintCategory;
    const description = body?.description?.trim();
    const priority = (body?.priority || "MEDIUM") as ComplaintPriority;

    if (!title) {
      return NextResponse.json(
        { error: "Complaint title/subject is required." },
        { status: 400 }
      );
    }

    const unitId = context.unit?.id || 1;
    const tenantId = context.tenant?.id || null;

    const complaint = await createComplaint({
      unitId,
      tenantId,
      category,
      title,
      description,
      priority,
    });

    return NextResponse.json({
      success: true,
      complaint,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to lodge maintenance request." },
      { status: 500 }
    );
  }
}
