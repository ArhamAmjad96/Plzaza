import { getTenantContext } from "@/lib/auth/tenant-context";
import TenantSidebar from "@/components/tenant/TenantSidebar";
import TenantTopbar from "@/components/tenant/TenantTopbar";
import TenantMobileNav from "@/components/tenant/TenantMobileNav";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getTenantContext();
  const tenantName = context.tenant?.full_name || context.user.fullName;
  const unitName = context.unit?.unit_name;
  const tenantId = context.tenant?.id;

  return (
    <div className="flex min-h-screen bg-[#DDE4CF]">
      {/* Desktop Left Deep Forest Architectural Sidebar */}
      <TenantSidebar
        tenantName={tenantName}
        unitName={unitName}
        tenantId={tenantId}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {/* Topbar with Real-Time Clock, Notifications & Sign Out */}
        <TenantTopbar
          tenantName={tenantName}
          unitName={unitName}
          tenantId={tenantId}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <TenantMobileNav />
    </div>
  );
}
