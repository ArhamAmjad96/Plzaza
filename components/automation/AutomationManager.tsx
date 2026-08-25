"use client";

import { useState } from "react";
import {
  triggerLedgerGenerationAction,
  triggerBillSyncAction,
  applyRentEscalationAction,
} from "@/app/automation/actions";
import { RentEscalationCandidate } from "@/lib/automation/service";
import { formatPKR } from "@/lib/utils/format";

interface AutomationManagerProps {
  escalations: RentEscalationCandidate[];
  activeTenantsCount: number;
  activeConnectionsCount: number;
}

export default function AutomationManager({
  escalations,
  activeTenantsCount,
  activeConnectionsCount,
}: AutomationManagerProps) {
  // Ledger generation state
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [runningLedgers, setRunningLedgers] = useState(false);
  const [ledgerMessage, setLedgerMessage] = useState<string | null>(null);

  // Bill sync state
  const [runningBillSync, setRunningBillSync] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  // Escalation state
  const [applyingLeaseId, setApplyingLeaseId] = useState<string | number | null>(null);

  async function handleRunLedgers() {
    setRunningLedgers(true);
    setLedgerMessage(null);
    try {
      const res = await triggerLedgerGenerationAction(selectedMonth);
      setLedgerMessage(
        `✓ Successfully generated/synced ${res.generatedCount} tenant accounts for ${selectedMonth}.`
      );
    } catch (err) {
      setLedgerMessage(`✕ Error: ${err instanceof Error ? err.message : "Failed to run ledgers."}`);
    } finally {
      setRunningLedgers(false);
    }
  }

  async function handleRunBillSync() {
    setRunningBillSync(true);
    setSyncLogs(["Initiating plaza-wide IESCO bill sync across all active meters..."]);
    try {
      const res = await triggerBillSyncAction();
      setSyncLogs(res.logs);
    } catch (err) {
      setSyncLogs((prev) => [...prev, `✕ Error: ${err instanceof Error ? err.message : "Sync failed."}`]);
    } finally {
      setRunningBillSync(false);
    }
  }

  async function handleApplyEscalation(candidate: RentEscalationCandidate) {
    const confirmApp = window.confirm(
      `Apply annual rent increase for ${candidate.tenant_name} (${candidate.unit_name}) from ${formatPKR(candidate.current_rent)} to ${formatPKR(candidate.new_rent)} (+${candidate.annual_increase_pct}%)?`
    );
    if (!confirmApp) return;

    setApplyingLeaseId(candidate.lease_id);
    try {
      await applyRentEscalationAction(candidate.lease_id, candidate.new_rent);
      alert(`✓ Successfully updated rent to ${formatPKR(candidate.new_rent)}.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to apply rent increase.");
    } finally {
      setApplyingLeaseId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* KPI Overview */}
      <section className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Automated Tenant Accounts
          </p>
          <p className="mt-3 text-3xl font-extrabold text-blue-600 font-mono">
            {activeTenantsCount}
          </p>
          <p className="mt-2 text-xs text-slate-500">Active monthly billing accounts</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Monitored IESCO Meters
          </p>
          <p className="mt-3 text-3xl font-extrabold text-indigo-600 font-mono">
            {activeConnectionsCount}
          </p>
          <p className="mt-2 text-xs text-slate-500">Active PITC/IESCO reference numbers</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pending Rent Escalations
          </p>
          <p className="mt-3 text-3xl font-extrabold text-amber-600 font-mono">
            {escalations.length}
          </p>
          <p className="mt-2 text-xs text-slate-500">Eligible within 60 days</p>
        </div>
      </section>

      {/* AUTOMATION JOBS GRID */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* JOB 1: MONTH-START LEDGER GENERATION */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📅</span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Month-Start Ledger Automation
                </h3>
                <p className="text-xs text-slate-500">
                  Batch generates monthly financial accounts for all active tenants.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Active Job
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              • Automatically evaluates rent, security deposit terms, and allocated electricity shares for each of the {activeTenantsCount} active tenants.
            </p>
            <p>
              • Protected by unique monthly constraints to prevent duplicate ledger creation.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-11 rounded-2xl border border-slate-300 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none"
            />

            <button
              type="button"
              disabled={runningLedgers}
              onClick={handleRunLedgers}
              className="flex-1 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 shadow-sm"
            >
              {runningLedgers ? "Generating Accounts..." : "⚡ Run Ledger Generation"}
            </button>
          </div>

          {ledgerMessage && (
            <div
              className={`rounded-2xl p-3.5 text-xs font-medium ${
                ledgerMessage.startsWith("✓")
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {ledgerMessage}
            </div>
          )}
        </div>

        {/* JOB 2: PLAZA-WIDE IESCO BILL SYNC */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Plaza-Wide IESCO Bill Sync
                </h3>
                <p className="text-xs text-slate-500">
                  Scans all {activeConnectionsCount} electricity reference numbers on PITC portal.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
              Auto-Sync
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              • Checks PITC/IESCO for newly issued monthly bills, readings, arrears, and due dates.
            </p>
            <p>
              • Automatically saves original bill high-resolution image via Playwright.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={runningBillSync}
              onClick={handleRunBillSync}
              className="w-full rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60 shadow-sm"
            >
              {runningBillSync ? "Syncing All Meters..." : "⚡ Sync All IESCO Bills Now"}
            </button>
          </div>

          {syncLogs.length > 0 && (
            <div className="rounded-2xl bg-slate-900 p-4 font-mono text-[11px] text-emerald-400 max-h-40 overflow-y-auto space-y-1">
              {syncLogs.map((log, idx) => (
                <p key={idx} className="leading-tight">{log}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ANNUAL RENT ESCALATION TRACKER */}
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Annual Rent Escalation & Increment Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Track leases reaching their 12-month annual increment window (e.g. standard 10% increase).
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            {escalations.length} Pending Review
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Tenant & Unit</th>
                <th className="px-4 py-3">Current Rent</th>
                <th className="px-4 py-3">Annual Escalation %</th>
                <th className="px-4 py-3">New Monthly Rent</th>
                <th className="px-4 py-3">Next Increment Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {escalations.length > 0 ? (
                escalations.map((cand) => (
                  <tr key={cand.lease_id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{cand.tenant_name}</p>
                      <p className="text-[11px] text-slate-500">{cand.unit_name}</p>
                    </td>

                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-800">
                      {formatPKR(cand.current_rent)}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-blue-600">
                      +{cand.annual_increase_pct}%
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-700 text-sm">
                      {formatPKR(cand.new_rent)}
                    </td>

                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      {cand.next_escalation_date}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          cand.is_due_now
                            ? "bg-rose-100 text-rose-800 ring-1 ring-rose-400"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {cand.is_due_now ? "⚠️ DUE NOW" : "UPCOMING"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        disabled={applyingLeaseId === cand.lease_id}
                        onClick={() => handleApplyEscalation(cand)}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                      >
                        {applyingLeaseId === cand.lease_id ? "Applying..." : "✓ Apply Increase"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No active leases currently due for annual rent escalation within the next 60 days.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CRON / API INTEGRATION GUIDE */}
      <section className="rounded-3xl border border-slate-200 bg-slate-900 p-7 text-white shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h3 className="text-base font-bold text-white">
            External Cron & Webhook API Endpoints
          </h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          You can hook these endpoints up to external scheduled cron runners (e.g. Vercel Cron, GitHub Actions, or cron-job.org) to execute automatically:
        </p>

        <div className="space-y-2 font-mono text-xs text-emerald-400 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <p><span className="text-slate-500"># 1. Monthly Ledger Generation (Run 1st of month at 00:01):</span></p>
          <p className="text-white">POST https://your-domain.com/api/automation/monthly-ledgers</p>
          
          <p className="mt-2"><span className="text-slate-500"># 2. Plaza-Wide IESCO Bill Sync (Run daily or weekly):</span></p>
          <p className="text-white">POST https://your-domain.com/api/automation/sync-bills</p>
        </div>
      </section>
    </div>
  );
}
