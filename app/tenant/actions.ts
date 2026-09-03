"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/auth/tenant-context";
import { logActivity } from "@/lib/logs/service";
import { createTenantNotification } from "@/lib/notifications/service";
import { formatPKR } from "@/lib/utils/format";

export interface NotifyPaymentInput {
  paymentType: "FULL_RENT" | "PARTIAL_RENT" | "SECURITY" | "OTHER";
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "EASYPAISA_JAZZCASH" | "CHEQUE";
  paymentDate: string;
  referenceNotes?: string;
}

export async function notifyAdminOfPaymentAction(input: NotifyPaymentInput) {
  try {
    const context = await getTenantContext();
    const tenant = context.tenant;
    const unit = context.unit;

    if (!tenant) {
      return { success: false, error: "Tenant session not found." };
    }

    const tenantName = tenant.full_name || context.user.fullName;
    const unitName = unit?.unit_name || "Unassigned Space";
    const amountStr = formatPKR(input.amount);

    const typeLabel =
      input.paymentType === "FULL_RENT"
        ? "Full Rent"
        : input.paymentType === "PARTIAL_RENT"
        ? "Partial Rent"
        : input.paymentType === "SECURITY"
        ? "Security Deposit"
        : "Payment";

    const methodLabel =
      input.paymentMethod === "CASH"
        ? "Cash"
        : input.paymentMethod === "BANK_TRANSFER"
        ? "Bank Transfer (vvit IBFT)"
        : input.paymentMethod === "EASYPAISA_JAZZCASH"
        ? "Easypaisa / JazzCash"
        : "Cheque";

    const notes = input.referenceNotes?.trim();

    // 1. Send High-Priority Notification to Admin Topbar & Activity Logs
    await logActivity({
      category: "PAYMENTS",
      action: "TENANT_PAYMENT_SUBMITTED",
      title: `🐰 Payment Reported: ${tenantName} (${unitName})`,
      description: `${tenantName} reported a ${typeLabel} payment of ${amountStr} via ${methodLabel} on ${input.paymentDate}.${notes ? ` Notes: "${notes}"` : ""}`,
      metadata: {
        tenant_id: tenant.id,
        tenant_name: tenantName,
        unit_name: unitName,
        amount: input.amount,
        payment_type: input.paymentType,
        payment_method: input.paymentMethod,
        payment_date: input.paymentDate,
        notes: notes || null,
        reported_at: new Date().toISOString(),
      },
      actor: tenantName,
      notify: true,
      href: "/rent",
    });

    // 2. Add a confirmation record in tenant's own notification history
    await createTenantNotification({
      tenantId: tenant.id,
      type: "GENERAL",
      title: "Payment Notification Sent to Admin",
      message: `You notified the Admin of ${amountStr} (${typeLabel}, ${methodLabel}). The admin will review and record your payment.`,
      href: "/tenant/payments",
      dedupKey: `tenant-notif-payment-${tenant.id}-${Date.now()}`,
    });


    revalidatePath("/tenant");
    revalidatePath("/rent");
    revalidatePath("/logs");
    revalidatePath("/");

    return {
      success: true,
      message: `Payment notification for ${amountStr} has been successfully sent to the Admin.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to notify admin.",
    };
  }
}
