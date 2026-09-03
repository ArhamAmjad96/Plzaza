import { saveBillFile } from "@/lib/bills/bill-storage";

/**
 * Saves a Playwright-generated bill PNG buffer into persistent storage
 * (local disk storage and Supabase storage bucket) and returns the accessible URL.
 */
export async function storeBillImage(
  pngBuffer: Buffer,
  connectionId?: string | number,
  billingMonth?: string,
  referenceNumber?: string
): Promise<string> {
  try {
    const month = billingMonth || new Date().toISOString().slice(0, 7) + "-01";
    const ref = referenceNumber || "general";
    const connId = connectionId || "general";

    const result = await saveBillFile({
      buffer: pngBuffer,
      connectionId: connId,
      referenceNumber: ref,
      billingMonth: month,
      fileType: "image/png",
    });

    console.log(`Saved persistent bill image: ${result.fileUrl} (${pngBuffer.length} bytes)`);
    return result.fileUrl;
  } catch (err) {
    console.error("Error storing bill image file:", err);
    // Fallback to data URL only if storage completely fails
    return `data:image/png;base64,${pngBuffer.toString("base64")}`;
  }
}
