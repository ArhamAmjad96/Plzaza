"use client";

import { useState, useEffect } from "react";
import { formatPKR } from "@/lib/utils/format";
import {
  Zap,
  Printer,
  X,
  Download,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface ViewBillModalProps {
  billData: {
    id?: number | string;
    referenceNumber: string;
    meterNumber?: string;
    consumerName?: string;
    billingMonth?: string;
    issueDate?: string;
    dueDate?: string;
    unitsConsumed?: number;
    billAmount: number;
    latePaymentAmount?: number;
    billStatus?: string;
    billImageUrl?: string | null;
    billFilePath?: string | null;
  };
  onClose: () => void;
}

export default function ViewBillModal({ billData, onClose }: ViewBillModalProps) {
  const [fetchingImage, setFetchingImage] = useState(false);
  const [liveImage, setLiveImage] = useState<string | null>(billData.billImageUrl || null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const totalPayable = billData.billAmount || 5400;
  const lpSurcharge = billData.latePaymentAmount || Math.round(totalPayable * 0.08);
  const totalAfterDue = totalPayable + lpSurcharge;
  const units = billData.unitsConsumed || 165;
  const energyCharges = Math.round(totalPayable * 0.78);
  const taxesAndDuties = totalPayable - energyCharges;

  const downloadUrl = `/api/bills/${billData.id || "current"}/download?ref=${encodeURIComponent(
    billData.referenceNumber
  )}&month=${encodeURIComponent(billData.billingMonth || "")}`;

  // Keyboard Escape listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // If no image is provided upfront, automatically attempt to resolve or fetch
  useEffect(() => {
    if (!liveImage && billData.referenceNumber) {
      handleFetchOfficialImage();
    }
  }, [billData.referenceNumber]);

  async function handleFetchOfficialImage() {
    setFetchingImage(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/bill-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceNumber: billData.referenceNumber }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Could not fetch image from IESCO server.");
      }

      const blob = await res.blob();
      const imgUrl = URL.createObjectURL(blob);
      setLiveImage(imgUrl);
    } catch (err: any) {
      setFetchError(err.message || "Failed to capture live bill image.");
    } finally {
      setFetchingImage(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleZoomIn() {
    setZoomLevel((prev) => Math.min(prev + 25, 200));
  }

  function handleZoomOut() {
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  }

  function handleResetZoom() {
    setZoomLevel(100);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-[#17211D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Top Header ─── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#CBD4BC]/60 bg-[#FAF6F0] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#FF704D]">
                IESCO OFFICIAL UTILITY BILL
              </span>
              <Zap size={13} className="text-[#FF704D]" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#17211D] mt-0.5">
              {billData.consumerName || "Commercial Space Meter"}
            </h3>
            <p className="text-xs font-mono text-[#58655E]">
              14-Digit Reference: <strong className="text-[#17211D]">{billData.referenceNumber}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] flex items-center justify-center transition cursor-pointer"
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* ─── Quick Metric Tiles ─── */}
        <div className="px-6 py-3 bg-[#E8EDD9]/60 border-b border-[#CBD4BC]/40 grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs shrink-0">
          <div>
            <span className="text-[10px] uppercase font-sans text-[#58655E] block">Billing Month</span>
            <p className="font-bold text-[#17211D]">{billData.billingMonth || "August 2026"}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans text-[#58655E] block">Units Consumed</span>
            <p className="font-bold text-[#17211D]">{units} kWh</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans text-[#58655E] block">Payable Amount</span>
            <p className="font-bold text-[#FF704D]">{formatPKR(totalPayable)}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans text-[#58655E] block">Due Date</span>
            <p className="font-bold text-[#8E3E33]">{billData.dueDate || "20 Aug 2026"}</p>
          </div>
        </div>

        {/* ─── Document Zoom Toolbar & Status ─── */}
        <div className="px-6 py-2.5 bg-[#FAF6F0] border-b border-[#CBD4BC]/60 flex items-center justify-between gap-3 text-xs shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold text-[#58655E]">
              Scanned Official Document
            </span>
            {liveImage && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#2D5A27] bg-[#E8EDD9] border border-[#CBD4BC] px-2 py-0.5 rounded-md">
                <CheckCircle2 size={10} />
                <span>Verified Copy</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Zoom Controls */}
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 50}
              className="p-1.5 rounded-lg border border-[#CBD4BC] bg-[#FAF6F0] text-[#58655E] hover:text-[#17211D] hover:bg-[#E8EDD9] disabled:opacity-40 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[11px] font-mono text-[#58655E] px-1 min-w-[40px] text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
              className="p-1.5 rounded-lg border border-[#CBD4BC] bg-[#FAF6F0] text-[#58655E] hover:text-[#17211D] hover:bg-[#E8EDD9] disabled:opacity-40 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg border border-[#CBD4BC] bg-[#FAF6F0] text-[#58655E] hover:text-[#17211D] hover:bg-[#E8EDD9] transition cursor-pointer"
              title="Fit to Screen (100%)"
            >
              <Maximize2 size={13} />
            </button>

            <div className="h-4 w-px bg-[#CBD4BC] mx-1" />

            <button
              type="button"
              onClick={handleFetchOfficialImage}
              disabled={fetchingImage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-medium text-[#17211D] hover:bg-[#E8EDD9] transition disabled:opacity-50 cursor-pointer"
              title="Re-fetch from IESCO server"
            >
              <RotateCw size={11} className={fetchingImage ? "animate-spin text-[#FF704D]" : ""} />
              <span>{fetchingImage ? "Capturing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* ─── Main Document Viewer Area ─── */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#2B3530]/10 flex items-center justify-center min-h-[360px]">
          {liveImage ? (
            <div
              className="transition-all duration-150 ease-out origin-top shadow-xl rounded-xl bg-white border border-[#CBD4BC] overflow-hidden"
              style={{
                width: `${zoomLevel}%`,
                maxWidth: zoomLevel === 100 ? "100%" : `${zoomLevel}%`,
              }}
            >
              <img
                src={liveImage}
                alt={`Official IESCO Bill - ${billData.referenceNumber}`}
                className="w-full h-auto block select-none"
              />
            </div>
          ) : (
            <div className="p-12 rounded-3xl border border-dashed border-[#CBD4BC] bg-[#FAF6F0] text-center space-y-3 max-w-md shadow-sm">
              <Zap size={32} className="mx-auto text-[#FF704D] animate-pulse" />
              <h4 className="text-sm font-bold text-[#17211D]">
                {fetchingImage ? "Capturing High-Resolution Bill..." : "Bill Preview Ready"}
              </h4>
              <p className="text-xs text-[#58655E]">
                {fetchingImage
                  ? "Rendering official document directly from IESCO portal..."
                  : "Click 'Refresh' or 'Download Bill' to fetch and preserve the document."}
              </p>
              {fetchingImage && (
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#FF704D] pt-2">
                  <RotateCw size={14} className="animate-spin" />
                  <span>Loading bill layout...</span>
                </div>
              )}
            </div>
          )}

          {fetchError && (
            <div className="p-4 rounded-xl bg-[#FAECE9] border border-[#EAC4BE] text-xs text-[#8E3E33] font-mono mt-3">
              {fetchError}
            </div>
          )}
        </div>

        {/* ─── Footer Controls ─── */}
        <div className="px-6 py-4 bg-[#FAF6F0] border-t border-[#CBD4BC]/60 flex items-center justify-between shrink-0">
          <div className="text-xs text-[#58655E] font-mono hidden sm:block">
            Payable After Due Date: <strong className="text-[#8E3E33]">{formatPKR(totalAfterDue)}</strong>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-medium text-[#17211D] hover:bg-[#E8EDD9] transition cursor-pointer"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>

            <a
              href={downloadUrl}
              download
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition shadow-xs cursor-pointer"
            >
              <Download size={13} />
              <span>Download Bill</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
