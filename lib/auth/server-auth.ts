import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserProfile, UserRole } from "./types";
import { getProfileById } from "./profile-service";

export const SESSION_COOKIE_NAME = "plaza_auth_session";

export interface AuthSessionData {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  tenantId?: number | string | null;
  createdAt: number;
  expiresAt: number;
}

/**
 * Encodes session data for secure HTTP-only cookie storage
 */
export function encodeSession(data: AuthSessionData): string {
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64");
}

/**
 * Decodes and validates session data from cookie string
 */
export function decodeSession(raw: string | undefined | null): AuthSessionData | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const jsonStr = Buffer.from(decoded, "base64").toString("utf8");
    const session = JSON.parse(jsonStr) as AuthSessionData;

    if (!session || !session.userId || (session.role !== "ADMIN" && session.role !== "TENANT")) {
      return null;
    }

    // Check expiration (7 days)
    if (session.expiresAt && Date.now() > session.expiresAt) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Reads the current session from incoming request cookies
 */
export async function getSession(): Promise<AuthSessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return decodeSession(raw);
}

/**
 * Returns current authenticated user or null
 */
export async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  const session = await getSession();
  if (!session) return null;
  return { id: session.userId, email: session.email };
}

/**
 * Returns current user's profile with verified role and optional tenant_id
 */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  const session = await getSession();
  if (!session) return null;

  // Attempt live lookup from profile service
  const profile = await getProfileById(session.userId);
  if (profile) return profile;

  // Fallback to session cache
  return {
    id: session.userId,
    full_name: session.fullName,
    role: session.role,
    tenant_id: session.tenantId || null,
    email: session.email,
  };
}

/**
 * Server-side guard: Requires user to be logged in
 */
export async function requireAuthenticatedUser(): Promise<AuthSessionData> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Server-side guard: Requires user to have ADMIN role
 */
export async function requireAdmin(): Promise<AuthSessionData> {
  const session = await requireAuthenticatedUser();
  if (session.role !== "ADMIN") {
    redirect("/tenant");
  }
  return session;
}

/**
 * Server-side guard: Requires user to have TENANT role
 */
export async function requireTenant(): Promise<AuthSessionData> {
  const session = await requireAuthenticatedUser();
  if (session.role !== "TENANT") {
    redirect("/");
  }
  return session;
}
