"use client";

import { useState } from "react";
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
  const [resetting, setResetting] = useState(false);

  async function handleResetPlaza() {
    const confirmName = window.prompt(
      `Type "RESET" to confirm wiping all previous tenants, rent ledgers, electricity dues, and maintenance records:`
    );

    if (confirmName !== "RESET") {
      return;
    }

    setResetting(true);
    try {
      await resetPlazaAction();
      router.refresh();
      alert("✓ Plaza completely reset! All previous records and dues have been cleared.");
    } catch {
      alert("Failed to reset plaza data. Please check connection.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-8">
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
            onClick={handleResetPlaza}
            disabled={resetting}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-[#8E3E33] hover:bg-[#FAECE9] text-xs font-medium transition shadow-xs disabled:opacity-50"
          >
            <RotateCcw size={14} />
            <span>{resetting ? "Resetting..." : "Reset All Plaza Data"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSetupWizard(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-medium hover:bg-[#24332D] transition shadow-xs"
          >
            <Sliders size={14} />
            <span>Launch Setup Wizard</span>
          </button>
        </div>
      </div>

      {/* ─── Active Plaza Overview ─── */}
      <section className="bg-[#FAF6F0] rounded-3xl border border-[#CBD4BC] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
            ACTIVE PROPERTY PROFILE
          </span>
          <span className="text-xs font-mono text-[#8FA66B] flex items-center gap-1">
            <ShieldCheck size={12} />
            <span>Configured</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-[#58655E]">Plaza Name</span>
            <p className="text-base font-semibold text-[#17211D] mt-0.5">{plaza.name}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[#58655E]">Address / City</span>
            <p className="text-base font-semibold text-[#17211D] mt-0.5">{plaza.address || "Islamabad, Pakistan"}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[#58655E]">Active Floors</span>
            <p className="text-base font-mono font-semibold text-[#17211D] mt-0.5">
              {plaza.floors?.length || 4} Building Levels
            </p>
          </div>
        </div>
      </section>

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
          onClick={handleResetPlaza}
          disabled={resetting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8E3E33] text-white text-xs font-medium hover:bg-[#723128] transition disabled:opacity-50"
        >
          <Trash2 size={13} />
          <span>{resetting ? "Resetting Everything..." : "Wipe & Start Fresh"}</span>
        </button>
      </section>

      {/* Setup Wizard Modal */}
      {showSetupWizard && (
        <PlazaSetupWizard
          initialName={plaza.name}
          initialAddress={plaza.address || "Islamabad, Pakistan"}
          initialFloors={plaza.floors}
          onClose={() => setShowSetupWizard(false)}
        />
      )}
    </div>
  );
}
