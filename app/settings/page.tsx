import { supabase } from "@/lib/supabase/server";
import { getPrimaryPlaza } from "@/lib/units/service";
import SettingsManager from "@/components/settings/SettingsManager";

export default async function SettingsPage() {
  const [plaza, connsRes, billsRes] = await Promise.all([
    getPrimaryPlaza(),
    supabase.from("connections").select("id", { count: "exact", head: true }),
    supabase.from("bills").select("id", { count: "exact", head: true }),
  ]);

  const totalConnections = connsRes.count ?? 0;
  const totalBills = billsRes.count ?? 0;

  return (
    <div className="space-y-8">
      <SettingsManager
        plaza={plaza}
        totalConnections={totalConnections}
        totalBills={totalBills}
      />
    </div>
  );
}
