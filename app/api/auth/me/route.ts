import { NextResponse } from "next/server";
import { getSession, getCurrentProfile } from "@/lib/auth/server-auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const profile = await getCurrentProfile();

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      fullName: profile?.full_name || session.fullName,
      role: profile?.role || session.role,
      tenantId: profile?.tenant_id ?? session.tenantId,
    },
  });
}
