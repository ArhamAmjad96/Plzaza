import { supabase } from "@/lib/supabase/server";
import { getAllUnits, UnitItem, getPrimaryPlaza, updateUnit } from "@/lib/units/service";
import { getStore, updateStore } from "@/lib/storage/fileStore";
import { logActivity } from "@/lib/logs/service";

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

export function resetTenantsMemory(): void {
  updateStore((s) => {
    s.tenants = [];
    s.leases = [];
  });
}

export function getFallbackTenantsAndLeases(): {
  tenants: TenantItem[];
  leases: LeaseItem[];
} {
  const store = getStore();
  return {
    tenants: store.tenants || [],
    leases: store.leases || [],
  };
}

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

  const store = getStore();
  let rawTenants: TenantItem[] = store.tenants || [];
  let rawLeases: LeaseItem[] = store.leases || [];
  let rawConnections: any[] = store.connections || [];

  try {
    const [tenantsRes, leasesRes, connsRes] = await Promise.all([
      supabase.from("tenants").select("*").order("created_at", { ascending: false }),
      supabase.from("leases").select("*").order("created_at", { ascending: false }),
      supabase.from("connections").select("*"),
    ]);

    if (!tenantsRes.error && tenantsRes.data && tenantsRes.data.length > 0) {
      rawTenants = tenantsRes.data as TenantItem[];
    }
    if (!leasesRes.error && leasesRes.data && leasesRes.data.length > 0) {
      rawLeases = leasesRes.data as LeaseItem[];
    }
    if (!connsRes.error && connsRes.data && connsRes.data.length > 0) {
      rawConnections = connsRes.data || [];
    }
  } catch {}

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

  // Calculate high-level stats
  const totalTenants = rawTenants.length;
  const activeTenants = tenantViews.filter((t) => t.is_active).length;
  const vacatedTenants = rawTenants.filter((t) => t.status === "VACATED").length;

  let shopTenants = 0;
  let roomTenants = 0;
  let totalSecurityHeld = 0;

  tenantViews.forEach((tv) => {
    if (tv.is_active && tv.unit) {
      if (tv.unit.unit_type === "SHOP") shopTenants++;
      else if (tv.unit.unit_type === "ROOM") roomTenants++;
    }
    if (tv.lease) {
      totalSecurityHeld += Number(tv.lease.security_paid || 0);
    }
  });

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
 * Returns a list of units that currently have NO active lease/tenant
 */
export async function getAvailableUnits(): Promise<UnitItem[]> {
  const { units } = await getAllUnits();
  const { tenants } = await getTenantsWithLeases();

  const occupiedUnitIds = new Set<string>();
  tenants.forEach((t) => {
    if (t.is_active && t.unit) {
      occupiedUnitIds.add(t.unit.id.toString());
    }
  });

  return units.filter(
    (u) => u.status !== "INACTIVE" && !occupiedUnitIds.has(u.id.toString())
  );
}

/**
 * Assigns a new tenant to a specific unit with initial lease terms
 */
