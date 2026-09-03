import { supabase } from "@/lib/supabase/server";
import { getStore, updateStore } from "@/lib/storage/fileStore";
import { UserProfile, CreateProfileInput } from "./types";

/**
 * Retrieves a user profile by Supabase Auth User ID (UUID)
 */
export async function getProfileById(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;

  // 1. Try fetching from Supabase database
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      return data as UserProfile;
    }
  } catch {
    // Graceful fallback to fileStore
  }

  // 2. Fallback to local JSON store
  const store = getStore();
  const fallback = (store.profiles || []).find(
    (p: any) => p.id?.toString() === userId.toString()
  );

  return (fallback as UserProfile) || null;
}

/**
 * Retrieves a user profile linked to a specific tenant ID
 */
export async function getProfileByTenantId(
  tenantId: number | string
): Promise<UserProfile | null> {
  if (!tenantId) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!error && data) {
      return data as UserProfile;
    }
  } catch {}

  const store = getStore();
  const fallback = (store.profiles || []).find(
    (p: any) => p.tenant_id?.toString() === tenantId.toString()
  );

  return (fallback as UserProfile) || null;
}

/**
 * Creates or updates a user profile with role and optional tenant mapping
 */
export async function saveProfile(
  input: CreateProfileInput
): Promise<UserProfile> {
  const now = new Date().toISOString();
  const profileRecord: UserProfile = {
    id: input.id,
    full_name: input.full_name,
    role: input.role,
    tenant_id: input.role === "TENANT" ? input.tenant_id ?? null : null,
    username: input.username?.trim().toLowerCase() || null,
    email: input.email || null,
    phone: input.phone || null,
    created_at: now,
    updated_at: now,
  };

  // 1. Upsert into Supabase profiles table
  try {
    await supabase.from("profiles").upsert(profileRecord, {
      onConflict: "id",
    });
  } catch (err) {
    console.warn("Supabase profile save note:", err);
  }

  // 2. Upsert into local JSON store
  updateStore((s) => {
    if (!s.profiles) s.profiles = [];
    const idx = s.profiles.findIndex((p: any) => p.id?.toString() === input.id.toString());
    if (idx !== -1) {
      s.profiles[idx] = { ...s.profiles[idx], ...profileRecord, updated_at: now };
    } else {
      s.profiles.push(profileRecord);
    }
  });

  return profileRecord;
}

/**
 * Retrieves a user profile by Username
 */
export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  if (!username) return null;
  const normUser = username.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", normUser)
      .maybeSingle();

    if (!error && data) {
      return data as UserProfile;
    }
  } catch {}

  const store = getStore();
  const fallback = (store.profiles || []).find(
    (p: any) => p.username?.toLowerCase() === normUser
  );

  return (fallback as UserProfile) || null;
}

/**
 * Retrieves a user profile by Email
 */
export async function getProfileByEmail(email: string): Promise<UserProfile | null> {
  if (!email) return null;
  const normEmail = email.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("email", normEmail)
      .maybeSingle();

    if (!error && data) {
      return data as UserProfile;
    }
  } catch {}

  const store = getStore();
  const fallback = (store.profiles || []).find(
    (p: any) => p.email?.toLowerCase() === normEmail
  );

  return (fallback as UserProfile) || null;
}

/**
 * Provisions or updates tenant portal login credentials (Username + Password)
 */
