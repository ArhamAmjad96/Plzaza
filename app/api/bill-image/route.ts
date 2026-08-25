import { NextResponse } from "next/server";
import { fetchIescoBillHtml } from "@/lib/iesco/fetch-bill";
import { generateBillImage } from "@/lib/iesco/generate-image";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const referenceNumber = searchParams.get("ref")?.trim();

  if (!referenceNumber) {
    return NextResponse.json({ error: "Reference number is required." }, { status: 400 });
  }

  return generateAndReturnImage(referenceNumber);
}

export async function POST(request: Request) {
  try {
    let body: { referenceNumber?: string } = {};

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const referenceNumber = body?.referenceNumber?.trim();

    if (!referenceNumber) {
      return NextResponse.json(
        { error: "Reference number is required." },
        { status: 400 }
      );
    }

    return generateAndReturnImage(referenceNumber);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate bill image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function generateAndReturnImage(referenceNumber: string) {
  try {
    const sanitizedRef = referenceNumber.replace(/[\s-]/g, "");
    if (sanitizedRef.length < 10) {
      return NextResponse.json(
        { error: "Invalid IESCO reference number format." },
        { status: 400 }
      );
    }

    console.log("Generating bill image for reference number:", sanitizedRef);

    // 1. Fetch original PITC bill HTML
    const html = await fetchIescoBillHtml(sanitizedRef);

    // 2. Render HTML to high-quality PNG
    const pngBuffer = await generateBillImage(html);

    // 3. Return PNG response stream using Uint8Array
    return new Response(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("BILL IMAGE GENERATION ERROR:", error);
    const message = error instanceof Error ? error.message : "Failed to generate bill image.";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
