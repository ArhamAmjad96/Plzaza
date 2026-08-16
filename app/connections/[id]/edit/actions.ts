"use server";

import { supabase } from "@/lib/supabase/server";

export async function updateConnection(
  id: string,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  const meterNumber = String(formData.get("meter_number") || "").trim();
  const tenant = String(formData.get("tenant") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const tariff = String(formData.get("tariff") || "").trim();

  if (!name) {
    throw new Error("Connection name is required.");
  }

  const { error } = await supabase
    .from("connections")
    .update({
      name,
      meter_number: meterNumber || null,
      tenant: tenant || null,
      location: location || null,
      tariff: tariff || null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function toggleConnection(
  id: string,
  active: boolean
) {
  const { error } = await supabase
    .from("connections")
    .update({ active })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}