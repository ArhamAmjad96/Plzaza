import { NextResponse } from "next/server";
import { getBillById } from "@/lib/bills/service";
import { getLocalBillFile } from "@/lib/bills/bill-storage";
import { fetchIescoBillHtml } from "@/lib/iesco/fetch-bill";
import { generateBillImage } from "@/lib/iesco/generate-image";
import { saveBillFile } from "@/lib/bills/bill-storage";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const bill = await getBillById(id);

    const { searchParams } = new URL(request.url);
    const refParam = searchParams.get("ref") || bill?.reference_number;
    const monthParam = searchParams.get("month") || bill?.billing_month || new Date().toISOString().slice(0, 7);

    const referenceNumber = refParam?.trim() || "";
    const billingMonth = monthParam || "current";

    // 1. If bill has a local file path, stream it directly
    if (bill?.bill_file_path) {
      const localFile = getLocalBillFile(bill.bill_file_path);
      if (localFile) {
        return new Response(new Uint8Array(localFile.buffer), {
          status: 200,
          headers: {
            "Content-Type": localFile.contentType,
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }

    // 2. If bill has a web URL, check if it's local uploads URL
    if (bill?.bill_file_url && bill.bill_file_url.startsWith("/uploads/")) {
      const localFile = getLocalBillFile(bill.bill_file_url);
      if (localFile) {
        return new Response(new Uint8Array(localFile.buffer), {
          status: 200,
          headers: {
            "Content-Type": localFile.contentType,
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }

    // 3. Fallback: generate high-res bill image on the fly and persist it
    if (referenceNumber) {
      const html = await fetchIescoBillHtml(referenceNumber);
      const pngBuffer = await generateBillImage(html);

      // Persist for future instant views
      if (bill) {
        await saveBillFile({
          buffer: pngBuffer,
          connectionId: bill.connection_id,
          referenceNumber,
          billingMonth,
        });
      }

      return new Response(new Uint8Array(pngBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return NextResponse.json({ error: "Bill document not found." }, { status: 404 });
  } catch (err) {
    console.error("BILL PREVIEW ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load bill image." },
      { status: 500 }
    );
  }
}