export async function provisionTenantPortalAccess(params: {
  tenantId: number | string;
  fullName: string;
  username?: string | null;
  email?: string | null;
  password: string;
  phone?: string | null;
}): Promise<{ userId: string; username: string; email: string }> {
  const normUsername = (
    params.username ||
    params.email?.split("@")[0] ||
    params.fullName.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "tenant"
  )
    .trim()
    .toLowerCase();

  const normEmail = (params.email || `${normUsername}@plaza.com`).trim().toLowerCase();
  const password = params.password.trim();

  // 1. Check if username is already linked to another tenant
  const store = getStore();
  const duplicateCred = (store.tenant_credentials || []).find(
    (c: any) =>
      c.username?.toLowerCase() === normUsername &&
      c.tenant_id?.toString() !== params.tenantId.toString()
  );
  if (duplicateCred) {
    throw new Error(`Username "${normUsername}" is already taken by another tenant. Please choose another username.`);
  }

  const existingProfile = await getProfileByEmail(normEmail);
  if (
    existingProfile &&
    existingProfile.tenant_id &&
    existingProfile.tenant_id.toString() !== params.tenantId.toString()
  ) {
    throw new Error(`This email / username is already linked to another portal account.`);
  }

  let userId = existingProfile?.id || `tenant-usr-${params.tenantId}`;

  // 2. Try creating in Supabase Auth if available
  try {
    const { data: dbUser, error } = await supabase.auth.admin.createUser({
      email: normEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: params.fullName,
        username: normUsername,
        tenant_id: params.tenantId,
      },
    });

    if (!error && dbUser?.user) {
      userId = dbUser.user.id;
    } else if (error && error.message?.toLowerCase().includes("already")) {
      try {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const found = listData?.users?.find((u) => u.email?.toLowerCase() === normEmail);
        if (found) {
          userId = found.id;
          await supabase.auth.admin.updateUserById(userId, {
            password,
            user_metadata: {
              full_name: params.fullName,
              username: normUsername,
              tenant_id: params.tenantId,
            },
          });
        }
      } catch {}
    }
  } catch {
    // Non-blocking fallback
  }

  // 3. Save profile in DB & local store
  await saveProfile({
    id: userId,
    full_name: params.fullName,
    role: "TENANT",
    tenant_id: params.tenantId,
    username: normUsername,
    email: normEmail,
    phone: params.phone || null,
  });

  // 4. Update tenant record and store credentials for local/offline mode
  updateStore((s) => {
    if (!s.tenants) s.tenants = [];
    const idx = s.tenants.findIndex((t: any) => t.id?.toString() === params.tenantId.toString());
    if (idx !== -1) {
      s.tenants[idx].email = normEmail;
      (s.tenants[idx] as any).username = normUsername;
    }

    if (!s.tenant_credentials) s.tenant_credentials = [];
    const cIdx = s.tenant_credentials.findIndex(
      (c: any) =>
        c.username?.toLowerCase() === normUsername ||
        c.email?.toLowerCase() === normEmail ||
        c.tenant_id?.toString() === params.tenantId.toString()
    );
    const credRecord = {
      tenant_id: params.tenantId,
      username: normUsername,
      email: normEmail,
      password: password,
      updated_at: new Date().toISOString(),
    };
    if (cIdx !== -1) {
      s.tenant_credentials[cIdx] = credRecord;
    } else {
      s.tenant_credentials.push(credRecord);
    }
  });

  return { userId, username: normUsername, email: normEmail };
}

/**
 * Lists all registered user profiles
 */
export async function listProfiles(): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as UserProfile[];
    }
  } catch {}

  const store = getStore();
  return (store.profiles || []) as UserProfile[];
}

export interface TenantCredentialRow {
  tenant_id: number | string;
  tenant_name: string;
  phone?: string | null;
  cnic?: string | null;
  unit_name: string;
  username: string;
  email: string;
  password?: string;
  has_access: boolean;
  is_active: boolean;
  updated_at?: string;
}

/**
 * Secure Admin-Only list of all tenant usernames and credentials
 */
export async function getAllTenantCredentials(): Promise<TenantCredentialRow[]> {
  const { getTenantsWithLeases } = await import("@/lib/tenants/service");
  const { tenants } = await getTenantsWithLeases();
  const store = getStore();

  const creds = store.tenant_credentials || [];

  return tenants.map((tv) => {
    const matchedCred = creds.find(
      (c: any) => c.tenant_id?.toString() === tv.tenant.id.toString()
    );

    const defaultUsername =
      (tv.tenant as any).username ||
      tv.tenant.full_name.toLowerCase().replace(/[^a-z0-9]/g, "") ||
      "tenant";

    const username = matchedCred?.username || defaultUsername;
    const email = matchedCred?.email || tv.tenant.email || `${username}@plaza.com`;
    const password = matchedCred?.password || "";
    const has_access = Boolean(matchedCred || (tv.tenant as any).email);

    return {
      tenant_id: tv.tenant.id,
      tenant_name: tv.tenant.full_name,
      phone: tv.tenant.phone,
      cnic: tv.tenant.cnic,
      unit_name: tv.unit?.unit_name || "Unassigned",
      username,
      email,
      password,
      has_access,
      is_active: tv.is_active,
      updated_at: matchedCred?.updated_at,
    };
  });
}
