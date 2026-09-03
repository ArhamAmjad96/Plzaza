import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server-auth";
import { getProfileByTenantId, provisionTenantPortalAccess } from "@/lib/auth/profile-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { id: tenantId } = await params;
    const profile = await getProfileByTenantId(tenantId);

    // Also look in store.tenant_credentials for latest credentials
    const { getStore } = await import("@/lib/storage/fileStore");
    const store = getStore();
    const cred = (store.tenant_credentials || []).find(
      (c: any) => c.tenant_id?.toString() === tenantId.toString()
    );

    return NextResponse.json({
      hasAccess: Boolean(profile || cred),
      profile: profile || null,
      username: cred?.username || profile?.username || null,
      email: cred?.email || profile?.email || null,
      password: cred?.password || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch portal access." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { id: tenantId } = await params;
    const body = await request.json();
    const username = body?.username?.trim().toLowerCase();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password?.trim();
    const fullName = body?.fullName?.trim() || "Commercial Space Tenant";

    if ((!username && !email) || !password) {
      return NextResponse.json(
        { error: "Username (or Email) and password are required to configure portal access." },
        { status: 400 }
      );
    }

    const result = await provisionTenantPortalAccess({
      tenantId,
      fullName,
      username,
      email,
      password,
      phone: body?.phone || null,
    });

    return NextResponse.json({
      success: true,
      credentials: {
        username: result.username,
        email: result.email,
        password,
        loginUrl: "/login",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to configure portal access." },
      { status: 400 }
    );
  }
}
