import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import FetchBillForm from "@/components/bills/FetchBillForm";

export default async function Home() {
  const { count: totalShops } = await supabase
    .from("connections")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  const { data: bills } = await supabase
  .from("bills")
  .select(`
    *,
    connections (
      reference_number
    )
  `)
  .order("billing_month", { ascending: false });

  const billsThisMonth = bills?.length ?? 0;

  const totalElectricity =
    bills?.reduce(
      (total, bill) => total + Number(bill.bill_amount || 0),
      0
    ) ?? 0;

  const pendingPayments =
    bills
      ?.filter((bill) => bill.status === "unpaid")
      .reduce(
        (total, bill) => total + Number(bill.bill_amount || 0),
        0
      ) ?? 0;

  const unpaidCount = bills?.filter((bill) => bill.status === "unpaid").length ?? 0;
  const latestBills = bills?.slice(0, 10) ?? [];

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-600">Dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Plaza Electricity Manager</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Monitor bills, manage connections, and keep tenant details up to date from one polished control panel.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/connections"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                View Connections
              </Link>
              <Link
                href="/tenants"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Manage Tenants
              </Link>
            </div>
          </div>
        </section>

        <FetchBillForm />

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Active Connections</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{totalShops ?? 0}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Bills This Month</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{billsThisMonth}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Electricity</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">Rs. {totalElectricity.toLocaleString("en-IN")}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Pending Payments</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">Rs. {pendingPayments.toLocaleString("en-IN")}</p>
            <p className="mt-2 text-sm text-slate-500">{unpaidCount} unpaid bill{unpaidCount === 1 ? "" : "s"}</p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Recent Bills</h2>
              <p className="mt-1 text-sm text-slate-500">The latest bills fetched from IESCO.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              Showing {latestBills.length} of {billsThisMonth}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700">
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Bill Month</th>
                  <th className="px-4 py-3 font-semibold">Units</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Due Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {latestBills.length > 0 ? (
                  latestBills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 font-medium text-blue-600">
                        <Link href={`/connections/${bill.connection_id}`} className="hover:underline">
                          {bill.connections?.reference_number || "-"}
                        </Link>
                      </td>

                      <td className="px-4 py-4 text-slate-700">
                        <Link href={`/bills/${bill.id}`} className="text-slate-900 hover:underline">
                          {bill.billing_month}
                        </Link>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {bill.units_consumed ?? "-"}
                      </td>

                      <td className="px-4 py-4 text-slate-900">
                        Rs. {Number(bill.bill_amount || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {bill.due_date || "-"}
                      </td>

                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          bill.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      No bills recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}