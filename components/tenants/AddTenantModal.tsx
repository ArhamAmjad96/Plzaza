"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTenantAction } from "@/app/tenants/actions";
import { getAvailableUnitsAction, getExistingConnectionsAction } from "@/app/units/actions";
import { UnitItem } from "@/lib/units/service";
import { formatPKR } from "@/lib/utils/format";
import {
  Users,
  Building2,
  Calendar,
  Check,
  X,
  Phone,
  ArrowRight,
  ArrowLeft,
  Zap,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  ShieldCheck,
  Mail,
  AlertCircle,
} from "lucide-react";

interface AddTenantModalProps {
  availableUnits?: UnitItem[];
  preselectedUnitId?: number | string;
  preselectedUnit?: UnitItem;
  onClose: () => void;
}

function generateSecurePassword(name?: string): string {
  const prefix = (name || "Tenant")
    .trim()
    .split(" ")[0]
    .replace(/[^a-zA-Z]/g, "") || "Tenant";
  const capitalized = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
  const specialChars = ["@", "#", "!", "$"];
  const char = specialChars[Math.floor(Math.random() * specialChars.length)];
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${capitalized}${char}${randomNum}`;
}

function computeContractEndDate(startDateStr: string, months: number): string {
  try {
    const [y, m, d] = startDateStr.split("-").map(Number);
    const targetDate = new Date(y, m - 1 + months, d);
    targetDate.setDate(targetDate.getDate() - 1);
    return targetDate.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export default function AddTenantModal({
  availableUnits: initialUnits,
  preselectedUnitId,
  preselectedUnit,
  onClose,
}: AddTenantModalProps) {
  const router = useRouter();

  const initialFound =
    preselectedUnit ||
    (preselectedUnitId && initialUnits
      ? initialUnits.find((u) => u.id.toString() === preselectedUnitId.toString())
      : null);

  const [unitsList, setUnitsList] = useState<UnitItem[]>(initialUnits || []);
  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(initialFound || null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    initialFound ? initialFound.id.toString() : preselectedUnitId ? preselectedUnitId.toString() : ""
  );

  // 1. Tenant Details
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [email, setEmail] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split("T")[0]);

  // 2. Lease Contract Dates
  const [leaseStartDate, setLeaseStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [leaseEndDate, setLeaseEndDate] = useState(
    computeContractEndDate(new Date().toISOString().split("T")[0], 12)
  );
  const [selectedDurationMonths, setSelectedDurationMonths] = useState<number | null>(12);

  function handleStartDateChange(val: string) {
    setLeaseStartDate(val);
    setMoveInDate(val);
    if (selectedDurationMonths) {
      setLeaseEndDate(computeContractEndDate(val, selectedDurationMonths));
    }
  }

  function handleApplyDurationPreset(months: number) {
    setSelectedDurationMonths(months);
    setLeaseEndDate(computeContractEndDate(leaseStartDate, months));
  }

  // 3. Unit / Lease Terms
  const [monthlyRent, setMonthlyRent] = useState(
    initialFound ? initialFound.default_monthly_rent.toString() : "30000"
  );
  const [rentDueDay, setRentDueDay] = useState(
    initialFound ? initialFound.default_rent_due_day.toString() : "5"
  );
  const [securityAmount, setSecurityAmount] = useState(
    initialFound ? initialFound.default_security_amount.toString() : "50000"
  );
  const [securityPaid, setSecurityPaid] = useState(
    initialFound ? initialFound.default_security_amount.toString() : "50000"
  );

  // 3. Electricity Utility Assignment
  const [electricityOption, setElectricityOption] = useState<"OWN_METER" | "SHARED_METER" | "NO_METER">("OWN_METER");
  const [referenceNumber, setReferenceNumber] = useState(
    (initialFound as any)?.reference_number || ""
  );
  const [meterNumber, setMeterNumber] = useState(
    (initialFound as any)?.meter_number || ""
  );
  const [sharedConnectionId, setSharedConnectionId] = useState<string>("");
  const [splitType, setSplitType] = useState<"EQUAL" | "PERCENTAGE">("EQUAL");
  const [splitValue, setSplitValue] = useState("50");
  const [connectionsList, setConnectionsList] = useState<Array<{ id: number; name: string; reference_number: string }>>([]);

  // 4. Tenant Portal Access
  const [createPortalLogin, setCreatePortalLogin] = useState(true);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Navigation & State
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success Screen State
  const [createdSuccessData, setCreatedSuccessData] = useState<{
    tenantName: string;
    unitName: string;
    username: string;
    email?: string;
    password?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        if (!initialUnits || initialUnits.length === 0) {
          const units = await getAvailableUnitsAction();
          if (isMounted) setUnitsList(units);
        } else {
          if (isMounted) setUnitsList(initialUnits);
        }

        const conns = await getExistingConnectionsAction();
        if (isMounted) {
          setConnectionsList(conns);
          if (conns.length > 0) {
            setSharedConnectionId(conns[0].id.toString());
          }
        }
      } catch (err) {
        console.error("Failed to load initial onboarding data", err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [initialUnits]);

  // Sync login username and default password from name
  function handleNameChange(val: string) {
    setFullName(val);
    if (!loginPassword) {
      setLoginPassword(generateSecurePassword(val));
    }
    const clean = val.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean) setLoginUsername(clean);
  }

  function handleEmailChange(val: string) {
    setEmail(val);
  }

  function handleSelectUnitId(id: string) {
    setSelectedUnitId(id);
    const found = unitsList.find((u) => u.id.toString() === id);
    if (found) {
      setSelectedUnit(found);
      setMonthlyRent(found.default_monthly_rent.toString());
      setSecurityAmount(found.default_security_amount.toString());
      setSecurityPaid(found.default_security_amount.toString());
      setRentDueDay(found.default_rent_due_day.toString());
      if ((found as any).reference_number) {
        setReferenceNumber((found as any).reference_number);
        setElectricityOption("OWN_METER");
      }
      if ((found as any).meter_number) {
        setMeterNumber((found as any).meter_number);
      }
    }
  }

  function handleGeneratePassword() {
    const pwd = generateSecurePassword(fullName);
    setLoginPassword(pwd);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !phone.trim() || !selectedUnitId) {
      setError("Please fill in the tenant name, phone number, and assign a space.");
      return;
    }

    const targetUsername = (
      loginUsername ||
      fullName.toLowerCase().replace(/[^a-z0-9]/g, "") ||
      "tenant"
    ).trim().toLowerCase();

    if (createPortalLogin) {
      if (!targetUsername) {
        setError("Please provide a username for tenant portal access.");
        return;
      }
      if (!loginPassword.trim()) {
        setError("Please enter or generate a portal password.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const targetLoginEmail = (email.trim() || `${targetUsername}@plaza.com`).toLowerCase();
      const finalPassword = loginPassword.trim() || generateSecurePassword(fullName);

      const formData = new FormData();
      formData.append("full_name", fullName.trim());
      formData.append("phone", phone.trim());
      formData.append("cnic", cnic.trim());
      formData.append("email", targetLoginEmail);
      formData.append("emergency_contact", emergencyContact.trim());
      formData.append("unit_id", selectedUnitId);
      formData.append("monthly_rent", monthlyRent || "0");
      formData.append("rent_due_day", rentDueDay || "5");
      formData.append("security_amount", securityAmount || "0");
      formData.append("security_paid", securityPaid || "0");
      formData.append("move_in_date", leaseStartDate);
      formData.append("lease_start_date", leaseStartDate);
      formData.append("lease_end_date", leaseEndDate);

      // Electricity Utility Attachment
      formData.append("electricity_option", electricityOption);
      if (electricityOption === "OWN_METER") {
        formData.append("reference_number", referenceNumber.trim());
        formData.append("meter_number", meterNumber.trim());
      } else if (electricityOption === "SHARED_METER") {
        formData.append("shared_connection_id", sharedConnectionId);
        formData.append("split_type", splitType);
        formData.append("split_value", splitValue);
      }

      // Portal Credentials
      formData.append("create_portal_login", createPortalLogin ? "true" : "false");
      if (createPortalLogin) {
        formData.append("login_username", targetUsername);
        formData.append("login_email", targetLoginEmail);
        formData.append("login_password", finalPassword);
      }

      const res = await createTenantAction(formData);
      if (res.success) {
        router.refresh();
        if (createPortalLogin) {
          setCreatedSuccessData({
            tenantName: fullName.trim(),
            unitName: selectedUnit?.unit_name || `Space #${selectedUnitId}`,
            username: targetUsername,
            email: targetLoginEmail,
            password: finalPassword,
          });
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create tenant. Please verify unique username.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyCredentials() {
    if (!createdSuccessData) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const text = `🏢 Plaza Tenant Portal Login\nTenant: ${createdSuccessData.tenantName}\nSpace: ${createdSuccessData.unitName}\nPortal Link: ${origin}/login\nUsername: ${createdSuccessData.username}\nPassword: ${createdSuccessData.password}\n\nPlease keep your credentials safe and use them to log into your resident dashboard.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFinish() {
    router.refresh();
    onClose();
  }

  // ─── SUCCESS SCREEN MODAL ───
  if (createdSuccessData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-6 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-8 shadow-2xl space-y-6 text-[#17211D] animate-in fade-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="h-16 w-16 rounded-full bg-[#E3EFE8] border border-[#BCD8C7] text-[#2D5A43] flex items-center justify-center mx-auto shadow-xs">
              <Check size={32} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2D5A43] font-mono">
              ONBOARDING COMPLETE
            </p>
            <h3 className="text-2xl font-bold text-[#17211D]">
              Tenant Created Successfully!
            </h3>
            <p className="text-xs text-[#58655E]">
              {createdSuccessData.tenantName} · {createdSuccessData.unitName}
            </p>
          </div>

          {/* Credentials Card */}
          <div className="p-5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-[#17211D] pb-2 border-b border-[#CBD4BC]/60">
              <KeyRound size={16} className="text-[#2D5A43]" />
              <span>Tenant Portal Login Credentials</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC]">
                <span className="text-[#58655E]">Portal URL:</span>
                <span className="font-bold text-[#17211D]">/login</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC]">
                <span className="text-[#58655E]">Login Username:</span>
                <span className="font-bold text-[#17211D]">{createdSuccessData.username}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6F0] border border-[#CBD4BC]">
                <span className="text-[#58655E]">Password:</span>
                <span className="font-bold text-[#2D5A43]">{createdSuccessData.password}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="w-full py-3 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#24332D] transition shadow-xs cursor-pointer"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? "Credentials Copied to Clipboard!" : "Copy Login Credentials"}</span>
            </button>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-2.5 text-xs font-semibold text-[#58655E] hover:text-[#17211D] transition cursor-pointer text-center"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 sm:p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl sm:max-w-3xl rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] p-6 sm:p-10 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto text-[#17211D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FF704D] font-mono">
              OCCUPANCY ONBOARDING
            </p>
            <h3 className="text-2xl font-bold text-[#17211D] mt-0.5">
              Add New Tenant
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D] flex items-center justify-center transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-[#FAECE9] border border-[#EBC1BA] text-[#8E3E33] flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Selected Space Banner */}
        {selectedUnit && (
          <div className="p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#FAF6F0] border border-[#CBD4BC] flex items-center justify-center text-[#FF704D] shadow-xs">
                <Building2 size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#17211D]">{selectedUnit.unit_name}</p>
                <p className="text-xs text-[#58655E]">
                  {selectedUnit.floor} · Asking: {formatPKR(selectedUnit.default_monthly_rent)}/mo
                </p>
              </div>
            </div>
            {!initialFound && (
              <button
                type="button"
                onClick={() => setSelectedUnit(null)}
                className="text-[11px] font-bold text-[#FF704D] hover:underline px-3 py-1.5 rounded-lg bg-[#FAF6F0] border border-[#CBD4BC] cursor-pointer"
              >
                Change
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* ─── STEP 1: Tenant Information & Space Selection ─── */}
          {step === 1 && (
            <div className="space-y-5">
              {!selectedUnit && (
                <div>
                  <label className="font-semibold text-xs text-[#17211D] block mb-1">
                    Select Available Space *
                  </label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => handleSelectUnitId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D] shadow-xs cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Vacant Space --</option>
                    {unitsList.map((u) => (
                      <option key={u.id} value={u.id.toString()}>
                        {u.unit_name} ({u.floor}) - {formatPKR(u.default_monthly_rent)}/mo
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 1. Tenant Details */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 pb-1 border-b border-[#CBD4BC]/40">
                  <Users size={14} className="text-[#FF704D]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-[#17211D]">
                    1. Tenant Personal / Business Details
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-[#17211D] block mb-1">
                    Full Name / Business Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Ali Traders / Muhammad Ali"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#17211D] block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#17211D] block mb-1">
                      CNIC Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={cnic}
                      onChange={(e) => setCnic(e.target.value)}
                      placeholder="61101-1234567-1"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#17211D] block mb-1">
                      Contact Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="ali@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#17211D] block mb-1">
                      Emergency Contact (Optional)
                    </label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. Brother: 0321-9876543"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#17211D] block mb-1">
                    Move-in Date / Lease Start *
                  </label>
                  <input
                    type="date"
                    value={leaseStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#CBD4BC]/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#58655E] hover:text-[#17211D] transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!fullName.trim() || !phone.trim() || !selectedUnitId) {
                      setError("Please fill in tenant name, phone, and select space.");
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer"
                >
                  <span>Continue to Financial & Portal Access</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Lease, Utilities & Portal Access ─── */}
          {step === 2 && (
            <div className="space-y-6">
              {/* 2. Tenancy Lease Contract Duration */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-[#CBD4BC]/40">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#8FA66B]" />
                    <span className="font-bold text-xs uppercase tracking-wider text-[#17211D]">
                      2. Tenancy Lease Contract Duration
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#58655E]">Agreement Period</span>
                </div>

                {/* Duration Presets */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#58655E] block">
                    Contract Duration Preset
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "6 Months", months: 6 },
                      { label: "1 Year", months: 12 },
                      { label: "2 Years", months: 24 },
                      { label: "3 Years", months: 36 },
                    ].map((preset) => (
                      <button
                        key={preset.months}
                        type="button"
                        onClick={() => handleApplyDurationPreset(preset.months)}
                        className={`py-1.5 px-2 rounded-xl border text-[11px] font-mono font-semibold transition cursor-pointer text-center ${
                          selectedDurationMonths === preset.months
                            ? "bg-[#17211D] text-[#F4F7F2] border-[#17211D] shadow-2xs"
                            : "bg-[#FAF6F0] text-[#58655E] border-[#CBD4BC] hover:bg-[#E8EDD9]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#17211D] block mb-1">
                      Contract Start Date *
                    </label>
                    <input
                      type="date"
                      value={leaseStartDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#17211D] block mb-1">
                      Contract End Date *
                    </label>
                    <input
                      type="date"
                      value={leaseEndDate}
                      onChange={(e) => {
                        setLeaseEndDate(e.target.value);
                        setSelectedDurationMonths(null);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 3. Lease Financial Terms */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 pb-1 border-b border-[#CBD4BC]/40">
                  <Building2 size={14} className="text-[#FF704D]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-[#17211D]">
                    3. Rent & Security Terms
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#17211D] block mb-1">
                      Monthly Rent (PKR) *
                    </label>
                    <input
                      type="number"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      placeholder="30000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#17211D] block mb-1">
                      Rent Due Day of Month
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      value={rentDueDay}
                      onChange={(e) => setRentDueDay(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#17211D] block mb-1">
                      Security Deposit Required (PKR)
                    </label>
                    <input
                      type="number"
                      value={securityAmount}
                      onChange={(e) => setSecurityAmount(e.target.value)}
                      placeholder="50000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#17211D] block mb-1">
                      Security Paid Upfront (PKR)
                    </label>
                    <input
                      type="number"
                      value={securityPaid}
                      onChange={(e) => setSecurityPaid(e.target.value)}
                      placeholder="50000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Electricity Utility Assignment */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 pb-1 border-b border-[#CBD4BC]/40">
                  <Zap size={14} className="text-[#FF704D]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-[#17211D]">
                    3. Electricity Utility Connection
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "OWN_METER", label: "Own Meter" },
                    { id: "SHARED_METER", label: "Shared Meter" },
                    { id: "NO_METER", label: "No Meter" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setElectricityOption(opt.id as any)}
                      className={`py-2 rounded-xl border text-center text-xs font-semibold transition cursor-pointer ${
                        electricityOption === opt.id
                          ? "border-[#17211D] bg-[#17211D] text-[#F4F7F2]"
                          : "border-[#CBD4BC] bg-[#E8EDD9] text-[#58655E] hover:bg-[#DDE4CF]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {electricityOption === "OWN_METER" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC]">
                    <div>
                      <label className="font-semibold text-[#17211D] block mb-1">
                        IESCO 14-Digit Ref #
                      </label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="14 digits"
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#17211D] block mb-1">
                        Meter Serial #
                      </label>
                      <input
                        type="text"
                        value={meterNumber}
                        onChange={(e) => setMeterNumber(e.target.value)}
                        placeholder="Optional serial"
                        className="w-full px-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs focus:border-[#FF704D]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. TENANT PORTAL ACCESS */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC] space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#CBD4BC]/60 pb-3">
                  <div className="flex items-center gap-2">
                    <KeyRound size={16} className="text-[#2D5A43]" />
                    <div>
                      <span className="font-bold text-xs uppercase tracking-wider text-[#17211D] block">
                        4. Tenant Portal Access
                      </span>
                      <p className="text-[11px] text-[#58655E]">
                        Unique credentials for the resident portal
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createPortalLogin}
                      onChange={(e) => setCreatePortalLogin(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-[#CBD4BC] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2D5A43]"></div>
                  </label>
                </div>

                {createPortalLogin && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-[#17211D] block">
                          Portal Username *
                        </label>
                        <span className="text-[10px] text-[#58655E] font-mono">
                          Used to log in at /login
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={loginUsername || fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}
                          onChange={(e) => setLoginUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                          placeholder="e.g. ali or saif_g03"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                          required={createPortalLogin}
                          autoCapitalize="none"
                          autoCorrect="off"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-[#17211D]">
                          Portal Password *
                        </label>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2D5A43] hover:underline cursor-pointer"
                        >
                          <Sparkles size={12} />
                          <span>Generate Secure Password</span>
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter or generate password"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] font-mono text-xs text-[#17211D] focus:border-[#FF704D] shadow-2xs"
                          required={createPortalLogin}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#58655E] hover:text-[#17211D] cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#CBD4BC]/60">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-[#58655E] hover:text-[#17211D] transition cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Creating Tenant & Portal..." : "Create Tenant & Complete Onboarding"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
