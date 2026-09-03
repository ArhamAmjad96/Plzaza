import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server-auth";
import { getTenantNotifications } from "@/lib/notifications/service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "TENANT") {
      return NextResponse.json({ error: "Unauthorized. Tenant login required." }, { status: 401 });
    }

    const tenantId = session.tenantId || 1;
    const { notifications, unreadCount } = await getTenantNotifications(tenantId);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}
