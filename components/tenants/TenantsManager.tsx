"use client";

import { useState } from "react";
import Link from "next/link";
import { TenantLeaseView, TenantStats } from "@/lib/tenants/service";
import { UnitItem } from "@/lib/units/service";
import { formatPKR } from "@/lib/utils/format";
import AddTenantModal from "./AddTenantModal";
import EditTenantModal from "./EditTenantModal";
import VacateTenantModal from "./VacateTenantModal";
import TenantPortalAccessModal from "./TenantPortalAccessModal";
import TenantCredentialsTable from "./TenantCredentialsTable";
import { TenantCredentialRow } from "@/lib/auth/profile-service";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import {
  Users,
  Search,
  Plus,
  Phone,
  ArrowUpRight,
  UserX,
  Sliders,
  Building2,
  Zap,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

interface TenantsManagerProps {
  tenants: TenantLeaseView[];
  stats: TenantStats;
  availableUnits: UnitItem[];
  credentials?: TenantCredentialRow[];
}

export default function TenantsManager({
  tenants,
  stats,
  availableUnits,
  credentials = [],
}: TenantsManagerProps) {
  const [selectedTab, setSelectedTab] = useState<"ACTIVE" | "CREDENTIALS" | "SHOPS" | "ROOMS" | "VACATED">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantLeaseView | null>(null);
  const [vacatingTenant, setVacatingTenant] = useState<TenantLeaseView | null>(null);
  const [portalAccessTenant, setPortalAccessTenant] = useState<TenantLeaseView | null>(null);

  // Filter tenants
  const filteredTenants = tenants.filter((tv) => {
    if (selectedTab === "ACTIVE" && !tv.is_active) return false;
    if (selectedTab === "VACATED" && tv.is_active) return false;
    if (selectedTab === "SHOPS" && (tv.unit?.unit_type !== "SHOP" || !tv.is_active)) return false;
    if (selectedTab === "ROOMS" && (tv.unit?.unit_type !== "ROOM" || !tv.is_active)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tv.tenant.full_name.toLowerCase().includes(q);
      const matchPhone = (tv.tenant.phone || "").toLowerCase().includes(q);
      const matchCnic = (tv.tenant.cnic || "").toLowerCase().includes(q);
      const matchUnit = (tv.unit?.unit_name || "").toLowerCase().includes(q);
      const matchNum = (tv.unit?.unit_number || "").toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCnic && !matchUnit && !matchNum) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-[#CBD4BC]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FF704D] font-mono">
            OCCUPANCY DIRECTORY
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#17211D]">
            Tenants
          </h1>
          <p className="text-xs text-[#58655E] mt-0.5">
            {stats.activeTenants} active leaseholders across {stats.totalTenants} historical tenants
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition shadow-xs"
        >
          <Plus size={14} />
          <span>Add Tenant</span>
        </button>
      </div>

      {/* ─── Filter & Search Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#58655E]" />
          <input
            type="text"
            placeholder="Search tenant name, phone, CNIC, or shop number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] placeholder-[#85918A] focus:border-[#FF704D] transition"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center p-1 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-medium text-[#58655E] flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setSelectedTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              selectedTab === "ACTIVE"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            Active ({stats.activeTenants})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab("CREDENTIALS")}
            className={`px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer ${
              selectedTab === "CREDENTIALS"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            <KeyRound size={13} className={selectedTab === "CREDENTIALS" ? "text-[#8FA66B]" : "text-[#58655E]"} />
            <span>Credentials Vault ({credentials.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab("SHOPS")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              selectedTab === "SHOPS"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            Shops ({stats.shopTenants})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab("ROOMS")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              selectedTab === "ROOMS"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            Rooms ({stats.roomTenants})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab("VACATED")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              selectedTab === "VACATED"
                ? "bg-[#17211D] text-[#F4F7F2] shadow-xs font-semibold"
                : "hover:text-[#17211D]"
            }`}
          >
            Past ({stats.vacatedTenants})
          </button>
        </div>
      </div>

      {/* ─── View Switch: Credentials Vault vs Tenant Directory Grid ─── */}
      {selectedTab === "CREDENTIALS" ? (
        <TenantCredentialsTable
          credentials={credentials}
          tenants={tenants}
        />
      ) : filteredTenants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenant records found"
          description="Try modifying your search or assign a tenant to an available shop."
          actionText="Assign Tenant"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((tv) => {
            const tenant = tv.tenant;
            const lease = tv.lease;
            const unit = tv.unit;

            return (
              <div
                key={tenant.id}
                className="bg-[#FAF6F0] rounded-2xl border border-[#CBD4BC] p-5 hover:border-[#8FA66B] transition-all shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top: Space & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
                        {unit ? unit.unit_name : "Unassigned Space"}
                      </span>
                      <h3 className="text-base font-semibold text-[#17211D] mt-0.5">
                        <Link
                          href={`/tenants/${tenant.id}`}
                          className="hover:text-[#FF704D] hover:underline transition"
                          title="Open 360 Tenant Profile"
                        >
                          {tenant.full_name}
                        </Link>
                      </h3>
                      {tenant.phone && (
                        <p className="text-xs font-mono text-[#58655E] mt-0.5 flex items-center gap-1">
                          <Phone size={11} className="text-[#8FA66B]" />
                          <span>{tenant.phone}</span>
                        </p>
                      )}
                    </div>

                    <StatusBadge
                      status={tv.is_active ? "ACTIVE" : "INACTIVE"}
                      label={tv.is_active ? "Active Lease" : "Vacated"}
                    />
                  </div>

                  {/* Financial Terms */}
                  {lease && (
                    <div className="mt-4 pt-3 border-t border-[#CBD4BC]/60 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[10px] uppercase font-sans text-[#58655E]">Monthly Rent</span>
                        <p className="font-semibold text-[#17211D] mt-0.5">{formatPKR(lease.monthly_rent)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-sans text-[#58655E]">Security Paid</span>
                        <p className="font-semibold text-[#17211D] mt-0.5">{formatPKR(lease.security_paid)}</p>
                      </div>
                    </div>
                  )}

                  {/* Electricity Meter Reference */}
                  {unit && (
                    <div className="mt-2.5 pt-2.5 border-t border-[#CBD4BC]/40 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#58655E]">IESCO Meter:</span>
                      {(unit as any).reference_number || tv.reference_number ? (
                        <span className="font-semibold text-[#2D5A27] bg-[#E8EDD9] border border-[#CBD4BC] px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Zap size={11} className="text-[#FF704D]" />
                          <span>{(unit as any).reference_number || tv.reference_number}</span>
                        </span>
                      ) : (
                        <span className="text-[#85918A]">No Meter Linked</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-[#CBD4BC]/60 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tenants/${tenant.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#17211D] hover:text-[#FF704D] transition py-1"
                      title="Open 360 Tenant Profile"
                    >
                      <Users size={13} className="text-[#8FA66B]" />
                      <span>View Profile</span>
                      <ArrowUpRight size={13} />
                    </Link>

                    {unit && (
                      <Link
                        href={`/units/${unit.id}`}
                        className="inline-flex items-center gap-1 text-xs text-[#58655E] hover:text-[#17211D] transition py-1 pl-1 border-l border-[#CBD4BC]"
                        title="View Physical Space"
                      >
                        <span>{unit.unit_name}</span>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPortalAccessTenant(tv)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] text-[#17211D] hover:bg-[#DDE4CF] text-xs font-semibold transition shadow-xs cursor-pointer"
                      title="Manage Portal Login Credentials"
                    >
                      <KeyRound size={12} className="text-[#8FA66B]" />
                      <span>Portal Access</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingTenant(tv)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-[#17211D] hover:bg-[#E8EDD9] text-xs font-medium transition shadow-xs cursor-pointer"
                    >
                      <Sliders size={12} className="text-[#58655E]" />
                      <span>Edit Data</span>
                    </button>

                    {tv.is_active && (
                      <button
                        type="button"
                        onClick={() => setVacatingTenant(tv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#EAC4BE] bg-[#FAECE9] text-[#8E3E33] hover:bg-[#F5D8D4] text-xs font-medium transition shadow-xs cursor-pointer"
                      >
                        <UserX size={12} />
                        <span>Remove Tenant</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modals ─── */}
      {showAddModal && (
        <AddTenantModal
          availableUnits={availableUnits}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingTenant && (
        <EditTenantModal
          tenantView={editingTenant}
          availableUnits={availableUnits}
          onClose={() => setEditingTenant(null)}
        />
      )}

      {vacatingTenant && (
        <VacateTenantModal
          tenantView={vacatingTenant}
          onClose={() => setVacatingTenant(null)}
        />
      )}

      {portalAccessTenant && (
        <TenantPortalAccessModal
          tenantView={portalAccessTenant}
          onClose={() => setPortalAccessTenant(null)}
        />
      )}
    </div>
  );
}
