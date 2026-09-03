import { redirect } from "next/navigation";
import { getSession, getCurrentProfile } from "./server-auth";
import { getStore } from "@/lib/storage/fileStore";
import { supabase } from "@/lib/supabase/server";
import { getBillsForUnit } from "@/lib/bills/service";
import { ElectricityBillItem } from "@/lib/bills/service";
import { getTenantsWithLeases } from "@/lib/tenants/service";
import { getAllUnits } from "@/lib/units/service";

export interface TenantContextData {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: "TENANT";
  };
  tenant: {
    id: number | string;
    full_name: string;
    cnic?: string | null;
    phone?: string | null;
    email?: string | null;
    emergency_contact?: string | null;
    status: string;
  } | null;
  lease: {
    id: number | string;
    tenant_id: number | string;
    unit_id: number | string;
    start_date: string;
    end_date: string;
    lease_start_date?: string;
    lease_end_date?: string | null;
    move_in_date?: string;
    monthly_rent: number;
    security_amount: number;
    security_paid: number;
    security_status: string;
    status: string;
  } | null;
  unit: {
    id: number | string;
    unit_name: string;
    floor: string;
    unit_type: string;
    area_sqft?: number | null;
    status: string;
    reference_number?: string | null;
    meter_number?: string | null;
  } | null;
  electricity: {
    connection_id?: number | string;
    reference_number?: string;
    meter_number?: string | null;
    is_shared: boolean;
    split_value: number;
    bills: ElectricityBillItem[];
    latestBill?: ElectricityBillItem | null;
  };
  payments: any[];
  ledgers: any[];
  complaints: any[];
  outstandingBalance: number;
}

/**
 * Centralized server-side context resolver for Tenant Portal.
 * Enforces server-side authentication, verifies TENANT role, and securely
 * derives Tenant -> Active Lease -> Unit -> Electricity -> Bills -> Payments -> Complaints.
 */
