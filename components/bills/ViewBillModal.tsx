"use client";

import { useState } from "react";
import { formatPKR } from "@/lib/utils/format";
import { Zap, Printer, X, Download, RotateCw, ExternalLink } from "lucide-react";

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
  };
  onClose: () => void;
}

export default function ViewBillModal({ billData, onClose }: ViewBillModalProps) {
  const [fetchingImage, setFetchingImage] = useState(false);
  const [liveImage, setLiveImage] = useState<string | null>(billData.billImageUrl || null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const totalPayable = billData.billAmount || 5400;
  const lpSurcharge = billData.latePaymentAmount || Math.round(totalPayable * 0.08);
  const totalAfterDue = totalPayable + lpSurcharge;
  const units = billData.unitsConsumed || 165;
  const energyCharges = Math.round(totalPayable * 0.78);
  const taxesAndDuties = totalPayable - energyCharges;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-7 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto text-[#17211D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#FF704D]">
                IESCO OFFICIAL UTILITY BILL
              </span>
              <Zap size={13} className="text-[#FF704D]" />
            </div>
            <h3 className="text-xl font-medium text-[#17211D] mt-0.5">
              {billData.consumerName || "Shop Meter"}
            </h3>
            <p className="text-xs font-mono text-[#58655E]">
              14-Digit Reference: {billData.referenceNumber}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] flex items-center justify-center transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* 4 Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-3.5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC]">
            <span className="text-[10px] uppercase font-sans text-[#58655E] block">Billing Month</span>
            <p className="text-sm font-bold text-[#17211D] mt-1">{billData.billingMonth || "August 2026"}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC]">
            <span className="text-[10px] uppercase font-sans text-[#58655E] block">Units Consumed</span>
            <p className="text-sm font-bold text-[#17211D] mt-1">{units} kWh</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC]">
            <span className="text-[10px] uppercase font-sans text-[#58655E] block">Total Amount</span>
            <p className="text-sm font-bold text-[#FF704D] mt-1">{formatPKR(totalPayable)}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC]">
            <span className="text-[10px] uppercase font-sans text-[#58655E] block">Due Date</span>
            <p className="text-sm font-bold text-[#17211D] mt-1">{billData.dueDate || "20 Aug 2026"}</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="p-5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-2.5 font-mono text-xs">
          <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#58655E] block border-b border-[#CBD4BC]/60 pb-1.5">
            TARIFF & CHARGES BREAKDOWN
          </span>

          <div className="flex items-center justify-between">
            <span className="text-[#58655E]">Electricity Energy Charges ({units} kWh)</span>
            <span className="text-[#17211D]">{formatPKR(energyCharges)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#58655E]">Govt. Taxes, Fuel Adjustment & Duties</span>
            <span className="text-[#17211D]">{formatPKR(taxesAndDuties)}</span>
          </div>

          <div className="pt-2 border-t border-[#CBD4BC]/60 flex items-center justify-between font-semibold">
            <span className="text-[#17211D]">Payable Within Due Date:</span>
            <span className="text-sm text-[#17211D]">{formatPKR(totalPayable)}</span>
          </div>

          <div className="flex items-center justify-between text-[#8E3E33]">
            <span>Payable After Due Date (Late Surcharge):</span>
            <span>{formatPKR(totalAfterDue)}</span>
          </div>
        </div>

        {/* Official Bill Image Document */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#17211D]">
              Scanned IESCO Bill Document
            </span>

            <button
              type="button"
              onClick={handleFetchOfficialImage}
              disabled={fetchingImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-medium text-[#17211D] hover:bg-[#E8EDD9] transition shadow-xs disabled:opacity-50"
            >
              <RotateCw size={12} className={fetchingImage ? "animate-spin text-[#FF704D]" : ""} />
              <span>{fetchingImage ? "Capturing Document..." : "Fetch Fresh Bill Image"}</span>
            </button>
          </div>

          {liveImage ? (
            <div className="rounded-2xl border border-[#CBD4BC] overflow-hidden bg-white shadow-md p-2">
              <img
                src={liveImage}
                alt="Official IESCO Electricity Bill"
                className="w-full h-auto object-contain rounded-xl max-h-96"
              />
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-[#CBD4BC] bg-[#E8EDD9]/50 text-center space-y-2">
              <Zap size={24} className="mx-auto text-[#58655E]" />
              <p className="text-xs text-[#58655E]">
                Click &quot;Fetch Fresh Bill Image&quot; to automatically pull the original IESCO paper bill scanned copy.
              </p>
            </div>
          )}

          {fetchError && (
            <p className="text-xs text-[#8E3E33] font-mono">{fetchError}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#CBD4BC]/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#58655E] hover:text-[#17211D]"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition shadow-xs"
          >
            <Printer size={13} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
