import { supabase } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ConnectionsPage() {
  const { data: connections, error } = await supabase
    .from("connections")
    .select("*")
    .order("id", { ascending: true });

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Connections
          </h1>

          <p className="mt-2 text-slate-600">
            Manage electricity connections.
          </p>
        </div>

        {/* Connections */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Electricity Connections
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                All registered electricity connections.
              </p>
            </div>

            <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
              {connections?.length ?? 0} Connections
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              Failed to load connections: {error.message}
            </div>
          )}

          {/* Table */}
          {!error && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 font-semibold text-slate-700">
                      #
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Connection
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Reference Number
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Meter Number
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Tenant
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Location
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {connections && connections.length > 0 ? (
                    connections.map((connection) => (
                      <tr
                        key={connection.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-4 text-slate-500">
                          {connection.id}
                        </td>

                        <td className="px-4 py-4 font-medium text-slate-900">
                          <Link
                            href={`/connections/${connection.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {connection.name}
                          </Link>
                        </td>

                        <td className="px-4 py-4 font-mono text-slate-700">
                          {connection.reference_number}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {connection.meter_number || "-"}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {connection.tenant || "-"}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {connection.location || "-"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              connection.active
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {connection.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        No connections found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}