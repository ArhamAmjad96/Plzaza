import { getConnectionsWithMappings } from "@/lib/electricity/service";
import { getAllUnits } from "@/lib/units/service";
import ConnectionsManager from "@/components/connections/ConnectionsManager";
import { Zap, Activity, Layers } from "lucide-react";

export default async function ConnectionsPage() {
  const [connections, { units }] = await Promise.all([
    getConnectionsWithMappings(),
    getAllUnits(),
  ]);

  const totalConnections = connections.length;
  const dedicatedCount = connections.filter((c) => !c.is_shared).length;
  const sharedCount = connections.filter((c) => c.is_shared).length;

  return (
    <div className="space-y-8">
      {/* ─── Dark Forest Electricity Hero ─── */}
      <section className="rounded-3xl border border-[#32433B] bg-[#1B2521] p-8 sm:p-12 text-[#F4F7F2] space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#32433B] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#8FA66B]">
                UTILITY GRID & INFRASTRUCTURE
              </span>
              <Zap size={14} className="text-[#FF704D] animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#F4F7F2] mt-1">
              Electricity. <br />
              <span className="text-[#85918A]">Automatically Managed.</span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#24332D] border border-[#32433B] text-xs font-mono text-[#8FA66B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8FA66B] animate-pulse" />
            <span>IESCO Sync Ready</span>
          </div>
        </div>

        {/* Large Metric Figures */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 font-mono">
          <div>
            <span className="text-[10px] uppercase font-sans text-[#85918A] block">Total Registered Meters</span>
            <p className="text-3xl font-bold text-[#F4F7F2] mt-1">
              {totalConnections.toString().padStart(2, "0")}
            </p>
            <p className="text-[11px] text-[#85918A] font-sans mt-0.5">Active IESCO reference IDs</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans text-[#85918A] block">Dedicated Shop Meters</span>
            <p className="text-3xl font-bold text-[#FF704D] mt-1">
              {dedicatedCount.toString().padStart(2, "0")}
            </p>
            <p className="text-[11px] text-[#85918A] font-sans mt-0.5">1-to-1 individual billing</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans text-[#85918A] block">Shared Sub-Meters</span>
            <p className="text-3xl font-bold text-[#8FA66B] mt-1">
              {sharedCount.toString().padStart(2, "0")}
            </p>
            <p className="text-[11px] text-[#85918A] font-sans mt-0.5">Proportional split across rooms</p>
          </div>
        </div>
      </section>

      {/* ─── Connections Manager ─── */}
      <ConnectionsManager connections={connections} allUnits={units} />
    </div>
  );
}