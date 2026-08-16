"use client";

import { useState } from "react";

interface BillItem {
  id: number | string;
  billing_month: string;
  bill_amount: number | null;
  bill_image_url?: string | null;
  pdf_url?: string | null;
  status: string;
}

export default function ConnectionBillGallery({ bills }: { bills: BillItem[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");

  // Filter bills that have saved original bill images
  const billsWithImages = bills.filter(
    (b) => Boolean(b.bill_image_url || b.pdf_url)
  );

  if (billsWithImages.length === 0) {
    return null;
  }

  function openLightbox(url: string, month: string) {
    setSelectedImage(url);
    setSelectedTitle(`IESCO Bill - ${month}`);
  }

  function handlePrint(url: string, month: string) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the bill document.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>IESCO Bill - ${month}</title>
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
          <img src="${url}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function handleDownload(url: string, month: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `IESCO_Bill_${month}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Original Bill Documents
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Saved original PNG bill copies for this connection.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
          {billsWithImages.length} Saved Document{billsWithImages.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {billsWithImages.map((bill) => {
          const imageUrl = bill.bill_image_url || bill.pdf_url!;
          return (
            <div
              key={bill.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:border-slate-300 hover:shadow-md"
            >
              <div
                className="relative h-56 cursor-pointer overflow-hidden bg-slate-200 flex justify-center items-center"
                onClick={() => openLightbox(imageUrl, bill.billing_month)}
              >
                <img
                  src={imageUrl}
                  alt={`IESCO Bill ${bill.billing_month}`}
                  className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 transition duration-300 group-hover:opacity-100 flex items-center justify-center">
                  <span className="rounded-xl bg-white/90 px-4 py-2 text-xs font-semibold text-slate-900 backdrop-blur-sm shadow-sm">
                    🔍 Click to View
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {bill.billing_month}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rs. {bill.bill_amount?.toLocaleString("en-IN") || 0}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      bill.status === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {bill.status}
                  </span>
                </div>

                <div className="mt-4 flex gap-2 pt-3 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => openLightbox(imageUrl, bill.billing_month)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrint(imageUrl, bill.billing_month)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Print
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(imageUrl, bill.billing_month)}
                    className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-h-[95vh] max-w-[95vw] overflow-auto rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 right-0 flex items-center justify-between bg-white pb-3 border-b border-slate-100">
              <span className="font-semibold text-slate-800">
                {selectedTitle}
              </span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4 flex justify-center">
              <img
                src={selectedImage}
                alt={selectedTitle}
                className="max-w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
