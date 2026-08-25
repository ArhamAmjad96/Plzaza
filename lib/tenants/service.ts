import { supabase } from "@/lib/supabase/server";
import { getAllUnits, UnitItem, getPrimaryPlaza, updateUnit } from "@/lib/units/service";

export interface TenantItem {
  id: number | string;
  plaza_id: number | string;
  full_name: string;
  phone?: string | null;
  cnic?: string | null;
  emergency_contact?: string | null;
  status: "ACTIVE" | "VACATED" | "INACTIVE";
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LeaseItem {
  id: number | string;
  plaza_id: number | string;
  tenant_id: number | string;
  unit_id: number | string;
  monthly_rent: number;
  rent_due_day: number;
  security_amount: number;
  security_paid: number;
  security_status: "PAID" | "PARTIAL" | "UNPAID";
  move_in_date: string;
  lease_start_date: string;
  lease_end_date?: string | null;
  status: "ACTIVE" | "ENDED" | "TERMINATED";
  ended_at?: string | null;
  vacate_reason?: string | null;
  annual_increase_pct?: number;
  last_escalation_date?: string | null;
  next_escalation_date?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TenantLeaseView {
  tenant: TenantItem;
  lease?: LeaseItem | null;
  unit?: UnitItem | null;
  connection_id?: number | string | null;
  is_active: boolean;
}

export interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  vacatedTenants: number;
  shopTenants: number;
  roomTenants: number;
  totalSecurityHeld: number;
}

// In-Memory Fallback State
let fallbackTenants: TenantItem[] = [
  { id: 101, plaza_id: 1, full_name: "Arham Fabrics", phone: "0300-1234567", cnic: "37405-1234567-1", emergency_contact: "0321-1234567", status: "ACTIVE", notes: "Main commercial shop" },
  { id: 102, plaza_id: 1, full_name: "Ali Raza", phone: "0333-7654321", cnic: "37405-7654321-2", emergency_contact: "0300-9876543", status: "ACTIVE", notes: "Flat 1 tenant" },
];

let fallbackLeases: LeaseItem[] = [
  { id: 201, plaza_id: 1, tenant_id: 101, unit_id: 1, monthly_rent: 28000, rent_due_day: 5, security_amount: 50000, security_paid: 50000, security_status: "PAID", move_in_date: "2025-01-01", lease_start_date: "2025-01-01", status: "ACTIVE", annual_increase_pct: 10, next_escalation_date: "2026-09-01" },
  { id: 202, plaza_id: 1, tenant_id: 102, unit_id: 15, monthly_rent: 8500, rent_due_day: 5, security_amount: 10000, security_paid: 10000, security_status: "PAID", move_in_date: "2025-02-01", lease_start_date: "2025-02-01", status: "ACTIVE", annual_increase_pct: 10, next_escalation_date: "2026-09-01" },
];

export function calculateSecurityStatus(
  required: number,
  paid: number
): "PAID" | "PARTIAL" | "UNPAID" {
  if (paid <= 0) return "UNPAID";
  if (paid >= required) return "PAID";
  return "PARTIAL";
}

/**
 * Retrieves all tenants with their active leases and assigned physical units
 */
export async function getTenantsWithLeases(): Promise<{
  tenants: TenantLeaseView[];
  stats: TenantStats;
}> {
  const { units } = await getAllUnits();
  const unitsMap = new Map<string, UnitItem>();
  units.forEach((u) => unitsMap.set(u.id.toString(), u));

  let rawTenants: TenantItem[] = [];
  let rawLeases: LeaseItem[] = [];
  let rawConnections: any[] = [];

  try {
    const [tenantsRes, leasesRes, connsRes] = await Promise.all([
      supabase.from("tenants").select("*").order("created_at", { ascending: false }),
      supabase.from("leases").select("*").order("created_at", { ascending: false }),
      supabase.from("connections").select("*"),
    ]);

    if (!tenantsRes.error && tenantsRes.data && tenantsRes.data.length > 0) {
      rawTenants = tenantsRes.data as TenantItem[];
    } else {
      rawTenants = [...fallbackTenants];
    }

    if (!leasesRes.error && leasesRes.data && leasesRes.data.length > 0) {
      rawLeases = leasesRes.data as LeaseItem[];
    } else {
      rawLeases = [...fallbackLeases];
    }

    rawConnections = connsRes.data || [];
  } catch (err) {
    rawTenants = [...fallbackTenants];
    rawLeases = [...fallbackLeases];
  }

  // If DB was empty, check connections for legacy tenants
  if (rawTenants.length === 0 && rawConnections.length > 0) {
    rawConnections.forEach((conn, index) => {
      if (conn.tenant || conn.name) {
        const tenantId = `legacy-t-${conn.id}`;
        const unitId = `legacy-u-${conn.id}`;
        rawTenants.push({
          id: tenantId,
          plaza_id: conn.plaza_id || 1,
          full_name: conn.tenant || conn.name,
          phone: null,
          cnic: null,
          emergency_contact: null,
          status: "ACTIVE",
          notes: "Auto-migrated from connection",
        });

        rawLeases.push({
          id: `legacy-l-${conn.id}`,
          plaza_id: conn.plaza_id || 1,
          tenant_id: tenantId,
          unit_id: unitId,
          monthly_rent: conn.monthly_rent || 28000,
          rent_due_day: 5,
          security_amount: 50000,
          security_paid: 50000,
          security_status: "PAID",
          move_in_date: new Date().toISOString().split("T")[0],
          lease_start_date: new Date().toISOString().split("T")[0],
          status: "ACTIVE",
          annual_increase_pct: 10,
        });
      }
    });
  }

  // Group leases by tenant_id
  const leasesByTenant = new Map<string, LeaseItem[]>();
  rawLeases.forEach((l) => {
    const key = l.tenant_id.toString();
    const arr = leasesByTenant.get(key) || [];
    arr.push(l);
    leasesByTenant.set(key, arr);
  });

  const tenantViews: TenantLeaseView[] = rawTenants.map((tenant) => {
    const tenantLeases = leasesByTenant.get(tenant.id.toString()) || [];
    const activeLease =
      tenantLeases.find((l) => l.status === "ACTIVE") ||
      tenantLeases[0] ||
      null;

    const unit = activeLease ? unitsMap.get(activeLease.unit_id.toString()) || null : null;

    // Match connection
    const matchedConn = rawConnections.find(
      (c) =>
        (tenant.full_name && c.tenant && c.tenant.toLowerCase().includes(tenant.full_name.toLowerCase())) ||
        (unit && c.name && c.name.toLowerCase().includes(unit.unit_name.toLowerCase()))
    );

    return {
      tenant,
      lease: activeLease,
      unit,
      connection_id: matchedConn?.id || null,
      is_active: tenant.status === "ACTIVE" && activeLease?.status === "ACTIVE",
    };
  });

  // Calculate stats
  const totalTenants = tenantViews.length;
  const activeTenants = tenantViews.filter((v) => v.is_active).length;
  const vacatedTenants = totalTenants - activeTenants;
  const shopTenants = tenantViews.filter(
    (v) => v.is_active && v.unit?.unit_type === "SHOP"
  ).length;
  const roomTenants = tenantViews.filter(
    (v) => v.is_active && v.unit?.unit_type === "ROOM"
  ).length;

  const totalSecurityHeld = tenantViews.reduce(
    (sum, v) => sum + (v.is_active ? Number(v.lease?.security_paid || 0) : 0),
    0
  );

  return {
    tenants: tenantViews,
    stats: {
      totalTenants,
      activeTenants,
      vacatedTenants,
      shopTenants,
      roomTenants,
      totalSecurityHeld,
    },
  };
}

/**
 * Retrieves only vacant units of a specific type (SHOP or ROOM) for new tenant assignment
 */
export async function getAvailableUnits(unitType?: "SHOP" | "ROOM"): Promise<UnitItem[]> {
  try {
    const { units } = await getAllUnits();
    return units.filter((u) => u.status === "VACANT" && (!unitType || u.unit_type === unitType));
  } catch {
    return [];
  }
}

/**
 * Creates a new tenant and assigns them to a unit via a lease
 */
export async function createTenantWithLease(params: {
  fullName: string;
  phone?: string | null;
  cnic?: string | null;
  emergencyContact?: string | null;
  unitId: number | string;
  monthlyRent: number;
  rentDueDay?: number;
  securityAmount: number;
  securityPaid: number;
  moveInDate?: string;
  leaseStartDate?: string;
  leaseEndDate?: string | null;
  notes?: string | null;
}): Promise<{ tenant: TenantItem; lease: LeaseItem }> {
  const plaza = await getPrimaryPlaza();
  const securityStatus = calculateSecurityStatus(params.securityAmount, params.securityPaid);

  let newTenant: TenantItem | null = null;
  let newLease: LeaseItem | null = null;

  try {
    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .insert({
        plaza_id: plaza.id,
        full_name: params.fullName.trim(),
        phone: params.phone?.trim() || null,
        cnic: params.cnic?.trim() || null,
        emergency_contact: params.emergencyContact?.trim() || null,
        status: "ACTIVE",
        notes: params.notes?.trim() || null,
      })
      .select()
      .maybeSingle();

    if (!tenantErr && tenant) {
      newTenant = tenant;
      const { data: lease } = await supabase
        .from("leases")
        .insert({
          plaza_id: plaza.id,
          tenant_id: tenant.id,
          unit_id: params.unitId,
          monthly_rent: params.monthlyRent,
          rent_due_day: params.rentDueDay || 5,
          security_amount: params.securityAmount,
          security_paid: params.securityPaid,
          security_status: securityStatus,
          move_in_date: params.moveInDate || new Date().toISOString().split("T")[0],
          lease_start_date: params.leaseStartDate || new Date().toISOString().split("T")[0],
          lease_end_date: params.leaseEndDate || null,
          status: "ACTIVE",
          notes: params.notes?.trim() || null,
        })
        .select()
        .maybeSingle();

      newLease = lease;
    }
  } catch (err) {
    // Fallback
  }

  if (!newTenant) {
    newTenant = {
      id: Date.now(),
      plaza_id: plaza.id,
      full_name: params.fullName.trim(),
      phone: params.phone?.trim() || null,
      cnic: params.cnic?.trim() || null,
      emergency_contact: params.emergencyContact?.trim() || null,
      status: "ACTIVE",
      notes: params.notes?.trim() || null,
      created_at: new Date().toISOString(),
    };
    fallbackTenants.push(newTenant);
  }

  if (!newLease) {
    newLease = {
      id: Date.now() + 1,
      plaza_id: plaza.id,
      tenant_id: newTenant.id,
      unit_id: params.unitId,
      monthly_rent: params.monthlyRent,
      rent_due_day: params.rentDueDay || 5,
      security_amount: params.securityAmount,
      security_paid: params.securityPaid,
      security_status: securityStatus,
      move_in_date: params.moveInDate || new Date().toISOString().split("T")[0],
      lease_start_date: params.leaseStartDate || new Date().toISOString().split("T")[0],
      lease_end_date: params.leaseEndDate || null,
      status: "ACTIVE",
      notes: params.notes?.trim() || null,
      created_at: new Date().toISOString(),
    };
    fallbackLeases.push(newLease);
  }

  // Mark Unit as OCCUPIED
  await updateUnit(params.unitId, { status: "OCCUPIED" });

  return { tenant: newTenant, lease: newLease };
}

/**
 * Vacates a tenant: ends lease, sets unit back to VACANT, preserves complete financial history
 */
export async function vacateTenantLease(params: {
  leaseId: number | string;
  unitId: number | string;
  tenantId: number | string;
  vacateReason?: string | null;
}): Promise<boolean> {
  const now = new Date().toISOString();

  try {
    await supabase
      .from("leases")
      .update({
        status: "ENDED",
        ended_at: now,
        vacate_reason: params.vacateReason || "Tenant moved out",
        updated_at: now,
      })
      .eq("id", params.leaseId);

    await supabase
      .from("tenants")
      .update({ status: "VACATED", updated_at: now })
      .eq("id", params.tenantId);
  } catch (err) {
    // Fallback
  }

  const lIdx = fallbackLeases.findIndex((l) => l.id.toString() === params.leaseId.toString());
  if (lIdx !== -1) {
    fallbackLeases[lIdx].status = "ENDED";
    fallbackLeases[lIdx].vacate_reason = params.vacateReason || "Tenant moved out";
  }

  const tIdx = fallbackTenants.findIndex((t) => t.id.toString() === params.tenantId.toString());
  if (tIdx !== -1) {
    fallbackTenants[tIdx].status = "VACATED";
  }

  // Set unit back to VACANT
  await updateUnit(params.unitId, { status: "VACANT" });

  return true;
}

/**
 * Updates tenant details and lease terms
 */
export async function updateTenantAndLease(params: {
  tenantId: number | string;
  leaseId?: number | string;
  fullName?: string;
  phone?: string | null;
  cnic?: string | null;
  emergencyContact?: string | null;
  monthlyRent?: number;
  rentDueDay?: number;
  securityAmount?: number;
  securityPaid?: number;
  notes?: string | null;
}): Promise<boolean> {
  const now = new Date().toISOString();

  const tenantPayload: Record<string, any> = { updated_at: now };
  if (params.fullName) tenantPayload.full_name = params.fullName.trim();
  if (params.phone !== undefined) tenantPayload.phone = params.phone?.trim() || null;
  if (params.cnic !== undefined) tenantPayload.cnic = params.cnic?.trim() || null;
  if (params.emergencyContact !== undefined) tenantPayload.emergency_contact = params.emergencyContact?.trim() || null;
  if (params.notes !== undefined) tenantPayload.notes = params.notes?.trim() || null;

  try {
    await supabase.from("tenants").update(tenantPayload).eq("id", params.tenantId);

    if (params.leaseId) {
      const leasePayload: Record<string, any> = { updated_at: now };
      if (params.monthlyRent !== undefined) leasePayload.monthly_rent = params.monthlyRent;
      if (params.rentDueDay !== undefined) leasePayload.rent_due_day = params.rentDueDay;
      if (params.securityAmount !== undefined) leasePayload.security_amount = params.securityAmount;
      if (params.securityPaid !== undefined) leasePayload.security_paid = params.securityPaid;

      if (params.securityAmount !== undefined || params.securityPaid !== undefined) {
        const secReq = params.securityAmount ?? 50000;
        const secPaid = params.securityPaid ?? 0;
        leasePayload.security_status = calculateSecurityStatus(secReq, secPaid);
      }

      await supabase.from("leases").update(leasePayload).eq("id", params.leaseId);
    }
  } catch (err) {
    // Fallback
  }

  return true;
}

export const updateTenantLease = updateTenantAndLease;
