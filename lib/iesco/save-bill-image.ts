import { supabase } from "@/lib/supabase/server";

/**
 * Stores the generated bill PNG image in Supabase Storage ('bill-images' bucket),
 * with a Data URL fallback if the bucket is not created or configured.
 */
export async function storeBillImage(
  pngBuffer: Buffer,
  connectionId: string | number,
  billingMonth: string
): Promise<string> {
  const sanitizedMonth = billingMonth.replace(/[^a-zA-Z0-9-]/g, "_");
  const fileName = `bills/${connectionId}/${sanitizedMonth}.png`;

  try {
    // Attempt upload to Supabase Storage bucket 'bill-images'
    const { data, error } = await supabase.storage
      .from("bill-images")
      .upload(fileName, pngBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage
        .from("bill-images")
        .getPublicUrl(fileName);

      if (publicUrlData?.publicUrl) {
        console.log("Uploaded bill image to Supabase Storage:", publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
      }
    } else if (error) {
      console.warn("Supabase storage upload note:", error.message);
    }
  } catch (err) {
    console.warn("Storage upload fallback used:", err);
  }

  // Fallback to Base64 Data URL format
  console.log("Using Base64 Data URL format for bill image storage.");
  const base64 = pngBuffer.toString("base64");
  return `data:image/png;base64,${base64}`;
}
