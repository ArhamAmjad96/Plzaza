"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlazaItem } from "@/lib/units/service";
import { resetPlazaAction } from "@/app/units/actions";
import PlazaSetupWizard from "./PlazaSetupWizard";
import {
  Sliders,
  Building2,
  Zap,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  RotateCcw,
  X,
  CheckCircle2,
} from "lucide-react";

interface SettingsManagerProps {
  plaza: PlazaItem;
  totalConnections: number;
  totalBills: number;
}

export default function SettingsManager({
  plaza,
  totalConnections,
  totalBills,
}: SettingsManagerProps) {
  const router = useRouter();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [resetting, setResetting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const isConfigured = Boolean(
    plaza.name &&
    plaza.name.trim().length > 0 &&
    plaza.floors &&
    plaza.floors.length > 0 &&
    plaza.active !== false
  );

  // ESC key listener for modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && showResetModal && !resetting) {
        setShowResetModal(false);
        setConfirmInput("");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showResetModal, resetting]);

  function handleOpenResetModal() {
    setConfirmInput("");
    setNotification(null);
    setShowResetModal(true);
  }

  function handleCloseResetModal() {
    if (resetting) return;
    setShowResetModal(false);
    setConfirmInput("");
  }

  async function handleConfirmReset() {
    if (confirmInput.trim() !== "RESET" || resetting) {
      return;
    }

    setResetting(true);
    setNotification(null);

    try {
      await resetPlazaAction();
      setShowResetModal(false);
      setConfirmInput("");
      setNotification({
        type: "success",
        message: "Plaza has been completely reset. All previous units, leases, and records have been cleared.",
      });
      router.refresh();
    } catch {
      setNotification({
        type: "error",
        message: "Failed to reset plaza data. Please check your connection and try again.",
      });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ─── Notification Banner ─── */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-150 ${
            notification.type === "success"
              ? "bg-[#E8EDD9] border-[#CBD4BC] text-[#17211D]"
              : "bg-[#FAECE9] border-[#EAC4BE] text-[#8E3E33]"
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            {notification.type === "success" ? (
              <CheckCircle2 size={18} className="text-[#2D5A27] shrink-0" />
            ) : (
              <AlertTriangle size={18} className="text-[#8E3E33] shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 transition text-[#58655E]"
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-[#CBD4BC]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FF704D] font-mono">
            BUILDING SYSTEM
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#17211D]">
            Plaza Setup & Configuration
          </h1>
          <p className="text-xs text-[#58655E] mt-0.5">
            Configure building floors, physical units, meter infrastructure, and automation rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenResetModal}
            disabled={resetting}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-[#8E3E33] hover:bg-[#FAECE9] text-xs font-medium transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset All Plaza Data</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSetupWizard(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition shadow-xs cursor-pointer"
          >
            <Sliders size={14} />
            <span>Launch Setup Wizard</span>
          </button>
        </div>
      </div>

      {/* ─── Active Plaza Profile OR Empty Setup Invitation ─── */}
      {isConfigured ? (
        <section className="bg-[#FAF6F0] rounded-3xl border border-[#CBD4BC] p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
              ACTIVE PROPERTY PROFILE
            </span>
            <span className="text-xs font-mono text-[#8FA66B] flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>Configured ({plaza.floors!.length} Level{plaza.floors!.length > 1 ? "s" : ""})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#58655E]">Plaza Name</span>
              <p className="text-base font-semibold text-[#17211D] mt-0.5">
                {plaza.name}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-[#58655E]">Address / City</span>
              <p className="text-base font-semibold text-[#17211D] mt-0.5">
                {plaza.address || "Not Set"}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-[#58655E]">Active Floors</span>
              <p className="text-base font-mono font-semibold text-[#17211D] mt-0.5">
                {plaza.floors!.length} Level{plaza.floors!.length > 1 ? "s" : ""} ({plaza.floors!.join(", ")})
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-[#FAF6F0] rounded-3xl border border-[#CBD4BC] p-8 sm:p-12 text-center space-y-5 shadow-xs">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] flex items-center justify-center text-[#17211D]">
            <Building2 size={26} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-medium text-[#17211D]">No Active Property Setup</h2>
            <p className="text-xs text-[#58655E] leading-relaxed">
              Your workspace is completely clean. Launch the setup wizard to name your commercial building, select your floors (e.g. Basement only, Ground, etc.), and generate your physical units.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowSetupWizard(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-md cursor-pointer"
            >
              <Sliders size={15} />
              <span>Launch Plaza Setup Wizard</span>
            </button>
          </div>
        </section>
      )}

      {/* ─── Quick Tools Grid ─── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => setShowSetupWizard(true)}
          className="p-6 rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] hover:border-[#8FA66B] transition cursor-pointer space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-[#E8EDD9] border border-[#CBD4BC] text-[#17211D] flex items-center justify-center">
              <Layers size={17} />
            </div>
            <ArrowUpRight size={14} className="text-[#FF704D]" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#17211D]">
              Multi-Floor Plaza Builder
            </h3>
            <p className="text-xs text-[#58655E] mt-1 leading-relaxed">
              Interactively reconfigure basement, ground, upper floors, and flat room layouts with standard rent defaults. Automatically wipes all previous plaza data.
            </p>
          </div>
        </div>

        <Link
          href="/connections"
          className="p-6 rounded-3xl border border-[#CBD4BC] bg-[#FAF6F0] hover:border-[#8FA66B] transition space-y-3 shadow-xs block"
        >
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-[#E8EDD9] border border-[#CBD4BC] text-[#17211D] flex items-center justify-center">
              <Zap size={17} />
            </div>
            <ArrowUpRight size={14} className="text-[#FF704D]" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#17211D]">
              IESCO Utility Infrastructure
            </h3>
            <p className="text-xs text-[#58655E] mt-1 leading-relaxed">
              Manage {totalConnections} registered electricity reference numbers and shared sub-meter split formulas.
            </p>
          </div>
        </Link>
      </section>

      {/* ─── Danger Zone: Reset All Data ─── */}
      <section className="p-6 rounded-3xl border border-[#D9C4AC] bg-[#FAF6F0] space-y-3">
        <div className="flex items-center gap-2 text-[#8E3E33]">
          <AlertTriangle size={16} />
          <h3 className="font-semibold text-sm">Clean Start & Property Reset</h3>
        </div>
        <p className="text-xs text-[#58655E] leading-relaxed">
          Wipe all previous tenants, old lease agreements, past rent dues, electricity mappings, and repair records from the system. Use this whenever you are onboarding a new commercial property.
        </p>
        <button
          type="button"
          onClick={handleOpenResetModal}
          disabled={resetting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8E3E33] text-white text-xs font-medium hover:bg-[#723128] transition disabled:opacity-50 cursor-pointer"
        >
          <Trash2 size={13} />
          <span>{resetting ? "Resetting Everything..." : "Wipe & Start Fresh"}</span>
        </button>
      </section>

      {/* ─── In-App Reset Confirmation Modal ─── */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={handleCloseResetModal}
        >
          <div
            className="w-full max-w-md bg-[#FAF6F0] rounded-3xl border border-[#CBD4BC] shadow-2xl p-6 sm:p-8 space-y-6 text-[#17211D] animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
          >
            {/* Close Icon */}
            <button
              type="button"
              onClick={handleCloseResetModal}
              disabled={resetting}
              className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-[#E8EDD9] text-[#58655E] hover:text-[#17211D] transition disabled:opacity-50 cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Modal Header & Icon */}
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#FAECE9] border border-[#EAC4BE] flex items-center justify-center text-[#8E3E33] shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1 pr-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8E3E33]">
                  DESTRUCTIVE ACTION
                </span>
                <h2 id="reset-modal-title" className="text-xl font-bold text-[#17211D] leading-tight">
                  Reset Plaza Setup?
                </h2>
              </div>
            </div>

            {/* Description & Destructive Warning */}
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-[#58655E] leading-relaxed">
                This will permanently remove the current plaza setup and allow you to start fresh. This action cannot be undone.
              </p>

              <div className="p-3.5 rounded-2xl bg-[#FAECE9] border border-[#EAC4BE] text-xs text-[#8E3E33] space-y-1 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>Permanent Data Wipe Warning:</span>
                </p>
                <p className="text-[11.5px] text-[#8E3E33]/90">
                  All physical units, tenant profiles, lease contracts, rent ledger dues, electricity meters, and maintenance complaints will be erased.
                </p>
              </div>
            </div>

            {/* Safety Confirmation Input */}
            <div className="space-y-2">
              <label htmlFor="confirm-reset-input" className="block text-xs font-semibold text-[#17211D]">
                To confirm, type <span className="font-mono font-bold text-[#8E3E33] bg-[#FAECE9] px-1.5 py-0.5 rounded-md border border-[#EAC4BE]">RESET</span> below:
              </label>
              <input
                id="confirm-reset-input"
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type RESET to confirm"
                disabled={resetting}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD4BC] bg-white text-sm font-mono text-[#17211D] placeholder-[#85918A] focus:outline-hidden focus:ring-2 focus:ring-[#8E3E33] transition shadow-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseResetModal}
                disabled={resetting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] hover:bg-[#E8EDD9] text-xs sm:text-sm font-semibold text-[#58655E] hover:text-[#17211D] transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={confirmInput.trim() !== "RESET" || resetting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#8E3E33] hover:bg-[#723128] text-white text-xs sm:text-sm font-semibold transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={15} />
                <span>{resetting ? "Resetting..." : "Yes, Wipe & Start Fresh"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Wizard Modal */}
      {showSetupWizard && (
        <PlazaSetupWizard
          initialName={plaza.name || ""}
          initialAddress={plaza.address || ""}
          initialFloors={plaza.floors || []}
          onClose={() => setShowSetupWizard(false)}
        />
      )}
    </div>
  );
}
