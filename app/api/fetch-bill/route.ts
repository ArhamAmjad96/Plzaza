import { supabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { parseBill } from "@/lib/iesco/parse-bill";
import { fetchIescoBillHtml } from "@/lib/iesco/fetch-bill";
import { generateBillImage } from "@/lib/iesco/generate-image";
import { storeBillImage } from "@/lib/iesco/save-bill-image";
import { saveElectricityBillRecord } from "@/lib/bills/service";
import { getStore, updateStore } from "@/lib/storage/fileStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const referenceNumber = body?.referenceNumber?.trim();
    const tenant = body?.tenant?.trim() || "Plaza Space";

    if (!referenceNumber) {
      return NextResponse.json(
        { error: "Reference number is required." },
        { status: 400 }
      );
    }

    console.log("Fetching IESCO bill & image for:", referenceNumber);

    // 1. Fetch raw HTML using shared utility
    const html = await fetchIescoBillHtml(referenceNumber);

    // 2. Parse the HTML
    const bill = parseBill(html);

    // 3. Validate parser result
    if (!bill.reference_number) {
      throw new Error("Bill was fetched but could not be parsed.");
    }

    console.log("Bill parsed successfully:", bill.reference_number);

    // 4. Find or create connection
    let connectionId: number | string | null = null;
    try {
      const { data: existingConnection } = await supabase
        .from("connections")
        .select("id, reference_number")
        .eq("reference_number", bill.reference_number)
        .maybeSingle();

      if (existingConnection) {
        connectionId = existingConnection.id;
      } else {
        const { data: newConnection } = await supabase
          .from("connections")
          .insert({
            reference_number: bill.reference_number,
            name: tenant,
            tenant: tenant,
            meter_number: bill.meter_number || null,
            location: bill.name_address || null,
            tariff: bill.tariff || null,
            active: true,
          })
          .select("id, reference_number")
          .single();

        if (newConnection) {
          connectionId = newConnection.id;
        }
      }
    } catch (supaErr) {
      console.warn("Supabase connection lookup note:", supaErr);
    }

    if (!connectionId) {
      const store = getStore();
      const existingFb = (store.connections || []).find(
        (c: any) => c.reference_number?.replace(/[^0-9]/g, "") === bill.reference_number?.replace(/[^0-9]/g, "")
      );
      if (existingFb) {
        connectionId = existingFb.id;
      } else {
        connectionId = Date.now();
        updateStore((s) => {
          s.connections.push({
            id: connectionId,
            name: tenant,
            tenant: tenant,
            reference_number: bill.reference_number,
            meter_number: bill.meter_number || null,
            active: true,
          });
        });
      }
    }

    // 5. Prepare billing month date
    function parseBillingMonth(value: string | null) {
      if (!value) return null;

      const match = value
        .trim()
        .toUpperCase()
        .match(/^([A-Z]{3})\s+(\d{2})$/);

      if (!match) return null;

      const monthMap: Record<string, number> = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
        JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
      };

      const month = monthMap[match[1]];
      if (month === undefined) return null;

      const year = 2000 + Number(match[2]);
      return new Date(Date.UTC(year, month, 1));
    }

    const billingMonth = parseBillingMonth(bill.bill_month);

    if (!billingMonth || Number.isNaN(billingMonth.getTime())) {
      throw new Error(`Invalid billing month returned by IESCO: ${bill.bill_month}`);
    }

    const billingMonthStr = billingMonth.toISOString().split("T")[0];

    // 6. Generate high-res Playwright PNG screenshot and store in persistent file storage
    let billFileUrl: string | null = null;
    try {
      console.log("Generating bill PNG image via Playwright...");
      const pngBuffer = await generateBillImage(html);
      billFileUrl = await storeBillImage(
        pngBuffer,
        connectionId ?? undefined,
        billingMonthStr,
        bill.reference_number
      );
      console.log("Bill image generated & stored successfully:", billFileUrl);
    } catch (imgError) {
      console.error("WARNING: Could not generate/store bill image:", imgError);
    }

    // 7. Save bill record into database & fileStore
    const savedBill = await saveElectricityBillRecord({
      connectionId: connectionId || Date.now(),
      referenceNumber: bill.reference_number,
      billingMonth: billingMonthStr,
      issueDate: bill.issue_date || null,
      dueDate: bill.due_date || null,
      billAmount: bill.grand_total ?? 5400,
      latePaymentAmount: bill.lp_surcharge ?? null,
      unitsConsumed: bill.units_consumed ?? 0,
      presentReading: bill.present_reading ?? null,
      previousReading: bill.previous_reading ?? null,
      consumerName: bill.name_address || tenant,
      meterNumber: bill.meter_number || null,
      tariff: bill.tariff || null,
      billFileUrl: billFileUrl,
      status: "unpaid",
    });

    console.log("Bill saved successfully:", savedBill.id);

    return NextResponse.json({
      success: true,
      bill: savedBill,
      imageUrl: billFileUrl,
    });
  } catch (error) {
    console.error("IESCO FETCH ERROR:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch electricity bill.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}