import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "plaza_auth_session";

interface SessionPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "TENANT";
  expiresAt: number;
}

function parseSession(req: NextRequest): SessionPayload | null {
  let cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;
  try {
    cookie = decodeURIComponent(cookie);
    const json = Buffer.from(cookie, "base64").toString("utf8");
    const session = JSON.parse(json) as SessionPayload;

    if (!session || !session.userId || (session.role !== "ADMIN" && session.role !== "TENANT")) {
      return null;
    }

    if (session.expiresAt && Date.now() > session.expiresAt) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Bypass static assets, internal routes, and cron webhooks (which self-verify CRON_SECRET)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/api/automation/daily-cron" ||
    pathname === "/api/automation/monthly-cron" ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = parseSession(req);

  // 2. Handle Login Route
  if (pathname === "/login") {
    if (session) {
      const dest = session.role === "ADMIN" ? "/" : "/tenant";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // 3. Protect all other application routes
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. Role-based Route Protection
  // Tenant role must not access Admin-only management routes or Admin APIs
  const adminOnlyPrefixes = [
    "/units",
    "/tenants",
    "/connections",
    "/expenses",
    "/reports",
    "/automation",
    "/logs",
    "/settings",
  ];

  if (session.role === "TENANT") {
    if (pathname === "/" || adminOnlyPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.redirect(new URL("/tenant", req.url));
    }
    if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/automation")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }
  }

  // Admin role accessing tenant portal redirects to admin workspace
  if (session.role === "ADMIN") {
    if (pathname === "/tenant" || pathname.startsWith("/tenant/")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
