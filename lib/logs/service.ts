import { supabase } from "@/lib/supabase/server";
import { getStore, updateStore } from "@/lib/storage/fileStore";

export type ActivityCategory =
  | "PLAZA"
  | "UNITS"
  | "TENANTS"
  | "PAYMENTS"
  | "ELECTRICITY"
  | "MAINTENANCE"
  | "EXPENSES"
  | "SYSTEM";

export interface ActivityLogItem {
  id: string | number;
  category: ActivityCategory;
  action: string;
  title: string;
  description: string;
  metadata?: Record<string, any> | null;
  actor?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string | number;
  log_id?: string | number;
  category: ActivityCategory;
  title: string;
  message: string;
  href?: string;
  read: boolean;
  created_at: string;
}

/**
 * Records an activity log and optionally generates a notification
 */
export async function logActivity(params: {
  category: ActivityCategory;
  action: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  actor?: string;
  notify?: boolean;
  href?: string;
}): Promise<ActivityLogItem> {
  const {
    category,
    action,
    title,
    description,
    metadata = null,
    actor = "Manager",
    notify = true,
    href,
  } = params;

  const now = new Date().toISOString();
  const logItem: ActivityLogItem = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    category,
    action,
    title,
    description,
    metadata,
    actor,
    created_at: now,
  };

  const notifItem: NotificationItem | null = notify
    ? {
        id: `notif-${logItem.id}`,
        log_id: logItem.id,
        category,
        title,
        message: description,
        href: href || getCategoryDefaultHref(category),
        read: false,
        created_at: now,
      }
    : null;

  // Persist to fileStore
  updateStore((s) => {
    s.logs = [logItem, ...(s.logs || [])].slice(0, 500); // Keep latest 500 logs
    if (notifItem) {
      s.notifications = [notifItem, ...(s.notifications || [])].slice(0, 100);
    }
  });

  // Also try Supabase if audit table exists
  try {
    await supabase.from("activity_logs").insert({
      category: logItem.category,
      action: logItem.action,
      title: logItem.title,
      description: logItem.description,
      metadata: logItem.metadata,
      created_at: logItem.created_at,
    });
  } catch {}

  return logItem;
}

function getCategoryDefaultHref(category: ActivityCategory): string {
  switch (category) {
    case "PLAZA":
      return "/settings";
    case "UNITS":
      return "/units";
    case "TENANTS":
      return "/tenants";
    case "PAYMENTS":
      return "/rent";
    case "ELECTRICITY":
      return "/connections";
    case "MAINTENANCE":
      return "/complaints";
    case "EXPENSES":
      return "/expenses";
    default:
      return "/";
  }
}

/**
 * Retrieves all activity logs with optional category filtering and search
 */
export async function getActivityLogs(options?: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<{ logs: ActivityLogItem[]; total: number }> {
  const store = getStore();
  let list: ActivityLogItem[] = store.logs || [];

  try {
    const { data: dbLogs } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (dbLogs && dbLogs.length > 0) {
      const mergedMap = new Map<string, ActivityLogItem>();
      list.forEach((l) => mergedMap.set(l.id.toString(), l));
      dbLogs.forEach((l: any) => mergedMap.set(l.id.toString(), l));
      list = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  } catch {}

  // Apply filters
  if (options?.category && options.category !== "ALL") {
    const targetCat = options.category.toUpperCase();
    list = list.filter((l) => l.category.toUpperCase() === targetCat);
  }

  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    list = list.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.actor && l.actor.toLowerCase().includes(q))
    );
  }

  const limit = options?.limit || 100;
  return {
    logs: list.slice(0, limit),
    total: list.length,
  };
}

/**
 * Retrieves notifications list and unread count
 */
export async function getNotifications(): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
}> {
  const store = getStore();
  const notifs: NotificationItem[] = store.notifications || [];
  const unreadCount = notifs.filter((n) => !n.read).length;

  return {
    notifications: notifs.slice(0, 30),
    unreadCount,
  };
}

/**
 * Marks all notifications or a single notification as read
 */
export async function markNotificationsAsRead(notifId?: string | number): Promise<void> {
  updateStore((s) => {
    if (!s.notifications) s.notifications = [];
    if (notifId) {
      const target = s.notifications.find((n) => n.id.toString() === notifId.toString());
      if (target) target.read = true;
    } else {
      s.notifications.forEach((n) => {
        n.read = true;
      });
    }
  });
}

/**
 * Clears activity logs and notifications
 */
export async function clearAllActivityLogs(): Promise<void> {
  updateStore((s) => {
    s.logs = [];
    s.notifications = [];
  });
}