export async function createTenantWithLease(data: {
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
  annualIncreasePct?: number;
  notes?: string | null;
  electricityOption?: "OWN_METER" | "SHARED_METER" | "NO_METER";
  referenceNumber?: string | null;
  meterNumber?: string | null;
  sharedConnectionId?: number | string | null;
  splitType?: "EQUAL" | "PERCENTAGE";
  splitValue?: number;
}): Promise<{ tenant: TenantItem; lease: LeaseItem }> {
  const plaza = await getPrimaryPlaza();
  const nextId = Date.now();
  const today = new Date().toISOString().split("T")[0];

  const tenantItem: TenantItem = {
    id: nextId,
    plaza_id: plaza.id,
    full_name: data.fullName.trim(),
    phone: data.phone?.trim() || null,
    cnic: data.cnic?.trim() || null,
    emergency_contact: data.emergencyContact?.trim() || null,
    status: "ACTIVE",
    notes: data.notes || null,
    created_at: new Date().toISOString(),
  };

  const securityPaid = Number(data.securityPaid) || 0;
  const securityReq = Number(data.securityAmount) || 0;

  const leaseItem: LeaseItem = {
    id: nextId + 1,
    plaza_id: plaza.id,
    tenant_id: tenantItem.id,
    unit_id: data.unitId,
    monthly_rent: Number(data.monthlyRent) || 0,
    rent_due_day: data.rentDueDay || 5,
    security_amount: securityReq,
    security_paid: securityPaid,
    security_status: calculateSecurityStatus(securityReq, securityPaid),
    move_in_date: data.moveInDate || today,
    lease_start_date: data.leaseStartDate || today,
    lease_end_date: data.leaseEndDate || null,
    annual_increase_pct: data.annualIncreasePct || 10,
    status: "ACTIVE",
    notes: data.notes || null,
    created_at: new Date().toISOString(),
  };

  try {
    // 1. Insert Tenant in DB
    const { data: dbTenant, error: tErr } = await supabase
      .from("tenants")
      .insert({
        plaza_id: plaza.id,
        full_name: tenantItem.full_name,
        phone: tenantItem.phone,
        cnic: tenantItem.cnic,
        emergency_contact: tenantItem.emergency_contact,
        status: "ACTIVE",
        notes: tenantItem.notes,
      })
      .select()
      .maybeSingle();

    if (dbTenant) {
      tenantItem.id = dbTenant.id;
      leaseItem.tenant_id = dbTenant.id;
    }

    // 2. Insert Lease in DB
    const { data: dbLease } = await supabase
      .from("leases")
      .insert({
        plaza_id: plaza.id,
        tenant_id: leaseItem.tenant_id,
        unit_id: leaseItem.unit_id,
        monthly_rent: leaseItem.monthly_rent,
        rent_due_day: leaseItem.rent_due_day,
        security_amount: leaseItem.security_amount,
        security_paid: leaseItem.security_paid,
        security_status: leaseItem.security_status,
        move_in_date: leaseItem.move_in_date,
        lease_start_date: leaseItem.lease_start_date,
        lease_end_date: leaseItem.lease_end_date,
        annual_increase_pct: leaseItem.annual_increase_pct,
        status: "ACTIVE",
        notes: leaseItem.notes,
      })
      .select()
      .maybeSingle();

    if (dbLease) {
      leaseItem.id = dbLease.id;
    }

    // 3. Mark Unit as OCCUPIED
    await updateUnit(data.unitId, { status: "OCCUPIED" });
  } catch {
    // Non-blocking
  }

  // Update persistent fileStore
  updateStore((s) => {
    s.tenants = [tenantItem, ...s.tenants.filter((t) => t.id.toString() !== tenantItem.id.toString())];
    s.leases = [leaseItem, ...s.leases.filter((l) => l.id.toString() !== leaseItem.id.toString())];
  });

  // 4. If electricity option is provided, configure electricity connection
  if (data.electricityOption || data.referenceNumber) {
    try {
      const { configureUnitElectricity } = await import("@/lib/electricity/service");
      await configureUnitElectricity({
        unitId: data.unitId,
        referenceNumber: data.referenceNumber || undefined,
        meterNumber: data.meterNumber || undefined,
        electricityOption: (data.electricityOption as any) || (data.referenceNumber ? "OWN_METER" : "NO_METER"),
        sharedConnectionId: data.sharedConnectionId || undefined,
        splitType: data.splitType || undefined,
        splitValue: data.splitValue || undefined,
      });
    } catch (e) {
      console.warn("Auto meter connect error during tenant assignment:", e);
    }
  }

  logActivity({
    category: "TENANTS",
    action: "TENANT_ONBOARDED",
    title: "New Tenant Onboarded",
    description: `Onboarded ${tenantItem.full_name} for unit #${data.unitId} at monthly rent Rs. ${leaseItem.monthly_rent}.${
      data.referenceNumber ? ` Attached meter ref #${data.referenceNumber.trim()}.` : ""
    }`,
    metadata: {
      tenantId: tenantItem.id,
      tenantName: tenantItem.full_name,
      unitId: data.unitId,
      rent: leaseItem.monthly_rent,
      referenceNumber: data.referenceNumber?.trim() || null,
    },
    href: `/tenants`,
  });

  return { tenant: tenantItem, lease: leaseItem };
}

/**
 * Updates an existing tenant profile
 */
export async function updateTenant(
  id: number | string,
  data: Partial<TenantItem>
): Promise<TenantItem | null> {
  try {
    const { data: updated, error } = await supabase
      .from("tenants")
      .update({
        full_name: data.full_name,
        phone: data.phone,
        cnic: data.cnic,
        emergency_contact: data.emergency_contact,
        status: data.status,
        notes: data.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (!error && updated) {
      return updated as TenantItem;
    }
  } catch {
    // Non-blocking
  }

  const idx = fallbackTenants.findIndex((t) => t.id.toString() === id.toString());
  if (idx !== -1) {
    fallbackTenants[idx] = { ...fallbackTenants[idx], ...data };
    return fallbackTenants[idx];
  }

  return null;
}

/**
 * Updates an active lease's terms
 */
export async function updateLease(
  id: number | string,
  data: Partial<LeaseItem>
): Promise<LeaseItem | null> {
  const securityPaid = data.security_paid;
  const securityReq = data.security_amount;

  const patch: any = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  if (securityPaid !== undefined && securityReq !== undefined) {
    patch.security_status = calculateSecurityStatus(securityReq, securityPaid);
  }

  try {
    const { data: updated, error } = await supabase
      .from("leases")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (!error && updated) {
      return updated as LeaseItem;
    }
  } catch {
    // Non-blocking
  }

  const idx = fallbackLeases.findIndex((l) => l.id.toString() === id.toString());
  if (idx !== -1) {
    fallbackLeases[idx] = { ...fallbackLeases[idx], ...patch };
    return fallbackLeases[idx];
  }

  return null;
}

/**
 * Handles the complete Tenant Move-Out workflow
 */
export async function vacateTenant(
  tenantId: number | string,
  unitId: number | string,
  data: {
    vacateDate?: string;
    vacateReason?: string;
    deductions?: number;
    refundedAmount?: number;
  }
): Promise<{ success: boolean }> {
  const today = data.vacateDate || new Date().toISOString().split("T")[0];

  try {
    // 1. Mark lease as ENDED
    await supabase
      .from("leases")
      .update({
        status: "ENDED",
        ended_at: new Date().toISOString(),
        vacate_reason: data.vacateReason || "Tenant moved out",
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("unit_id", unitId);

    // 2. Mark tenant as VACATED
    await supabase
      .from("tenants")
      .update({
        status: "VACATED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId);

    // 3. Mark unit as VACANT
    await updateUnit(unitId, { status: "VACANT" });

    // Update in-memory fallback state
    fallbackLeases = fallbackLeases.map((l) =>
      l.tenant_id.toString() === tenantId.toString() && l.unit_id.toString() === unitId.toString()
        ? { ...l, status: "ENDED", ended_at: new Date().toISOString(), vacate_reason: data.vacateReason }
        : l
    );

    fallbackTenants = fallbackTenants.map((t) =>
      t.id.toString() === tenantId.toString() ? { ...t, status: "VACATED" } : t
    );

    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function vacateTenantLease(params: {
  leaseId: number | string;
  unitId: number | string;
  tenantId: number | string;
  vacateReason?: string;
}): Promise<{ success: boolean }> {
  return vacateTenant(params.tenantId, params.unitId, {
    vacateReason: params.vacateReason,
  });
}

export async function updateTenantLease(params: {
  tenantId: number | string;
  leaseId?: number | string;
  fullName: string;
  phone?: string;
  cnic?: string;
  emergencyContact?: string;
  monthlyRent?: number;
  rentDueDay?: number;
  securityAmount?: number;
  securityPaid?: number;
  notes?: string;
}): Promise<void> {
  await updateTenant(params.tenantId, {
    full_name: params.fullName,
    phone: params.phone,
    cnic: params.cnic,
    emergency_contact: params.emergencyContact,
    notes: params.notes,
  });

  if (params.leaseId) {
    await updateLease(params.leaseId, {
      monthly_rent: params.monthlyRent,
      rent_due_day: params.rentDueDay,
      security_amount: params.securityAmount,
      security_paid: params.securityPaid,
      notes: params.notes,
    });
  }
}
