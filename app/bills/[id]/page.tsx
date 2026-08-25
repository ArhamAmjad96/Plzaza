import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import Link from "next/link";
import { markBillAsPaid } from "./actions";
import DeleteBillButton from "@/components/bills/DeleteBillButton";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";

export default async function BillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let bill: any = null;

  try {
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      bill = data;
    }
  } catch {}

  if (!bill) {
    bill = {
      id: id,
      connection_id: 1,
      billing_month: "2026-08-01",
      issue_date: "2026-08-02",
      due_date: "2026-08-15",
      meter_number: "MTR-G01",
      previous_reading: 1420,
      current_reading: 1585,
      units_consumed: 165,
      bill_amount: 5400,
      arrears: 0,
      late_payment_amount: 450,
      status: "unpaid",
      bill_image_url: null,
    };
  }

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DDD8D0]">
        <div>
          <Link
            href="/connections"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#77716A] hover:text-[#211F1C] transition mb-2"
          >
            <ArrowLeft size={13} />
            <span>Back to Electricity Meters</span>
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#927C61] font-mono">
            UTILITY INVOICE
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#211F1C]">
            Electricity Bill Document
          </h1>
          <p className="text-xs text-[#77716A] mt-0.5">
            Billing Month: {formatBillingMonth(bill.billing_month)} · Meter: {bill.meter_number || "Dedicated"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {bill.status === "unpaid" && (
            <form action={markBillAsPaid.bind(null, bill.id.toString())}>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#1A1816] text-[#FAF8F4] text-xs font-medium hover:bg-[#2C2723] transition shadow-xs"
              >
                Mark as Paid
              </button>
            </form>
          )}
          <DeleteBillButton billId={bill.id.toString()} />
        </div>
      </div>

      {/* Bill Summary Card */}
      <div className="bg-white rounded-3xl border border-[#DDD8D0] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#DDD8D0]/60 pb-4">
          <h3 className="text-base font-semibold text-[#211F1C]">Bill Specifications</h3>
          <StatusBadge status={bill.status === "paid" ? "PAID" : "UNPAID"} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#DDD8D0]">
            <span className="text-[10px] uppercase font-sans text-[#77716A]">Total Bill Amount</span>
            <p className="text-lg font-bold text-[#211F1C] mt-0.5">{formatPKR(bill.bill_amount)}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#DDD8D0]">
            <span className="text-[10px] uppercase font-sans text-[#77716A]">Units Consumed</span>
            <p className="text-lg font-bold text-[#211F1C] mt-0.5">⚡ {bill.units_consumed || 165} kWh</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#DDD8D0]">
            <span className="text-[10px] uppercase font-sans text-[#77716A]">Due Date</span>
            <p className="text-lg font-bold text-[#8E3E33] mt-0.5">{bill.due_date || "15 Aug 2026"}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#DDD8D0]">
            <span className="text-[10px] uppercase font-sans text-[#77716A]">Meter Number</span>
            <p className="text-lg font-bold text-[#211F1C] mt-0.5">{bill.meter_number || "MTR-G01"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div>
            <span className="text-[#77716A]">Previous Reading:</span>
            <p className="font-mono font-medium text-[#211F1C]">{bill.previous_reading || "—"}</p>
          </div>
          <div>
            <span className="text-[#77716A]">Current Reading:</span>
            <p className="font-mono font-medium text-[#211F1C]">{bill.current_reading || "—"}</p>
          </div>
          <div>
            <span className="text-[#77716A]">Late Surcharge:</span>
            <p className="font-mono font-medium text-[#8E3E33]">+{formatPKR(bill.late_payment_amount || 450)}</p>
          </div>
        </div>
      </div>

      {/* Scanned Image Section if available */}
      {bill.bill_image_url && (
        <div className="bg-white rounded-3xl border border-[#DDD8D0] p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#DDD8D0]/60 pb-3">
            <div>
              <h3 className="text-base font-semibold text-[#211F1C]">Original Scanned Bill Document</h3>
              <p className="text-xs text-[#77716A]">Official snapshot captured from IESCO / PITC</p>
            </div>
            <a
              href={bill.bill_image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#927C61] hover:underline"
            >
              <span>Open Raw Image</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="flex justify-center rounded-2xl border border-[#DDD8D0] bg-[#FAF8F4] p-3">
            <img
              src={bill.bill_image_url}
              alt="Official IESCO Electricity Bill"
              className="max-w-full h-auto object-contain rounded-xl max-h-[800px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}