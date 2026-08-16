import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import Link from "next/link";
import { markBillAsPaid } from "./actions";
import DeleteBillButton from "@/components/bills/DeleteBillButton";

export default async function BillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: bill, error } = await supabase
    .from("bills")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !bill) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={`/connections/${bill.connection_id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to Connection
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              Electricity Bill
            </h1>
            <p className="mt-2 text-slate-600">
              Detailed information for this electricity bill.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {bill.status === "unpaid" && (
              <form action={markBillAsPaid.bind(null, bill.id.toString())}>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Mark as Paid
                </button>
              </form>
            )}
            <DeleteBillButton billId={bill.id.toString()} />
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Bill Details
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Bill Month</p>
              <p className="mt-1 font-medium">{bill.billing_month}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Issue Date</p>
              <p className="mt-1 font-medium">{bill.issue_date || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Due Date</p>
              <p className="mt-1 font-medium">{bill.due_date || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Meter Number</p>
              <p className="mt-1 font-medium">{bill.meter_number || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Previous Reading</p>
              <p className="mt-1 font-medium">
                {bill.previous_reading ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Current Reading</p>
              <p className="mt-1 font-medium">
                {bill.current_reading ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Units Consumed</p>
              <p className="mt-1 font-medium">
                {bill.units_consumed ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Bill Amount</p>
              <p className="mt-1 font-medium">
                Rs. {bill.bill_amount ?? 0}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Arrears</p>
              <p className="mt-1 font-medium">
                Rs. {bill.arrears ?? 0}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Late Payment Amount
              </p>
              <p className="mt-1 font-medium">
                Rs. {bill.late_payment_amount ?? 0}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Status</p>
              <p className="mt-1 font-medium">{bill.status}</p>
            </div>
          </div>
        </section>

        {/* Display Saved Original Bill Image if available */}
        {bill.bill_image_url && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Original Bill Document
                </h2>
                <p className="text-sm text-slate-500">
                  Stored PNG copy captured from IESCO / PITC.
                </p>
              </div>
              <a
                href={bill.bill_image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Open Original Image
              </a>
            </div>

            <div className="flex justify-center overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
              <img
                src={bill.bill_image_url}
                alt="Stored IESCO Electricity Bill"
                className="max-w-full h-auto object-contain rounded-lg shadow-sm"
                style={{ maxHeight: "900px" }}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}