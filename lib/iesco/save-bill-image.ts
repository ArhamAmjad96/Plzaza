/**
 * Converts the Playwright-generated bill PNG buffer into a full Data URL
 * string ready to be stored directly inside the Supabase database.
 */
export async function storeBillImage(
  pngBuffer: Buffer,
  _connectionId?: string | number,
  _billingMonth?: string
): Promise<string> {
  const base64 = pngBuffer.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;
  console.log(`Generated PNG bill image Data URL (${pngBuffer.length} bytes) for database storage.`);
  return dataUrl;
}
