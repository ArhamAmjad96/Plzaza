"use server";

import { supabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markBillAsPaid(id: string) {
  const { error } = await supabase
    .from("bills")
    .update({
      status: "paid",
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/bills/${id}`);
  revalidatePath(`/connections`);
  const { data: bill } = await supabase
  .from("bills")
  .select("connection_id")
  .eq("id", id)
  .single();

if (bill) {
  revalidatePath(`/connections/${bill.connection_id}`);
}
  revalidatePath(`/`);
}
export async function deleteBill(id: string) {
  const { error } = await supabase
    .from("bills")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/connections");
}