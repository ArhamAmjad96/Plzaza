"use client";

import { useState } from "react";
import {
  UserCheck,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Phone,
  CreditCard,
  Lock,
} from "lucide-react";

interface TenantProfileClientProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: "TENANT";
  };
  tenant: {
    id: number | string;
    full_name: string;
    cnic?: string | null;
    phone?: string | null;
    email?: string | null;
    emergency_contact?: string | null;
    status: string;
  } | null;
  unit: {
    id: number | string;
    unit_name: string;
    floor: string;
    unit_type: string;
  } | null;
}

export default function TenantProfileClient({
  user,
  tenant,
  unit,
}: TenantProfileClientProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/tenant/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update password.");
      }

      setSuccess("Your portal password has been changed successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Resident Identity Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-[#17211D] text-[#8FA66B] flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#17211D]">Identity & Space</h2>
              <p className="text-xs text-[#58655E]">Official Record on File</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#E8EDD9] text-[10px] font-mono font-bold text-[#2D5A27]">
            {tenant?.status || "ACTIVE"}
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between py-2 border-b border-[#CBD4BC]/50">
            <span className="text-[#58655E]">Full Name:</span>
            <strong className="text-[#17211D]">{tenant?.full_name || user.fullName}</strong>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#CBD4BC]/50">
            <span className="text-[#58655E]">Assigned Space:</span>
            <span className="text-[#17211D] font-bold">{unit?.unit_name || "Unassigned"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#CBD4BC]/50">
            <span className="text-[#58655E]">Floor Level:</span>
            <span className="text-[#17211D]">{unit?.floor || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#CBD4BC]/50">
            <span className="text-[#58655E]">CNIC / Identity:</span>
            <span className="text-[#17211D]">{tenant?.cnic || "Not Recorded"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#CBD4BC]/50">
            <span className="text-[#58655E]">Phone:</span>
            <span className="text-[#17211D]">{tenant?.phone || "—"}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[#58655E]">Emergency Contact:</span>
            <span className="text-[#17211D]">{tenant?.emergency_contact || "—"}</span>
          </div>
        </div>
      </div>

      {/* Security & Password Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-2xl bg-[#17211D] text-[#8FA66B] flex items-center justify-center">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#17211D]">Change Password</h2>
            <p className="text-xs text-[#58655E]">Manage Your Account Security</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] text-xs font-mono">
          <span className="text-[#58655E] block text-[10px] uppercase">Logged In Email</span>
          <strong className="text-[#17211D]">{user.email}</strong>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-[#FAECE9] border border-[#EAC4BE] text-xs text-[#8E3E33] flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] text-xs text-[#2D5A27] flex items-start gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-3 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-[#58655E] block font-semibold">New Password *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#17211D]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#58655E] block font-semibold">Confirm Password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#17211D]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin text-[#8FA66B]" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound size={14} className="text-[#8FA66B]" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
