export type UserRole = "ADMIN" | "TENANT";

export interface UserProfile {
  id: string; // Maps to auth.users.id (UUID)
  full_name: string;
  role: UserRole;
  tenant_id: number | string | null; // Null for ADMIN, links to tenants.id for TENANT
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProfileInput {
  id: string;
  full_name: string;
  role: UserRole;
  tenant_id?: number | string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
}
