"use server";

import { revalidatePath } from "next/cache";
import { markNotificationsAsRead, clearAllActivityLogs, logActivity, ActivityCategory } from "@/lib/logs/service";

export async function markNotificationsAsReadAction(notifId?: string | number) {
  try {
    await markNotificationsAsRead(notifId);
    revalidatePath("/logs");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to mark notifications" };
  }
}

export async function clearAllLogsAction() {
  try {
    await clearAllActivityLogs();
    revalidatePath("/logs");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to clear logs" };
  }
}

export async function getNotificationsAction() {
  try {
    const { getNotifications } = await import("@/lib/logs/service");
    return await getNotifications();
  } catch {
    return { notifications: [], unreadCount: 0 };
  }
}

export async function createManualLogAction(data: {
  category: ActivityCategory;
  action: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
}) {
  try {
    await logActivity(data);
    revalidatePath("/logs");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create log" };
  }
}