export async function getTenantContext(options?: {
  allowUnauthorized?: boolean;
}): Promise<TenantContextData> {
  const session = await getSession();
  if (!session) {
    if (options?.allowUnauthorized) {
      throw new Error("UNAUTHORIZED");
    }
    redirect("/login");
  }

  if (session.role !== "TENANT") {
    if (options?.allowUnauthorized) {
      throw new Error("FORBIDDEN");
    }
    redirect("/");
  }

  const profile = await getCurrentProfile();
  const [{ tenants: allTenantsWithLeases }, { units: allUnits }] = await Promise.all([
    getTenantsWithLeases(),
    getAllUnits(),
  ]);

  // 1. Resolve Tenant Record
  let tenantId = profile?.tenant_id ?? session.tenantId ?? null;
  let matchedTenantPackage: any = null;

  if (tenantId) {
    matchedTenantPackage = allTenantsWithLeases.find(
      (t) => t.tenant.id?.toString() === tenantId?.toString()
    );
  }

  if (!matchedTenantPackage && session.email) {
    matchedTenantPackage = allTenantsWithLeases.find(
      (t) => (t.tenant as any).email?.toLowerCase() === session.email.toLowerCase()
    );
  }

  // Only allow demo fallback if specifically logged in as demo account tenant@plaza.com
  if (!matchedTenantPackage && session.email === "tenant@plaza.com" && allTenantsWithLeases.length > 0) {
    matchedTenantPackage = allTenantsWithLeases[0];
  }

  let tenant = matchedTenantPackage?.tenant || null;
  let rawLease = matchedTenantPackage?.lease || null;
  let lease = rawLease
    ? {
        ...rawLease,
        start_date:
          rawLease.lease_start_date ||
          rawLease.start_date ||
          rawLease.move_in_date ||
          "—",
        end_date:
          rawLease.lease_end_date ||
          rawLease.end_date ||
          "—",
        lease_start_date:
          rawLease.lease_start_date ||
          rawLease.start_date ||
          rawLease.move_in_date ||
          "—",
        lease_end_date:
          rawLease.lease_end_date ||
          rawLease.end_date ||
          "—",
      }
    : null;
  let unit = matchedTenantPackage?.unit || null;

  // If unit wasn't populated in lease, find it from allUnits
  if (!unit && lease?.unit_id) {
    unit = allUnits.find((u) => u.id?.toString() === lease.unit_id.toString()) || null;
  }

  if (!tenant) {
    tenant = {
      id: tenantId || 0,
      full_name: profile?.full_name || session.fullName || "Commercial Tenant",
      phone: "",
      email: session.email,
      status: "ACTIVE",
    };
  }

  // 2. Resolve Electricity Connection, Mapping, and Bills
  let bills: ElectricityBillItem[] = [];
  let connectionId: number | string | undefined = undefined;
  let refNumber: string | undefined = undefined;
  let meterNumber: string | null = null;
  let isShared = false;
  let splitValue = 100;

  if (unit?.id) {
    const billsData = await getBillsForUnit(unit.id);
    bills = billsData.bills || [];
    connectionId = billsData.connection_id;
    refNumber = billsData.reference_number || unit.reference_number;
    isShared = billsData.is_shared;
    splitValue = billsData.split_value;
  }

  const latestBill = bills.length > 0 ? bills[0] : null;

  // 3. Resolve Payments
  let tenantPayments: any[] = [];
  try {
    const { getPaymentsForTenant } = await import("@/lib/payments/service");
    if (tenant?.id) {
      tenantPayments = await getPaymentsForTenant(tenant.id);
    }
  } catch {}

  // 4. Resolve Monthly Ledgers & Outstanding Balance
  let ledgers: any[] = [];
  try {
    const { getMonthlyLedgers } = await import("@/lib/ledgers/service");
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { items } = await getMonthlyLedgers(currentMonth);
    ledgers = (items || []).filter(
      (l: any) =>
        (tenant?.id && l.tenant_id?.toString() === tenant.id.toString()) ||
        (unit?.id && l.unit_id?.toString() === unit.id.toString())
    );
  } catch {}

  const latestLedger = ledgers[0];
  const outstandingBalance = latestLedger ? Number(latestLedger.remaining_balance || 0) : 0;

  // 5. Resolve Complaints
  let tenantComplaints: any[] = [];
  try {
    const { getAllComplaints } = await import("@/lib/complaints/service");
    const { complaints: allComplaints } = await getAllComplaints();
    tenantComplaints = allComplaints.filter(
      (c: any) =>
        (tenant?.id && c.tenant_id?.toString() === tenant.id.toString()) ||
        (unit?.id && c.unit_id?.toString() === unit.id.toString())
    );
  } catch {}

  return {
    user: {
      id: session.userId,
      email: session.email,
      fullName: profile?.full_name || session.fullName,
      role: "TENANT",
    },
    tenant: tenant ? {
      id: tenant.id,
      full_name: tenant.full_name,
      cnic: tenant.cnic || null,
      phone: tenant.phone || null,
      email: tenant.email || null,
      emergency_contact: tenant.emergency_contact || null,
      status: tenant.status || "ACTIVE",
    } : null,
    lease: lease ? {
      id: lease.id,
      tenant_id: lease.tenant_id,
      unit_id: lease.unit_id,
      start_date: lease.start_date,
      end_date: lease.end_date,
      monthly_rent: Number(lease.monthly_rent || 0),
      security_amount: Number(lease.security_amount || 0),
      security_paid: Number(lease.security_paid || 0),
      security_status: lease.security_status || "HELD",
      status: lease.status || "ACTIVE",
    } : null,
    unit: unit ? {
      id: unit.id,
      unit_name: unit.unit_name,
      floor: unit.floor,
      unit_type: unit.unit_type || "COMMERCIAL",
      area_sqft: unit.area_sqft || null,
      status: unit.status || "OCCUPIED",
      reference_number: refNumber || unit.reference_number || null,
      meter_number: meterNumber || unit.meter_number || null,
    } : null,
    electricity: {
      connection_id: connectionId,
      reference_number: refNumber,
      meter_number: meterNumber,
      is_shared: isShared,
      split_value: splitValue,
      bills,
      latestBill,
    },
    payments: tenantPayments,
    ledgers,
    complaints: tenantComplaints,
    outstandingBalance,
  };
}
