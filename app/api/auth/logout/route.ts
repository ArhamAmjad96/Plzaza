import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/server-auth";
import { supabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    try {
      await supabase.auth.signOut();
    } catch {}

    const response = NextResponse.json({
      success: true,
      redirectUrl: "/login",
    });

    // Clear session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      path: "/",
      httpOnly: true,
      expires: new Date(0),
      maxAge: 0,
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Logout failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    try {
      await supabase.auth.signOut();
    } catch {}

    const response = NextResponse.redirect(new URL("/login", request.url));

    // Clear session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      path: "/",
      httpOnly: true,
      expires: new Date(0),
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
