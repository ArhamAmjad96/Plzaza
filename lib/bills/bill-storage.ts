import { supabase } from "@/lib/supabase/server";

export interface SaveBillFileParams {
  buffer: Buffer | Uint8Array;
  plazaId?: number | string;
  connectionId?: number | string;
  referenceNumber: string;
  billingMonth: string; // e.g. "2026-08-01" or "2026-08"
  fileType?: "image/png" | "application/pdf" | "image/jpeg";
}

export interface StoredBillFileResult {
  filePath: string; // e.g. "electricity-bills/1/33/2026-08/bill.png"
  fileUrl: string;  // e.g. "/uploads/electricity-bills/1/33/2026-08/bill.png"
  downloadName: string; // e.g. "electricity-bill-15142165162900-2026-08.png"
  fileType: string;
}

function getFs() {
  if (typeof window !== "undefined") return null;
  try {
    return require("fs");
  } catch {
    return null;
  }
}

function getPath() {
  if (typeof window !== "undefined") return null;
  try {
    return require("path");
  } catch {
    return null;
  }
}

/**
 * Normalizes billing month to "YYYY-MM" for folder paths and filenames
 */
export function formatMonthSlug(billingMonth: string): string {
  if (!billingMonth) return new Date().toISOString().slice(0, 7);
  return billingMonth.slice(0, 7);
}

/**
 * Generates standard downloadable filename: electricity-bill-{ref}-{month}.png
 */
export function generateBillFilename(referenceNumber: string, billingMonth: string, ext = "png"): string {
  const cleanRef = referenceNumber.replace(/[^0-9]/g, "") || "bill";
  const monthSlug = formatMonthSlug(billingMonth);
  return `electricity-bill-${cleanRef}-${monthSlug}.${ext}`;
}

/**
 * Saves a bill binary file to persistent local storage and optionally Supabase Storage
 */
export async function saveBillFile(params: SaveBillFileParams): Promise<StoredBillFileResult> {
  const { buffer, plazaId = 1, connectionId = "general", referenceNumber, billingMonth, fileType = "image/png" } = params;

  const ext = fileType === "application/pdf" ? "pdf" : "png";
  const monthSlug = formatMonthSlug(billingMonth);
  const cleanRef = referenceNumber.replace(/[^0-9]/g, "");
  const downloadName = generateBillFilename(cleanRef, monthSlug, ext);

  const pathMod = getPath();
  const fsMod = getFs();

  const relativeSubpath = pathMod
    ? pathMod.join("electricity-bills", plazaId.toString(), connectionId.toString(), monthSlug).replace(/\\/g, "/")
    : `electricity-bills/${plazaId}/${connectionId}/${monthSlug}`;

  const relativeFilePath = `${relativeSubpath}/bill.${ext}`;

  // 1. Local disk storage in public/uploads for direct, instant web access
  if (fsMod && pathMod) {
    try {
      const publicDir = pathMod.join(process.cwd(), "public", "uploads", relativeSubpath);
      const localDiskFilePath = pathMod.join(process.cwd(), "public", "uploads", relativeFilePath);

      if (!fsMod.existsSync(publicDir)) {
        fsMod.mkdirSync(publicDir, { recursive: true });
      }
      fsMod.writeFileSync(localDiskFilePath, Buffer.from(buffer));
    } catch (diskErr) {
      console.error("Local disk storage error:", diskErr);
    }
  }

  // Web-accessible URL for the stored file
  let fileUrl = `/uploads/${relativeFilePath}`;

  // 2. Attempt upload to Supabase Storage bucket 'electricity-bills'
  try {
    const supabaseBucket = "electricity-bills";
    const supabasePath = `${plazaId}/${connectionId}/${monthSlug}/bill.${ext}`;

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(supabaseBucket)
      .upload(supabasePath, Buffer.from(buffer), {
        contentType: fileType,
        upsert: true,
      });

    if (!uploadErr && uploadData) {
      const { data: publicUrlData } = supabase.storage
        .from(supabaseBucket)
        .getPublicUrl(supabasePath);

      if (publicUrlData?.publicUrl) {
        fileUrl = publicUrlData.publicUrl;
      }
    }
  } catch {
    // Fallback gracefully to local disk URL
  }

  return {
    filePath: relativeFilePath,
    fileUrl,
    downloadName,
    fileType,
  };
}

/**
 * Reads the stored bill file from local disk if present
 */
export function getLocalBillFile(relativeFilePath: string): { buffer: Buffer; contentType: string } | null {
  const fsMod = getFs();
  const pathMod = getPath();

  if (!fsMod || !pathMod) return null;

  try {
    const normalizedPath = relativeFilePath.replace(/^uploads\//, "").replace(/^\//, "");
    const fullPath = pathMod.join(process.cwd(), "public", "uploads", normalizedPath);

    if (fsMod.existsSync(fullPath)) {
      const buffer = fsMod.readFileSync(fullPath);
      const isPdf = fullPath.endsWith(".pdf");
      return {
        buffer,
        contentType: isPdf ? "application/pdf" : "image/png",
      };
    }
  } catch (err) {
    console.error("Error reading local bill file:", err);
  }
  return null;
}
