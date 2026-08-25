import { getEligibleRentEscalations } from "@/lib/automation/service";
import { getTenantsWithLeases } from "@/lib/tenants/service";
import { supabase } from "@/lib/supabase/server";
import AutomationManager from "@/components/automation/AutomationManager";

export default async function AutomationPage() {
  const [escalations, { tenants }, connsRes] = await Promise.all([
    getEligibleRentEscalations(),
    getTenantsWithLeases(),
    supabase.from("connections").select("id", { count: "exact", head: true }).eq("active", true),
  ]);

  const activeTenantsCount = tenants.filter((t) => t.is_active && t.lease).length;
  const activeConnectionsCount = connsRes.count ?? 0;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Banner */}
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-600 font-semibold">
                Operations & Workflows
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Automation & Background Jobs
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Manage month-start tenant ledger generation, automated plaza-wide IESCO electricity bill scanning, and scheduled annual rent escalation rules.
              </p>
            </div>
          </div>
        </section>

        {/* Automation Manager Component */}
        <AutomationManager
          escalations={escalations}
          activeTenantsCount={activeTenantsCount}
          activeConnectionsCount={activeConnectionsCount}
        />
      </div>
    </main>
  );
}
