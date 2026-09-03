import { supabase } from "@/lib/supabase/server";
import { getStore, updateStore } from "@/lib/storage/fileStore";
import { formatPKR } from "@/lib/utils/format";

export type TenantNotificationType =
  | "RENT_CREATED"
  | "RENT_REMINDER"
  | "RENT_DUE_TODAY"
  | "RENT_OVERDUE"
  | "ELECTRICITY_BILL_AVAILABLE"
  | "MAINTENANCE_UPDATE"
  | "GENERAL";

export interface TenantNotificationItem {
  id: string | number;
  plaza_id?: string | number;
  tenant_id: string | number;
  lease_id?: string | number | null;
  type: TenantNotificationType;
  title: string;
  message: string;
  href?: string | null;
  read: boolean;
  dedup_key: string;
  created_at: string;
}

export interface CreateNotificationInput {
  plazaId?: string | number;
  tenantId: string | number;
  leaseId?: string | number | null;
  type: TenantNotificationType;
  title: string;
  message: string;
  href?: string | null;
  dedupKey: string;
}

/**
 * Creates a deduplicated tenant notification.
 * If dedupKey already exists, skips insertion to prevent duplicates.
 */
export async function createTenantNotification(
  input: CreateNotificationInput
): Promise<{ created: boolean; notification: TenantNotificationItem }> {
  const store = getStore();
  const dedupKey = input.dedupKey.trim();

  // 1. Check in-memory / local JSON store for duplicate
  const existingInStore = (store.tenant_notifications || []).find(
    (n: any) => n.dedup_key === dedupKey
  );

  if (existingInStore) {
    return { created: false, notification: existingInStore };
  }

  // 2. Check Supabase for duplicate
  try {
    const { data: dbExisting } = await supabase
      .from("tenant_notifications")
      .select("*")
      .eq("dedup_key", dedupKey)
      .maybeSingle();

    if (dbExisting) {
      return { created: false, notification: dbExisting as TenantNotificationItem };
    }
  } catch {}

  const nowIso = new Date().toISOString();
  const newNotif: TenantNotificationItem = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    plaza_id: input.plazaId || 1,
    tenant_id: input.tenantId,
    lease_id: input.leaseId || null,
    type: input.type,
    title: input.title,
    message: input.message,
    href: input.href || "/tenant",
    read: false,
    dedup_key: dedupKey,
    created_at: nowIso,
  };

  // 3. Save to Supabase
  try {
    await supabase.from("tenant_notifications").insert({
      plaza_id: newNotif.plaza_id,
      tenant_id: newNotif.tenant_id,
      lease_id: newNotif.lease_id,
      type: newNotif.type,
      title: newNotif.title,
      message: newNotif.message,
      href: newNotif.href,
      read: false,
      dedup_key: dedupKey,
      created_at: nowIso,
    });
  } catch {}

  // 4. Save to local JSON store
  updateStore((s) => {
    if (!s.tenant_notifications) s.tenant_notifications = [];
    s.tenant_notifications = [newNotif, ...s.tenant_notifications].slice(0, 500);
  });

  return { created: true, notification: newNotif };
}

/**
 * Retrieves all notifications for a specific tenant
 */
export async function getTenantNotifications(tenantId: string | number): Promise<{
  notifications: TenantNotificationItem[];
  unreadCount: number;
}> {
  const store = getStore();
  let notifs: TenantNotificationItem[] = (store.tenant_notifications || []).filter(
    (n: any) => n.tenant_id?.toString() === tenantId.toString()
  );

  try {
    const { data: dbNotifs, error } = await supabase
      .from("tenant_notifications")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (!error && dbNotifs && dbNotifs.length > 0) {
      notifs = dbNotifs as TenantNotificationItem[];
    }
  } catch {}

  const unreadCount = notifs.filter((n) => !n.read).length;
  return { notifications: notifs, unreadCount };
}

/**
 * Marks a specific notification as read
 */
