import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server-auth";
import { markAllNotificationsAsRead } from "@/lib/notifications/service";

export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== "TENANT") {
      return NextResponse.json({ error: "Unauthorized. Tenant login required." }, { status: 401 });
    }

    const tenantId = session.tenantId || 1;
    await markAllNotificationsAsRead(tenantId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to mark all notifications as read." },
      { status: 500 }
    );
  }
}
