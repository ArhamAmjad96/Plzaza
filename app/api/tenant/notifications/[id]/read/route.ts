import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server-auth";
import { markNotificationAsRead } from "@/lib/notifications/service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "TENANT") {
      return NextResponse.json({ error: "Unauthorized. Tenant login required." }, { status: 401 });
    }

    const { id: notifId } = await context.params;
    const tenantId = session.tenantId || 1;
    await markNotificationAsRead(notifId, tenantId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to mark notification as read." },
      { status: 500 }
    );
  }
}
