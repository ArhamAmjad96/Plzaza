import { getTenantContext } from "@/lib/auth/tenant-context";
import TenantProfileClient from "@/components/tenant/TenantProfileClient";

export default async function TenantProfilePage() {
  const context = await getTenantContext();
  const { tenant, unit, user } = context;

  return (
    <div className="space-y-6 select-none">
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8FA66B]">
          RESIDENT ACCOUNT & CREDENTIALS
        </span>
        <h1 className="text-2xl font-bold text-[#17211D] mt-1">My Profile & Security</h1>
        <p className="text-xs text-[#58655E]">
          Review your registered identity details, assigned space parameters, and manage your portal password.
        </p>
      </div>

      <TenantProfileClient
        user={user}
        tenant={tenant}
        unit={unit}
      />
    </div>
  );
}
