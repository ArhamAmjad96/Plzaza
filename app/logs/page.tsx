import { getActivityLogs } from "@/lib/logs/service";
import AuditLogManager from "@/components/logs/AuditLogManager";

export const dynamic = "force-dynamic";

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || "ALL";
  const search = params.search || "";

 const { logs, total } = await getActivityLogs({
 category,
 search,
 });

 return (
 <div className="space-y-8">
 <AuditLogManager initialLogs={logs} totalLogs={total} />
 </div>
 );
}
