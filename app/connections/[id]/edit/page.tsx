import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import Link from "next/link";
import { updateConnection, toggleConnection } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditConnectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: connection, error } = await supabase
    .from("connections")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !connection) {
    notFound();
  }

  return (
    <main>
      <div className="mb-8">
        <Link
          href={`/connections/${connection.id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Connection
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Edit Connection
        </h1>

        <p className="mt-2 text-slate-600">
          Update electricity connection details.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          Connection Details
        </h2>

        <form action={updateConnection.bind(null, connection.id)}>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Connection Name
              </label>

              <input
                type="text"
                name="name"
                defaultValue={connection.name}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Reference Number
              </label>

              <input
                type="text"
                defaultValue={connection.reference_number}
                disabled
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Meter Number
              </label>

              <input
                type="text"
                name="meter_number"
                defaultValue={connection.meter_number || ""}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Tenant
              </label>

              <input
                type="text"
                name="tenant"
                defaultValue={connection.tenant || ""}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Location
              </label>

              <input
                type="text"
                name="location"
                defaultValue={connection.location || ""}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Tariff
              </label>

              <input
                type="text"
                name="tariff"
                defaultValue={connection.tariff || ""}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {connection.active ? (
              <button
                type="submit"
                formAction={toggleConnection.bind(
                  null,
                  connection.id,
                  false
                )}
                className="rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Deactivate
              </button>
            ) : (
              <button
                type="submit"
                formAction={toggleConnection.bind(
                  null,
                  connection.id,
                  true
                )}
                className="rounded-xl border border-green-300 px-5 py-2.5 text-sm font-semibold text-green-600 hover:bg-green-50"
              >
                Activate
              </button>
            )}

            <Link
              href={`/connections/${connection.id}`}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}