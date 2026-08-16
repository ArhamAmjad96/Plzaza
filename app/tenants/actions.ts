"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase/server";

export async function updateTenant(
  connectionId: string,
  formData: FormData
) {
  const tenant = String(formData.get("tenant") || "").trim();

  const { error } = await supabase
    .from("connections")
    .update({
      tenant: tenant || null,
    })
    .eq("id", connectionId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tenants");
  revalidatePath("/connections");
  revalidatePath(`/connections/${connectionId}`);
}