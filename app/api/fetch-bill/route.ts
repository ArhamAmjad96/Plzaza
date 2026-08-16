import { supabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { parseBill } from "@/lib/iesco/parse-bill";
import { fetchIescoBillHtml } from "@/lib/iesco/fetch-bill";
import { generateBillImage } from "@/lib/iesco/generate-image";
import { storeBillImage } from "@/lib/iesco/save-bill-image";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const referenceNumber = body?.referenceNumber?.trim();
    const tenant = body?.tenant?.trim();

    if (!referenceNumber) {
      return NextResponse.json(
        { error: "Reference number is required." },
        { status: 400 }
      );
    }
    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant name is required." },
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
    const { data: existingConnection, error: connectionLookupError } =
      await supabase
        .from("connections")
        .select("id, reference_number")
        .eq("reference_number", bill.reference_number)
        .maybeSingle();

    if (connectionLookupError) {
      console.error("SUPABASE CONNECTION LOOKUP ERROR:", connectionLookupError);
      throw new Error("Could not check the electricity connection in the database.");
    }

    let connection = existingConnection;

    if (!connection) {
      const { data: newConnection, error: createConnectionError } =
        await supabase
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

      if (createConnectionError) {
        console.error("SUPABASE CONNECTION CREATE ERROR:", createConnectionError);
        throw new Error("Bill was fetched, but the electricity connection could not be created.");
      }

      connection = newConnection;
      console.log("Connection created:", connection.id);
    } else {
      console.log("Connection found:", connection.id);
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

    // 6. Generate Playwright PNG Screenshot of the original bill
    let billImageUrl: string | null = null;
    try {
      console.log("Generating bill PNG image via Playwright...");
      const pngBuffer = await generateBillImage(html);
      billImageUrl = await storeBillImage(pngBuffer, connection.id, billingMonthStr);
      console.log("Bill image generated and stored successfully.");
    } catch (imgError) {
      console.error("WARNING: Could not generate/store bill image:", imgError);
      // Fallback: Proceed so bill data record saving is not blocked
    }

    // 7. Save bill record including image URL in Supabase
    const billRecord = {
      connection_id: connection.id,
      billing_month: billingMonthStr,
      issue_date: bill.issue_date || null,
      due_date: bill.due_date || null,
      meter_number: bill.meter_number || null,
      previous_reading: bill.previous_reading ?? null,
      current_reading: bill.present_reading ?? null,
      units_consumed: bill.units_consumed ?? null,
      bill_amount: bill.grand_total ?? null,
      arrears: bill.arrears ?? null,
      late_payment_amount: bill.lp_surcharge ?? null,
      bill_image_url: billImageUrl,
      status: "unpaid",
    };

    const { data: savedBill, error: billError } = await supabase
      .from("bills")
      .upsert(billRecord, {
        onConflict: "connection_id,billing_month",
      })
      .select()
      .single();

    if (billError) {
      console.error("SUPABASE BILL ERROR:", billError);
      throw new Error("Bill was fetched but could not be saved to the database.");
    }

    console.log("Bill and image saved successfully:", savedBill.id);

    return NextResponse.json({
      success: true,
      bill: savedBill,
      imageUrl: billImageUrl,
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