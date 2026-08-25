import { getAllUnits } from "@/lib/units/service";
import UnitsManager from "@/components/units/UnitsManager";

export default async function UnitsPage() {
  const { units, stats, plaza } = await getAllUnits();

  return (
    <div className="space-y-8">
      <UnitsManager
        units={units}
        stats={stats}
        plaza={plaza}
      />
    </div>
  );
}
