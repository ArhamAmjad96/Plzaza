"use client";

import { useState } from "react";
import { TenantCredentialRow } from "@/lib/auth/profile-service";
import { TenantLeaseView } from "@/lib/tenants/service";
import TenantPortalAccessModal from "./TenantPortalAccessModal";
import {
  KeyRound,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

interface TenantCredentialsTableProps {
  credentials: TenantCredentialRow[];
  tenants: TenantLeaseView[];
}

export default function TenantCredentialsTable({
  credentials,
  tenants,
}: TenantCredentialsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Set<string | number>>(new Set());
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [portalAccessTenant, setPortalAccessTenant] = useState<TenantLeaseView | null>(null);

  function togglePasswordVisibility(tenantId: string | number) {
    setVisiblePasswordIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tenantId)) {
        newSet.delete(tenantId);
      } else {
        newSet.add(tenantId);
      }
      return newSet;
    });
  }

  function handleCopyCredentials(row: TenantCredentialRow) {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const text = "🏢 Plaza Tenant Portal Login\nResident: " + row.tenant_name + "\nSpace: " + row.unit_name + "\nPortal Link: " + origin + "/login\nUsername: " + row.username + "\nPassword: " + (row.password || "tenant123") + "\n\nPlease keep your credentials safe and use them to log into your resident dashboard.";
    navigator.clipboard.writeText(text);
    setCopiedId(row.tenant_id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleOpenPortalAccess(tenantId: string | number) {
    const found = tenants.find((t) => t.tenant.id.toString() === tenantId.toString());
    if (found) {
      setPortalAccessTenant(found);
    }
  }

  const filteredRows = credentials.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.tenant_name.toLowerCase().includes(q) ||
      r.username.toLowerCase().includes(q) ||
      r.unit_name.toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Security Banner */}
      <div className="p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#17211D] text-[#8FA66B] flex items-center justify-center shrink-0 shadow-xs">
            <KeyRound size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#17211D]">
              Tenant Credentials Vault (Admin Side Only)
            </h3>
            <p className="text-xs text-[#58655E]">
              Audit, view, and share portal login usernames & passwords for all commercial tenants.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowAllPasswords(!showAllPasswords)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-semibold text-[#17211D] hover:bg-[#DDE4CF] transition cursor-pointer"
          >
            {showAllPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showAllPasswords ? "Hide All Passwords" : "Reveal All Passwords"}</span>
          </button>
        </div>
      </div>

      {/* Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#58655E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenant, username, or shop..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D]"
          />
        </div>

        <span className="text-xs font-mono text-[#58655E]">
          Showing <strong className="text-[#17211D]">{filteredRows.length}</strong> tenant credentials
        </span>
      </div>

      {/* Credentials Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#CBD4BC] bg-[#FAF6F0] shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#E8EDD9] border-b border-[#CBD4BC] font-mono text-[#58655E]">
            <tr>
              <th className="px-4 py-3 font-bold uppercase tracking-wider">Tenant & Space</th>
              <th className="px-4 py-3 font-bold uppercase tracking-wider">Portal Username</th>
              <th className="px-4 py-3 font-bold uppercase tracking-wider">Portal Password</th>
              <th className="px-4 py-3 font-bold uppercase tracking-wider">Access Status</th>
              <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CBD4BC]/60">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#58655E]">
                  No tenant credentials found matching your search.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isPassVisible = showAllPasswords || visiblePasswordIds.has(row.tenant_id);
                const isCopied = copiedId === row.tenant_id;
                return (
                  <tr key={row.tenant_id} className="hover:bg-[#E8EDD9]/40 transition">
                    {/* Tenant & Space */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-[#17211D] text-[#8FA66B] flex items-center justify-center font-bold text-xs shrink-0">
                          {row.tenant_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#17211D]">{row.tenant_name}</p>
                          <p className="text-[11px] font-mono text-[#58655E]">
                            {row.unit_name} {row.phone ? "· " + row.phone : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Portal Username */}
                    <td className="px-4 py-3.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8EDD9] border border-[#CBD4BC] font-mono font-bold text-[#17211D]">
                        <span>{row.username}</span>
                      </div>
                    </td>

                    {/* Portal Password */}
                    <td className="px-4 py-3.5">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-mono font-semibold text-[#17211D] px-2.5 py-1 rounded-lg bg-[#E8EDD9]/70 border border-[#CBD4BC]">
                          {isPassVisible ? (row.password || "tenant123") : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(row.tenant_id)}
                          className="p-1 rounded-lg hover:bg-[#E8EDD9] text-[#58655E] hover:text-[#17211D] transition cursor-pointer"
                          title={isPassVisible ? "Hide Password" : "Reveal Password"}
                        >
                          {isPassVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>

                    {/* Access Status */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#2D5A27]" />
                        <span className="font-mono text-[11px] font-semibold text-[#2D5A27]">
                          Active Login
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(row)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] text-[#17211D] hover:bg-[#DDE4CF] text-xs font-semibold transition cursor-pointer"
                          title="Copy login info for WhatsApp / SMS"
                        >
                          {isCopied ? <Check size={12} className="text-[#8FA66B]" /> : <Copy size={12} />}
                          <span>{isCopied ? "Copied!" : "Copy Info"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenPortalAccess(row.tenant_id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-[#17211D] hover:bg-[#E8EDD9] text-xs font-medium transition cursor-pointer"
                          title="Edit or Reset Password"
                        >
                          <KeyRound size={12} className="text-[#8FA66B]" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Portal Access Modal */}
      {portalAccessTenant && (
        <TenantPortalAccessModal
          tenantView={portalAccessTenant}
          onClose={() => setPortalAccessTenant(null)}
        />
      )}
    </div>
  );
}
