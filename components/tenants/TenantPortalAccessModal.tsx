"use client";

import { useState, useEffect } from "react";
import { TenantLeaseView } from "@/lib/tenants/service";
import {
  KeyRound,
  X,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";

interface TenantPortalAccessModalProps {
  tenantView: TenantLeaseView;
  onClose: () => void;
}

export default function TenantPortalAccessModal({
  tenantView,
  onClose,
}: TenantPortalAccessModalProps) {
  const { tenant, unit } = tenantView;
  const defaultUsername =
    (tenant as any).username ||
    tenant.full_name.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "tenant";

  const defaultEmail = (tenant as any).email || `${defaultUsername}@plaza.com`;

  const [username, setUsername] = useState(defaultUsername);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingAccess, setHasExistingAccess] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [successData, setSuccessData] = useState<{ username: string; email?: string; password?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch(`/api/admin/tenants/${tenant.id}/portal-access`);
        if (res.ok) {
          const data = await res.json();
          if (data.hasAccess) {
            setHasExistingAccess(true);
            if (data.profile) setExistingProfile(data.profile);
            if (data.username) setUsername(data.username);
            if (data.email) setEmail(data.email);
            if (data.password) setPassword(data.password);
          }
        }
      } catch {
      } finally {
        setChecking(false);
      }
    }
    checkAccess();
  }, [tenant.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const targetUsername = username.trim().toLowerCase();
    if (!targetUsername || !password.trim()) {
      setError("Please provide both username and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}/portal-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: targetUsername,
          email: email.trim() || `${targetUsername}@plaza.com`,
          password,
          fullName: tenant.full_name,
          phone: tenant.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to configure portal access.");
      }

      setSuccessData({
        username: data.credentials?.username || targetUsername,
        email: data.credentials?.email || email,
        password,
      });
      setHasExistingAccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to update portal access.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyCredentials() {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const text = `🏢 Plaza Resident Portal Login\nResident: ${tenant.full_name}\nSpace: ${unit?.unit_name || "Assigned Unit"}\nPortal Link: ${origin}/login\nUsername: ${successData?.username || username}\nPassword: ${successData?.password || password}\n\nPlease keep your credentials safe and use them to log into your resident dashboard.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#17211D]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#17211D] text-[#8FA66B] flex items-center justify-center">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17211D]">
                Tenant Portal Access
              </h3>
              <p className="text-xs text-[#58655E]">
                {tenant.full_name} · {unit?.unit_name || "Unassigned Space"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#E8EDD9] text-[#58655E] hover:text-[#17211D] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Existing Status Banner */}
        {checking ? (
          <div className="p-4 text-center text-xs font-mono text-[#58655E] flex items-center justify-center gap-2">
            <Loader2 size={15} className="animate-spin text-[#8FA66B]" />
            <span>Checking portal status...</span>
          </div>
        ) : hasExistingAccess ? (
          <div className="p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-[#2D5A27]" />
                <div>
                  <p className="text-xs font-bold text-[#17211D]">Portal Access Active</p>
                  <p className="text-[11px] font-mono text-[#58655E]">
                    Username: <strong className="text-[#17211D]">{username}</strong>
                    {password && (
                      <span className="ml-2 pl-2 border-l border-[#CBD4BC]">
                        Password: <strong className="text-[#2D5A27]">{showPassword ? password : "••••••••"}</strong>
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#2D5A27]/10 text-[10px] font-mono font-bold text-[#2D5A27]">
                CONFIGURED
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 py-2 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {copied ? <Check size={13} className="text-[#8FA66B]" /> : <Copy size={13} />}
                <span>{copied ? "Copied Credentials!" : "Copy Active Credentials"}</span>
              </button>
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs font-semibold text-[#17211D] hover:bg-[#E8EDD9] transition flex items-center gap-1.5 cursor-pointer"
                  title="Toggle Password Visibility"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showPassword ? "Hide" : "Show"}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-dashed border-[#CBD4BC] text-xs text-[#58655E]">
            This tenant does not have active portal login credentials configured yet.
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-[#FAECE9] border border-[#EAC4BE] text-xs text-[#8E3E33] flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Card with 1-Click Copy */}
        {successData ? (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#17211D]">Credentials Ready to Share</span>
                <span className="text-[10px] font-mono text-[#2D5A27] font-bold">SAVED ✓</span>
              </div>

              <div className="space-y-1.5 font-mono text-xs bg-[#FAF6F0] p-3 rounded-xl border border-[#CBD4BC]">
                <div className="flex justify-between">
                  <span className="text-[#58655E]">Portal URL:</span>
                  <span className="text-[#17211D]">/login</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#58655E]">Username:</span>
                  <strong className="text-[#17211D]">{successData.username}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#58655E]">Password:</span>
                  <strong className="text-[#FF704D]">{successData.password}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyCredentials}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-[#8FA66B]" />
                    <span>Copied Credentials to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Shareable Login Info</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#CBD4BC] text-xs font-semibold text-[#17211D] hover:bg-[#B8C3A4] transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#58655E] block font-semibold">
                  Portal Login Username *
                </label>
                <span className="text-[10px] text-[#85918A]">
                  Tenant signs in with this username
                </span>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                placeholder="e.g. ali or saif_g03"
                required
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#17211D]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#58655E] block font-semibold">
                  {hasExistingAccess ? "Reset / New Password *" : "Set Initial Password *"}
                </label>
                <button
                  type="button"
                  onClick={() => setPassword(`tenant${Math.floor(100 + Math.random() * 900)}`)}
                  className="text-[10px] text-[#FF704D] hover:underline cursor-pointer"
                >
                  Generate Random
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#17211D]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85918A] hover:text-[#17211D] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-[#85918A]">
                The tenant will use this password together with their username to sign in at /login.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 font-sans">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] text-xs font-semibold text-[#17211D] hover:bg-[#DDE4CF] transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-[#8FA66B]" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={13} className="text-[#8FA66B]" />
                    <span>{hasExistingAccess ? "Update Credentials" : "Create Portal Access"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
