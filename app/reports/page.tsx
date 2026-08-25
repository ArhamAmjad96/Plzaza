import { getFinancialOverviewReport } from "@/lib/reports/service";
import ReportsManager from "@/components/reports/ReportsManager";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const monthInput = params.month || null;

  const report = await getFinancialOverviewReport(monthInput);

  return (
    <div className="space-y-8">
      <ReportsManager report={report} />
    </div>
  );
}
