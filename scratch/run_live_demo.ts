import {
  resetAllPlazaData,
  bulkConfigurePlazaUnits,
  getAllUnits,
  getPrimaryPlaza,
} from "../lib/units/service";
import { createTenantWithLease, getTenantsWithLeases } from "../lib/tenants/service";
import { createGeneralExpense, getPlazaExpenses } from "../lib/expenses/service";
import { createComplaint, getAllComplaints } from "../lib/complaints/service";
import { addComplaintExpense } from "../lib/complaints/expenses-service";
import { getMonthlyLedgers } from "../lib/ledgers/service";
import { supabase } from "../lib/supabase/server";

async function runLiveStepByStepDemo() {
  console.log("=================================================");
  console.log("🚀 STARTING STEP-BY-STEP LIVE PLAZA WORKFLOW");
  console.log("=================================================\n");

  // --------------------------------------------------------------------------
  // STEP 1: Reset and Configure a Fresh Commercial Plaza
  // --------------------------------------------------------------------------
  console.log("📍 STEP 1: Setting up New Commercial Plaza...");
  await resetAllPlazaData({
    name: "Al-Rehman Trade Center",
    address: "G-11 Markaz, Islamabad",
    floors: ["Basement", "Ground Floor", "1st Floor"],
  });

  const unitsToBuild = [
    // Basement Shops
    { unit_number: "B-01", unit_name: "Basement Shop B-01", unit_type: "SHOP" as const, floor: "Basement", default_monthly_rent: 25000, default_security_amount: 50000, default_rent_due_day: 5 },
    { unit_number: "B-02", unit_name: "Basement Shop B-02", unit_type: "SHOP" as const, floor: "Basement", default_monthly_rent: 25000, default_security_amount: 50000, default_rent_due_day: 5 },
    { unit_number: "B-03", unit_name: "Basement Shop B-03", unit_type: "SHOP" as const, floor: "Basement", default_monthly_rent: 25000, default_security_amount: 50000, default_rent_due_day: 5 },

    // Ground Floor Prime Shops
    { unit_number: "G-01", unit_name: "Ground Shop G-01", unit_type: "SHOP" as const, floor: "Ground Floor", default_monthly_rent: 35000, default_security_amount: 70000, default_rent_due_day: 5 },
    { unit_number: "G-02", unit_name: "Ground Shop G-02", unit_type: "SHOP" as const, floor: "Ground Floor", default_monthly_rent: 35000, default_security_amount: 70000, default_rent_due_day: 5 },
    { unit_number: "G-03", unit_name: "Ground Shop G-03", unit_type: "SHOP" as const, floor: "Ground Floor", default_monthly_rent: 35000, default_security_amount: 70000, default_rent_due_day: 5 },

    // 1st Floor Offices
    { unit_number: "F1-01", unit_name: "1st Floor Office F1-01", unit_type: "SHOP" as const, floor: "1st Floor", default_monthly_rent: 28000, default_security_amount: 55000, default_rent_due_day: 5 },
    { unit_number: "F1-02", unit_name: "1st Floor Office F1-02", unit_type: "SHOP" as const, floor: "1st Floor", default_monthly_rent: 28000, default_security_amount: 55000, default_rent_due_day: 5 },
    { unit_number: "F1-03", unit_name: "1st Floor Office F1-03", unit_type: "SHOP" as const, floor: "1st Floor", default_monthly_rent: 28000, default_security_amount: 55000, default_rent_due_day: 5 },
  ];

  await bulkConfigurePlazaUnits(unitsToBuild, false);
  const { units, plaza } = await getAllUnits();
  console.log(`✓ Plaza Created: "${plaza.name}" located at "${plaza.address}"`);
  console.log(`✓ Generated ${units.length} clean, vacant commercial units across [${plaza.floors?.join(", ")}]\n`);

  // --------------------------------------------------------------------------
  // STEP 2: Onboard Real Tenants with Leases & Security Deposits
  // --------------------------------------------------------------------------
  console.log("📍 STEP 2: Onboarding Tenants and Creating Leases...");
  const unitG01 = units.find((u) => u.unit_number === "G-01") || units[3];
  const unitG02 = units.find((u) => u.unit_number === "G-02") || units[4];
  const unitB01 = units.find((u) => u.unit_number === "B-01") || units[0];

  // Tenant 1: Kashif Electronics in G-01
  const t1 = await createTenantWithLease({
    fullName: "Kashif Electronics (M. Kashif)",
    phone: "0300-5551234",
    cnic: "37405-1234567-3",
    emergencyContact: "0321-9988776",
    unitId: unitG01.id,
    monthlyRent: 35000,
    rentDueDay: 5,
    securityAmount: 70000,
    securityPaid: 70000,
    annualIncreasePct: 10,
    notes: "Main corner electronics retail store",
  });
  console.log(`✓ Onboarded: "${t1.tenant.full_name}" -> Assigned to Unit ${unitG01.unit_number} (Rent: PKR 35,000/mo, Security: PKR 70,000 Paid)`);

  // Tenant 2: Ahmed Pharmacy in G-02
  const t2 = await createTenantWithLease({
    fullName: "Ahmed Pharmacy & Healthcare",
    phone: "0333-8884321",
    cnic: "37405-7654321-9",
    emergencyContact: "0300-1122334",
    unitId: unitG02.id,
    monthlyRent: 35000,
    rentDueDay: 5,
    securityAmount: 70000,
    securityPaid: 70000,
    annualIncreasePct: 10,
    notes: "24/7 retail pharmacy store",
  });
  console.log(`✓ Onboarded: "${t2.tenant.full_name}" -> Assigned to Unit ${unitG02.unit_number} (Rent: PKR 35,000/mo, Security: PKR 70,000 Paid)`);

  // Tenant 3: Royal Logistics in B-01
  const t3 = await createTenantWithLease({
    fullName: "Royal Cargo & Logistics",
    phone: "0312-4447890",
    cnic: "37405-9988776-5",
    emergencyContact: "0345-6677889",
    unitId: unitB01.id,
    monthlyRent: 25000,
    rentDueDay: 5,
    securityAmount: 50000,
    securityPaid: 50000,
    annualIncreasePct: 10,
    notes: "Basement warehouse & distribution hub",
  });
  console.log(`✓ Onboarded: "${t3.tenant.full_name}" -> Assigned to Unit ${unitB01.unit_number} (Rent: PKR 25,000/mo, Security: PKR 50,000 Paid)\n`);

  // --------------------------------------------------------------------------
  // STEP 3: Setup Electricity Infrastructure & Meter Mappings
  // --------------------------------------------------------------------------
  console.log("📍 STEP 3: Registering Electricity Infrastructure & Meters...");
  
  // Meter 1: Dedicated for G-01
  try {
    const { data: conn1 } = await supabase.from("connections").insert({
      name: "Shop G-01 Prime Meter",
      tenant: "Kashif Electronics",
      reference_number: "04141123456781",
      meter_number: "MTR-G01-KASHIF",
      active: true,
    }).select().maybeSingle();

    if (conn1) {
      await supabase.from("connection_unit_mappings").insert({
        connection_id: conn1.id,
        unit_id: unitG01.id,
        split_type: "PERCENTAGE",
        split_value: 100,
        notes: "Dedicated 100% meter for G-01",
      });

      // Add a simulated current month bill
      await supabase.from("bills").insert({
        connection_id: conn1.id,
        billing_month: new Date().toISOString().slice(0, 7) + "-01",
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
        bill_amount: 8450,
        units_consumed: 215,
        status: "unpaid",
      });
      console.log(`✓ Registered Dedicated Meter: Ref 04141123456781 (MTR-G01-KASHIF) -> Mapped 100% to ${unitG01.unit_number} (Bill: PKR 8,450)`);
    }
  } catch {}

  // Meter 2: Shared for Basement Shops B-01 & B-02
  const unitB02 = units.find((u) => u.unit_number === "B-02") || units[1];
  try {
    const { data: conn2 } = await supabase.from("connections").insert({
      name: "Basement Shared Commercial Meter",
      tenant: "Basement Shared Hub",
      reference_number: "04141123456782",
      meter_number: "MTR-BSMT-SHARED",
      active: true,
    }).select().maybeSingle();

    if (conn2) {
      await supabase.from("connection_unit_mappings").insert([
        { connection_id: conn2.id, unit_id: unitB01.id, split_type: "PERCENTAGE", split_value: 50, notes: "50% share B-01" },
        { connection_id: conn2.id, unit_id: unitB02.id, split_type: "PERCENTAGE", split_value: 50, notes: "50% share B-02" },
      ]);

      await supabase.from("bills").insert({
        connection_id: conn2.id,
        billing_month: new Date().toISOString().slice(0, 7) + "-01",
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
        bill_amount: 11200,
        units_consumed: 340,
        status: "unpaid",
      });
      console.log(`✓ Registered Shared Sub-Meter: Ref 04141123456782 (MTR-BSMT-SHARED) -> Split 50/50 between ${unitB01.unit_number} & ${unitB02.unit_number} (Bill: PKR 11,200)\n`);
    }
  } catch {}

  // --------------------------------------------------------------------------
  // STEP 4: Record Payments in Monthly Rent Ledgers
  // --------------------------------------------------------------------------
  console.log("📍 STEP 4: Recording Rent Collections & Financial Receipts...");
  // Tenant 1 pays Full Rent (PKR 35,000)
  try {
    await supabase.from("payments").insert({
      tenant_id: t1.tenant.id,
      lease_id: t1.lease.id,
      amount: 35000,
      payment_type: "RENT",
      payment_method: "Cash",
      payment_date: new Date().toISOString().slice(0, 10),
      notes: "Monthly rent for Ground Shop G-01",
    });
    console.log(`✓ Payment Recorded: PKR 35,000 received from Kashif Electronics (Cash - Full Rent Settled)`);
  } catch {}

  // Tenant 3 pays Partial Rent (PKR 15,000 of PKR 25,000)
  try {
    await supabase.from("payments").insert({
      tenant_id: t3.tenant.id,
      lease_id: t3.lease.id,
      amount: 15000,
      payment_type: "RENT",
      payment_method: "Bank Transfer",
      payment_date: new Date().toISOString().slice(0, 10),
      notes: "Partial rent payment for Basement Shop B-01",
    });
    console.log(`✓ Payment Recorded: PKR 15,000 received from Royal Cargo (Bank Transfer - PKR 10,000 remaining)\n`);
  } catch {}

  // --------------------------------------------------------------------------
  // STEP 5: Log Maintenance Complaint & Repair Expense
  // --------------------------------------------------------------------------
  console.log("📍 STEP 5: Logging Maintenance Complaint & Repair Costs...");
  const complaint = await createComplaint({
    unitId: unitG01.id,
    tenantId: t1.tenant.id,
    category: "Door / Lock",
    title: "Front Commercial Shutter Roller & Safety Lock Replacement",
    description: "Main rolling shutter spring jammed and padlock hasp needs replacement.",
    priority: "HIGH",
    assignedTo: "Shutter Specialist Tariq",
  });
  console.log(`✓ Complaint Logged: #${complaint.complaint_number} "${complaint.title}" (Priority: HIGH, Assigned to: Tariq)`);

  await addComplaintExpense({
    complaintId: complaint.id,
    expenseType: "MATERIAL",
    description: "Heavy duty steel coil spring & brass master lock set",
    amount: 3500,
    vendorName: "Madina Hardware & Steel",
    paymentMethod: "Cash",
  });
  await addComplaintExpense({
    complaintId: complaint.id,
    expenseType: "LABOUR",
    description: "Shutter technician installation labour",
    amount: 1500,
    vendorName: "Technician Tariq",
    paymentMethod: "Cash",
  });
  console.log(`✓ Logged Repair Expenses: PKR 3,500 (Material) + PKR 1,500 (Labour) -> Total Repair Cost: PKR 5,000\n`);

  // --------------------------------------------------------------------------
  // STEP 6: Record Plaza Operational Expenses
  // --------------------------------------------------------------------------
  console.log("📍 STEP 6: Recording General Plaza Operational Expenses...");
  const e1 = await createGeneralExpense({
    category: "Security Guard Salary",
    title: "Main Gate Security Guard Monthly Salary (Day & Night Shift)",
    amount: 28000,
    paymentMethod: "Cash",
    paidTo: "Guard Muhammad Bilal",
    isRecurring: true,
  });
  console.log(`✓ Expense Logged: Voucher ${e1.receipt_voucher_no} - "${e1.title}" (PKR 28,000)`);

  const e2 = await createGeneralExpense({
    category: "Janitorial / Sweeper / Cleaning",
    title: "Plaza Corridors, Stairs & Washrooms Cleaning Supplies & Wages",
    amount: 12000,
    paymentMethod: "Cash",
    paidTo: "Sweeper Rafiq",
    isRecurring: true,
  });
  console.log(`✓ Expense Logged: Voucher ${e2.receipt_voucher_no} - "${e2.title}" (PKR 12,000)\n`);

  // --------------------------------------------------------------------------
  // STEP 7: Verify Financial Summary
  // --------------------------------------------------------------------------
  console.log("📍 STEP 7: Calculating Live Financial Summary & P&L...");
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { stats: ledgerStats } = await getMonthlyLedgers(currentMonth);
  const { stats: expenseStats } = await getPlazaExpenses(currentMonth);
  const { stats: tenantStats } = await getTenantsWithLeases();
  const { stats: complaintStats } = await getAllComplaints();

  console.log("-------------------------------------------------");
  console.log(`📊 LIVE DASHBOARD METRICS FOR "${plaza.name}":`);
  console.log(`• Occupancy: ${tenantStats.activeTenants} of ${units.length} Units Occupied (${Math.round((tenantStats.activeTenants / units.length) * 100)}%)`);
  console.log(`• Total Rent Expected: PKR ${ledgerStats.total_expected.toLocaleString()}`);
  console.log(`• Total Rent Collected: PKR ${ledgerStats.total_collected.toLocaleString()}`);
  console.log(`• Outstanding Rent Pending: PKR ${ledgerStats.total_outstanding.toLocaleString()}`);
  console.log(`• Security Deposit Held in Escrow: PKR ${tenantStats.totalSecurityHeld.toLocaleString()}`);
  console.log(`• Total Plaza Operating Expenses: PKR ${expenseStats.totalExpenses.toLocaleString()}`);
  console.log(`• Net Cash Flow Profit: PKR ${(ledgerStats.total_collected - expenseStats.totalExpenses).toLocaleString()}`);
  console.log(`• Open Maintenance Complaints: ${complaintStats.openCount + complaintStats.inProgressCount + complaintStats.assignedCount}`);
  console.log("-------------------------------------------------");
  console.log("🎉 LIVE STEP-BY-STEP WORKFLOW COMPLETED SUCCESSFULLY!");
  console.log("=================================================");
}

runLiveStepByStepDemo().catch(console.error);
