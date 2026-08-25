import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import Link from "next/link";
import FetchBillButton from "@/components/connections/FetchBillButton";
import ConnectionBillGallery from "@/components/connections/ConnectionBillGallery";

export const dynamic = "force-dynamic";

export default async function ConnectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: connection, error: connectionError } = await supabase
    .from("connections")
    .select("*")
    .eq("id", id)
    .single();

  if (connectionError || !connection) {
    notFound();
  }

  const { data: bills, error: billsError } = await supabase
    .from("bills")
    .select("*")
    .eq("connection_id", id)
    .order("billing_month", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <a
            href="/connections"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Connections
          </a>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            {connection.name}
          </h1>

          <p className="mt-2 text-slate-600">
            Electricity connection details and bill history.
          </p>
        </div>

        {/* Connection Details */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Connection Details
            </h2>

            <Link
              href={`/connections/${connection.id}/edit`}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Edit Connection
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Reference Number</p>
              <p className="mt-1 font-medium text-slate-900">
                {connection.reference_number}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Meter Number</p>
              <p className="mt-1 font-medium text-slate-900">
                {connection.meter_number || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Tenant</p>
              <p className="mt-1 font-medium text-slate-900">
                {connection.tenant || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Location</p>
              <p className="mt-1 font-medium text-slate-900">
                {connection.location || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Tariff</p>
              <p className="mt-1 font-medium text-slate-900">
                {connection.tariff || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Status</p>
              <p className="mt-1 font-medium text-slate-900">
                {connection.active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <FetchBillButton referenceNumber={connection.reference_number} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              Reference {connection.reference_number}
            </span>
          </div>
        </section>

        {/* Bills History Table */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Electricity Bills History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recorded billing metrics for this connection.
          </p>

          {billsError ? (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              Failed to load bills: {billsError.message}
            </div>
          ) : bills && bills.length > 0 ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 font-semibold">Bill Month</th>
                    <th className="px-4 py-3 font-semibold">Units</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Due Date</th>
                    <th className="px-4 py-3 font-semibold">Late Payment</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Bill Document</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {bills.map((bill) => {
                    const imageUrl = bill.bill_image_url || bill.pdf_url;
                    return (
                      <tr
                        key={bill.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-4 font-medium">
                          <Link
                            href={`/bills/${bill.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {bill.billing_month}
                          </Link>
                        </td>

                        <td className="px-4 py-4">
                          {bill.units_consumed ?? "-"}
                        </td>

                        <td className="px-4 py-4 font-medium text-slate-900">
                          Rs. {bill.bill_amount?.toLocaleString("en-IN") ?? 0}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {bill.due_date || "-"}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          Rs. {bill.late_payment_amount?.toLocaleString("en-IN") ?? 0}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              bill.status === "paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {bill.status}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {imageUrl ? (
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                            >
                              📷 Original Bill
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">No Image</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <Link
                            href={`/bills/${bill.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">
              No bills recorded for this connection.
            </p>
          )}
        </section>

        {/* Original Bill Documents Gallery */}
        {bills && bills.length > 0 && <ConnectionBillGallery bills={bills} />}
      </div>
    </main>
  );
}