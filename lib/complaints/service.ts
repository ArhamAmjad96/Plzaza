import { supabase } from "@/lib/supabase/server";
import { getAllUnits, UnitItem, getPrimaryPlaza } from "@/lib/units/service";
import { getTenantsWithLeases, TenantItem } from "@/lib/tenants/service";

export type ComplaintCategory =
  | "Electrical"
  | "Wall / Paint"
  | "Roof"
  | "Water / Plumbing"
  | "Door / Lock"
  | "Flooring"
  | "AC"
  | "Washroom"
  | "Leakage"
  | "Structural"
  | "Other";

export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type ComplaintStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export interface ComplaintItem {
  id: number | string;
  plaza_id: number | string;
  unit_id: number | string;
  tenant_id?: number | string | null;
  complaint_number: string;
  category: ComplaintCategory;
  title: string;
  description?: string | null;
  photo_attachment?: string | null;
  complaint_date: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assigned_to?: string | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  created_at?: string;
  updated_at?: string;
  unit_name?: string;
  floor?: string;
  tenant_name?: string;
  tenant_phone?: string;
}

export interface ComplaintStats {
  totalComplaints: number;
  openCount: number;
  assignedCount: number;
  inProgressCount: number;
  resolvedCount: number;
  highPriorityCount: number;
}

let fallbackComplaints: ComplaintItem[] = [];

export function resetComplaintsMemory(): void {
  fallbackComplaints = [];
}

export function generateComplaintNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 7).replace("-", "");
  const rand = Math.floor(100 + Math.random() * 900);
  return `CMP-${dateStr}-${rand}`;
}

export async function getAllComplaints(): Promise<{
  complaints: ComplaintItem[];
  stats: ComplaintStats;
}> {
  const [{ units }, { tenants }] = await Promise.all([
    getAllUnits(),
    getTenantsWithLeases(),
  ]);

  const unitsMap = new Map<string, UnitItem>();
  units.forEach((u) => unitsMap.set(u.id.toString(), u));

  const tenantsMap = new Map<string, TenantItem>();
  tenants.forEach((t) => tenantsMap.set(t.tenant.id.toString(), t.tenant));

  let rawComplaints: ComplaintItem[] = [];

  try {
    const { data: dbComplaints, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && dbComplaints) {
      rawComplaints = dbComplaints as ComplaintItem[];
    } else {
      rawComplaints = [...fallbackComplaints];
    }
  } catch {
    rawComplaints = [...fallbackComplaints];
  }

  const enriched: ComplaintItem[] = rawComplaints.map((c) => {
    const unit = unitsMap.get(c.unit_id.toString());
    const tenant = c.tenant_id ? tenantsMap.get(c.tenant_id.toString()) : null;

    return {
      ...c,
      unit_name: unit?.unit_name || `Unit #${c.unit_id}`,
      floor: unit?.floor || "Ground Floor",
      tenant_name: tenant?.full_name || undefined,
      tenant_phone: tenant?.phone || undefined,
    };
  });

  const totalComplaints = enriched.length;
  const openCount = enriched.filter((c) => c.status === "OPEN").length;
  const assignedCount = enriched.filter((c) => c.status === "ASSIGNED").length;
  const inProgressCount = enriched.filter((c) => c.status === "IN_PROGRESS").length;
  const resolvedCount = enriched.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;
  const highPriorityCount = enriched.filter((c) => c.priority === "HIGH" || c.priority === "URGENT").length;

  return {
    complaints: enriched,
    stats: {
      totalComplaints,
      openCount,
      assignedCount,
      inProgressCount,
      resolvedCount,
      highPriorityCount,
    },
  };
}

export async function createComplaint(data: {
  unitId: number | string;
  tenantId?: number | string | null;
  category: ComplaintCategory;
  title: string;
  description?: string | null;
  photoAttachment?: string | null;
  priority?: ComplaintPriority;
  assignedTo?: string | null;
  complaintDate?: string;
}): Promise<ComplaintItem> {
  const plaza = await getPrimaryPlaza();
  const today = data.complaintDate || new Date().toISOString().split("T")[0];
  const cNumber = generateComplaintNumber();

  const item: ComplaintItem = {
    id: Date.now(),
    plaza_id: plaza.id,
    unit_id: data.unitId,
    tenant_id: data.tenantId || null,
    complaint_number: cNumber,
    category: data.category,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    photo_attachment: data.photoAttachment || null,
    complaint_date: today,
    priority: data.priority || "MEDIUM",
    status: data.assignedTo ? "ASSIGNED" : "OPEN",
    assigned_to: data.assignedTo?.trim() || null,
    created_at: new Date().toISOString(),
  };

  try {
    const { data: dbItem, error } = await supabase
      .from("complaints")
      .insert({
        plaza_id: plaza.id,
        unit_id: item.unit_id,
        tenant_id: item.tenant_id,
        complaint_number: item.complaint_number,
        category: item.category,
        title: item.title,
        description: item.description,
        photo_attachment: item.photo_attachment,
        complaint_date: item.complaint_date,
        priority: item.priority,
        status: item.status,
        assigned_to: item.assigned_to,
      })
      .select()
      .maybeSingle();

    if (!error && dbItem) {
      item.id = dbItem.id;
    }
  } catch {
    // Non-blocking
  }

  fallbackComplaints = [item, ...fallbackComplaints];
  return item;
}

export async function updateComplaint(
  id: number | string,
  data: Partial<ComplaintItem>
): Promise<ComplaintItem | null> {
  const patch: any = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  if (data.status === "RESOLVED" || data.status === "CLOSED") {
    patch.resolved_at = new Date().toISOString();
  }

  try {
    const { data: updated, error } = await supabase
      .from("complaints")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (!error && updated) {
      return updated as ComplaintItem;
    }
  } catch {
    // Non-blocking
  }

  const idx = fallbackComplaints.findIndex((c) => c.id.toString() === id.toString());
  if (idx !== -1) {
    fallbackComplaints[idx] = { ...fallbackComplaints[idx], ...patch };
    return fallbackComplaints[idx];
  }

  return null;
}

export async function deleteComplaint(id: number | string): Promise<boolean> {
  try {
    await supabase.from("complaints").delete().eq("id", id);
  } catch {
    // Non-blocking
  }

  fallbackComplaints = fallbackComplaints.filter((c) => c.id.toString() !== id.toString());
  return true;
}
