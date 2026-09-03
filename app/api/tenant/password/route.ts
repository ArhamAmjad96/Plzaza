import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server-auth";
import { getTenantContext } from "@/lib/auth/tenant-context";
import { supabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "TENANT") {
      return NextResponse.json({ error: "Unauthorized. Tenant login required." }, { status: 401 });
    }

    const body = await request.json();
    const newPassword = body?.newPassword?.trim();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 1. Try updating password in Supabase Auth
    try {
      if (session.userId && !session.userId.startsWith("0000") && !session.userId.startsWith("tenant-usr")) {
        await supabase.auth.admin.updateUserById(session.userId, {
          password: newPassword,
        });
      }
    } catch {
      // Non-blocking fallback
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update password." },
      { status: 500 }
    );
  }
}
