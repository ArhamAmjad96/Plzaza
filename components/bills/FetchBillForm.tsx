"use client";

import { useState } from "react";

type MessageType = "success" | "error";

export default function FetchBillForm() {
  const [tenant, setTenant] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("success");

  const [billImageUrl, setBillImageUrl] = useState<string | null>(null);
  const [activeReference, setActiveReference] = useState<string>("");
  const [showModal, setShowModal] = useState(false);

  // Standard fetch & save to Supabase
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedTenant = tenant.trim();
    const trimmedReferenceNumber = referenceNumber.trim();

    if (!trimmedTenant) {
      setMessageType("error");
      setMessage("Please enter the tenant name.");
      return;
    }

    if (!trimmedReferenceNumber) {
      setMessageType("error");
      setMessage("Please enter the reference number.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/fetch-bill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant: trimmedTenant,
          referenceNumber: trimmedReferenceNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch bill.");
      }

      setMessageType("success");
      setMessage("Bill fetched and saved successfully. Reloading page...");
      setTenant("");
      setReferenceNumber("");

      window.setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  // Fetch original PITC bill image
  async function handleFetchImage() {
    const trimmedReferenceNumber = referenceNumber.trim();

    if (!trimmedReferenceNumber) {
      setMessageType("error");
      setMessage("Please enter the reference number to view the bill image.");
      return;
    }

    try {
      setImageLoading(true);
      setMessage("");
      setBillImageUrl(null);

      const response = await fetch("/api/bill-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referenceNumber: trimmedReferenceNumber,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate bill image.";
        try {
          const errJson = await response.json();
          if (errJson.error) errorMessage = errJson.error;
        } catch {
          // Response was not JSON
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setBillImageUrl(url);
      setActiveReference(trimmedReferenceNumber);
      setMessageType("success");
      setMessage("Original IESCO bill image captured successfully.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Failed to load bill image."
      );
    } finally {
      setImageLoading(false);
    }
  }

  // Trigger print window for bill image
  function handlePrint() {
    if (!billImageUrl) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the bill image.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>IESCO Bill - ${activeReference}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #fff;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            @media print {
              body { padding: 0; }
              img { max-width: 100%; width: 100%; }
            }
          </style>
        </head>
        <body>
          <img src="${billImageUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Trigger PNG download
  function handleDownload() {
    if (!billImageUrl) return;

    const a = document.createElement("a");
    a.href = billImageUrl;
    a.download = `IESCO_Bill_${activeReference || "image"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Fetch Electricity Bill
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter tenant details and IESCO reference number to save data or view the original bill image.
          </p>
        </div>
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          Real-time lookup
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto_auto]">
        <label htmlFor="tenant" className="sr-only">
          Tenant name
        </label>
        <input
          id="tenant"
          name="tenant"
          type="text"
          autoComplete="name"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          placeholder="Tenant name"
          className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <label htmlFor="reference-number" className="sr-only">
          Reference number
        </label>
        <input
          id="reference-number"
          name="referenceNumber"
          type="text"
          autoComplete="off"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          placeholder="Reference number"
          className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="submit"
          disabled={loading || imageLoading}
          className="h-12 rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Fetch & Save"}
        </button>

        <button
          type="button"
          onClick={handleFetchImage}
          disabled={loading || imageLoading}
          className="h-12 rounded-xl border border-slate-300 bg-slate-100 px-5 font-semibold text-slate-800 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {imageLoading ? "Rendering..." : "View Bill Image"}
        </button>
      </form>

      {message && (
        <div
          role="status"
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            messageType === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Captured Original Bill Image Display */}
      {billImageUrl && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Original IESCO Bill
              </h3>
              <p className="text-xs text-slate-500">
                Reference: <span className="font-mono font-medium text-slate-700">{activeReference}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Fullscreen
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Bill
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 flex justify-center">
            <img
              src={billImageUrl}
              alt="Original IESCO Electricity Bill"
              className="max-w-full h-auto object-contain rounded-lg shadow-sm border border-slate-100"
              style={{ maxHeight: "800px" }}
            />
          </div>
        </div>
      )}

      {/* Modal Lightbox for Fullscreen Viewing */}
      {showModal && billImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-h-[95vh] max-w-[95vw] overflow-auto rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 right-0 flex items-center justify-between bg-white pb-3 border-b border-slate-100">
              <span className="font-semibold text-slate-800">
                IESCO Bill - {activeReference}
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4 flex justify-center">
              <img
                src={billImageUrl}
                alt="IESCO Electricity Bill Full View"
                className="max-w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}