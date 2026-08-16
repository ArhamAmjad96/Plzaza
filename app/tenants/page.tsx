import { supabase } from "@/lib/supabase/server";
import { updateTenant } from "./actions";

export default async function TenantsPage() {
  const { data: connections, error } = await supabase
    .from("connections")
    .select("id, name, tenant, location, reference_number")
    .order("id", { ascending: true });

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Tenants
          </h1>

          <p className="mt-2 text-slate-600">
            Manage tenants assigned to electricity connections.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Assign Tenants
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter or update the tenant name for each electricity connection.
          </p>

          {error ? (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              Failed to load connections: {error.message}
            </div>
          ) : connections && connections.length > 0 ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">
                      Connection
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Reference Number
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Tenant
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Location
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {connections.map((connection) => (
                    <tr
                      key={connection.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-4">
                        {connection.id}
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-900">
                        {connection.name}
                      </td>

                      <td className="px-4 py-4 font-mono">
                        {connection.reference_number}
                      </td>

                      <td className="px-4 py-4">
  <form
    action={updateTenant.bind(null, connection.id.toString())}
    className="flex gap-2"
  >
    <input
      type="text"
      name="tenant"
      defaultValue={connection.tenant || ""}
      placeholder="Tenant name"
      className="h-10 w-48 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500"
    />

    <button
      type="submit"
      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
    >
      Save
    </button>
  </form>
</td>

                      <td className="px-4 py-4 text-slate-600">
                        {connection.location || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">
              No connections found.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}