export async function markNotificationAsRead(
  notificationId: string | number,
  tenantId: string | number
): Promise<boolean> {
  // Update in store
  updateStore((s) => {
    if (s.tenant_notifications) {
      const idx = s.tenant_notifications.findIndex(
        (n: any) => n.id?.toString() === notificationId.toString()
      );
      if (idx !== -1) {
        s.tenant_notifications[idx].read = true;
      }
    }
  });

  // Update in Supabase
  try {
    await supabase
      .from("tenant_notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("tenant_id", tenantId);
  } catch {}

  return true;
}

/**
 * Marks all notifications as read for a tenant
 */
export async function markAllNotificationsAsRead(
  tenantId: string | number
): Promise<boolean> {
  updateStore((s) => {
    if (s.tenant_notifications) {
      s.tenant_notifications.forEach((n: any) => {
        if (n.tenant_id?.toString() === tenantId.toString()) {
          n.read = true;
        }
      });
    }
  });

  try {
    await supabase
      .from("tenant_notifications")
      .update({ read: true })
      .eq("tenant_id", tenantId);
  } catch {}

  return true;
}

// ─── Specialized Schedule Dispatchers ─────────────────────────────────

/**
 * 1st of month: RENT_CREATED
 */
export async function dispatchRentCreatedNotification(params: {
  tenantId: string | number;
  leaseId: string | number;
  monthStr: string; // "2026-09-01"
  rentAmount: number;
  dueDateStr: string; // "2026-09-10"
}) {
  const monthKey = params.monthStr.slice(0, 7);
  const dedupKey = `rent-created-${params.leaseId}-${monthKey}`;

  return createTenantNotification({
    tenantId: params.tenantId,
    leaseId: params.leaseId,
    type: "RENT_CREATED",
    title: "New Monthly Rent Generated",
    message: `Your rent for ${monthKey} has been generated. ${formatPKR(params.rentAmount)} is due by 10th.`,
    href: "/tenant",
    dedupKey,
  });
}

/**
 * 8th of month: RENT_REMINDER (only if unpaid)
 */
export async function dispatchRentReminderNotification(params: {
  tenantId: string | number;
  leaseId: string | number;
  monthStr: string;
  remainingAmount: number;
  dueDateStr: string;
}) {
  const monthKey = params.monthStr.slice(0, 7);
  const dedupKey = `rent-reminder-${params.leaseId}-${monthKey}`;

  return createTenantNotification({
    tenantId: params.tenantId,
    leaseId: params.leaseId,
    type: "RENT_REMINDER",
    title: "Upcoming Rent Due Date",
    message: `Friendly reminder: ${formatPKR(params.remainingAmount)} rent balance is due on 10th.`,
    href: "/tenant/payments",
    dedupKey,
  });
}

/**
 * 10th of month: RENT_DUE_TODAY (only if unpaid)
 */
export async function dispatchRentDueTodayNotification(params: {
  tenantId: string | number;
  leaseId: string | number;
  monthStr: string;
  remainingAmount: number;
}) {
  const monthKey = params.monthStr.slice(0, 7);
  const dedupKey = `rent-due-${params.leaseId}-${monthKey}`;

  return createTenantNotification({
    tenantId: params.tenantId,
    leaseId: params.leaseId,
    type: "RENT_DUE_TODAY",
    title: "Rent is Due Today",
    message: `Your monthly rent of ${formatPKR(params.remainingAmount)} is due today (10th). Please submit payment to avoid late arrears.`,
    href: "/tenant/payments",
    dedupKey,
  });
}

/**
 * 13th of month: RENT_OVERDUE (only if unpaid/partial)
 */
export async function dispatchRentOverdueNotification(params: {
  tenantId: string | number;
  leaseId: string | number;
  monthStr: string;
  remainingAmount: number;
}) {
  const monthKey = params.monthStr.slice(0, 7);
  const dedupKey = `rent-overdue-${params.leaseId}-${monthKey}`;

  return createTenantNotification({
    tenantId: params.tenantId,
    leaseId: params.leaseId,
    type: "RENT_OVERDUE",
    title: "Rent Payment Overdue",
    message: `Your rent payment of ${formatPKR(params.remainingAmount)} was due on the 10th and is currently overdue. Please settle your account immediately.`,
    href: "/tenant/payments",
    dedupKey,
  });
}

/**
 * When genuinely NEW electricity bill is detected
 */
export async function dispatchElectricityBillNotification(params: {
  tenantId: string | number;
  billId: string | number;
  monthStr: string;
  allocatedAmount: number;
  dueDateStr?: string | null;
}) {
  const dedupKey = `electricity-bill-${params.billId}-${params.tenantId}`;

  return createTenantNotification({
    tenantId: params.tenantId,
    type: "ELECTRICITY_BILL_AVAILABLE",
    title: "New Electricity Bill Available",
    message: `Your IESCO electricity bill for ${params.monthStr.slice(0, 7)} is now available (${formatPKR(params.allocatedAmount)}). Due date: ${params.dueDateStr || "As per IESCO schedule"}.`,
    href: "/tenant/bills",
    dedupKey,
  });
}
