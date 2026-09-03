"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e?: React.FormEvent, customIdentifier?: string, customPassword?: string) {
    if (e) e.preventDefault();
    const loginIdentifier = (customIdentifier || identifier).trim();
    const loginPassword = customPassword || password;

    if (!loginIdentifier || !loginPassword) {
      setError("Please enter both username/email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginIdentifier, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed. Invalid username or password.");
      }

      // Smooth redirection to appropriate portal
      router.push(data.redirectUrl || (data.role === "ADMIN" ? "/" : "/tenant"));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickLogin(role: "ADMIN" | "TENANT") {
    if (role === "ADMIN") {
      setIdentifier("admin@plaza.com");
      setPassword("admin123");
      handleLogin(undefined, "admin@plaza.com", "admin123");
    } else {
      setIdentifier("tenant");
      setPassword("tenant123");
      handleLogin(undefined, "tenant", "tenant123");
    }
  }

  return (
    <div className="min-h-screen bg-[#DDE4CF] flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Plaza Identity Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-[#17211D] border border-[#CBD4BC] items-center justify-center text-[#F4F7F2] shadow-md mb-2">
            <Building2 size={26} className="text-[#8FA66B]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17211D]">
            Plaza Manager
          </h1>
          <p className="text-xs sm:text-sm text-[#58655E]">
            Property Management & Electricity Utility Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-bold text-[#17211D]">Sign In</h2>
            <p className="text-xs text-[#58655E]">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-[#FAECE9] border border-[#EAC4BE] text-xs text-[#8E3E33] flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-[#58655E] block">
                Username or Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#85918A]" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@plaza.com or tenant username"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#17211D]"
                />
              </div>
              <p className="text-[10px] text-[#85918A]">
                Admin: <span className="font-mono text-[#17211D]">admin@plaza.com</span> · Tenants: Use your assigned username
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-[#58655E] block">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#85918A]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#17211D]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin text-[#8FA66B]" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill Switchers */}
          <div className="pt-4 border-t border-[#CBD4BC]/60 space-y-2.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#85918A] block text-center">
              1-Click Demo Accounts
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("ADMIN")}
                disabled={loading}
                className="p-2.5 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] hover:bg-[#DDE4CF] transition text-left flex flex-col justify-between cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#17211D]">Admin Demo</span>
                  <ShieldCheck size={13} className="text-[#8FA66B]" />
                </div>
                <span className="text-[10px] font-mono text-[#58655E] mt-1 truncate">admin@plaza.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("TENANT")}
                disabled={loading}
                className="p-2.5 rounded-xl border border-[#CBD4BC] bg-[#E8EDD9] hover:bg-[#DDE4CF] transition text-left flex flex-col justify-between cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#17211D]">Tenant Demo</span>
                  <UserCheck size={13} className="text-[#FF704D]" />
                </div>
                <span className="text-[10px] font-mono text-[#58655E] mt-1 truncate">tenant@plaza.com</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <p className="text-[11px] text-center text-[#58655E]">
          Protected by role-based session verification & secure storage.
        </p>
      </div>
    </div>
  );
}
