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

let fallbackComplaints: ComplaintItem[] = [
  {
    id: 1,
    plaza_id: 1,
    unit_id: 3,
    tenant_id: 101,
    complaint_number: "CMP-2608-011",
    category: "Leakage",
    title: "Water seepage from back wall",
    description: "Moisture detected on back wall during heavy rains; needs waterproofing sealant.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    complaint_date: "2026-08-10",
    assigned_to: "Plumber Aslam",
    unit_name: "Basement Shop B-03",
    floor: "Basement",
    tenant_name: "Arham Fabrics",
  },
  {
    id: 2,
    plaza_id: 1,
    unit_id: 15,
    tenant_id: 102,
    complaint_number: "CMP-2608-012",
    category: "Electrical",
    title: "Main breaker tripping intermittently",
    description: "Room main switch trips when water geyser is turned on.",
    priority: "MEDIUM",
    status: "ASSIGNED",
    complaint_date: "2026-08-12",
    assigned_to: "Electrician Tariq",
    unit_name: "Flat 1 Room 1",
    floor: "Flat 1",
    tenant_name: "Ali Raza",
  },
];

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

    if (!error && dbComplaints && dbComplaints.length > 0) {
      rawComplaints = dbComplaints as ComplaintItem[];
    } else {
      rawComplaints = [...fallbackComplaints];
    }
  } catch (err) {
    rawComplaints = [...fallbackComplaints];
  }

  const enriched: ComplaintItem[] = rawComplaints.map((c) => {
    const unit = unitsMap.get(c.unit_id.toString());
    const tenant = c.tenant_id ? tenantsMap.get(c.tenant_id.toString()) : null;

    return {
      ...c,
      unit_name: unit?.unit_name || c.unit_name || "Plaza Unit",
      floor: unit?.floor || c.floor || "Ground",
      tenant_name: tenant?.full_name || c.tenant_name || "Unassigned",
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
  complaintDate?: string;
  priority?: ComplaintPriority;
  assignedTo?: string | null;
}): Promise<ComplaintItem> {
  const plaza = await getPrimaryPlaza();
  const complaintNumber = generateComplaintNumber();

  try {
    const { data: complaint, error } = await supabase
      .from("complaints")
      .insert({
        plaza_id: plaza.id,
        unit_id: data.unitId,
        tenant_id: data.tenantId || null,
        complaint_number: complaintNumber,
        category: data.category,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        photo_attachment: data.photoAttachment || null,
        complaint_date: data.complaintDate || new Date().toISOString().split("T")[0],
        priority: data.priority || "MEDIUM",
        status: data.assignedTo?.trim() ? "ASSIGNED" : "OPEN",
        assigned_to: data.assignedTo?.trim() || null,
      })
      .select()
      .maybeSingle();

    if (!error && complaint) {
      return complaint;
    }
  } catch (err) {
    // Fallback
  }

  const fallback: ComplaintItem = {
    id: Date.now(),
    plaza_id: plaza.id,
    unit_id: data.unitId,
    tenant_id: data.tenantId || null,
    complaint_number: complaintNumber,
    category: data.category,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    photo_attachment: data.photoAttachment || null,
    complaint_date: data.complaintDate || new Date().toISOString().split("T")[0],
    priority: data.priority || "MEDIUM",
    status: data.assignedTo?.trim() ? "ASSIGNED" : "OPEN",
    assigned_to: data.assignedTo?.trim() || null,
    created_at: new Date().toISOString(),
  };

  fallbackComplaints.unshift(fallback);
  return fallback;
}

export async function updateComplaint(
  id: number | string,
  data: Partial<{
    category: ComplaintCategory;
    title: string;
    description: string | null;
    priority: ComplaintPriority;
    status: ComplaintStatus;
    assignedTo: string | null;
    resolutionNotes: string | null;
  }>
): Promise<ComplaintItem | null> {
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (data.category !== undefined) updatePayload.category = data.category;
  if (data.title !== undefined) updatePayload.title = data.title.trim();
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.priority !== undefined) updatePayload.priority = data.priority;
  if (data.status !== undefined) {
    updatePayload.status = data.status;
    if (data.status === "RESOLVED" || data.status === "CLOSED") {
      updatePayload.resolved_at = new Date().toISOString();
    }
  }
  if (data.assignedTo !== undefined) updatePayload.assigned_to = data.assignedTo;
  if (data.resolutionNotes !== undefined) updatePayload.resolution_notes = data.resolutionNotes;

  try {
    const { data: updated, error } = await supabase
      .from("complaints")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (!error && updated) {
      return updated;
    }
  } catch (err) {
    // Fallback
  }

  const idx = fallbackComplaints.findIndex((c) => c.id.toString() === id.toString());
  if (idx !== -1) {
    fallbackComplaints[idx] = {
      ...fallbackComplaints[idx],
      ...data,
      assigned_to: data.assignedTo ?? fallbackComplaints[idx].assigned_to,
      resolution_notes: data.resolutionNotes ?? fallbackComplaints[idx].resolution_notes,
    };
    return fallbackComplaints[idx];
  }

  return null;
}

export async function deleteComplaint(id: number | string): Promise<boolean> {
  try {
    await supabase.from("complaints").delete().eq("id", id);
  } catch (err) {
    // Fallback
  }

  fallbackComplaints = fallbackComplaints.filter((c) => c.id.toString() !== id.toString());
  return true;
}
