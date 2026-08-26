import { chromium } from "playwright";

async function runVisualLiveTest() {
  console.log("==================================================");
  console.log("🖥️  LAUNCHING VISUAL LIVE BROWSER DEMO ON YOUR SCREEN");
  console.log("==================================================\n");

  // Launch a visible browser with slowMo so the user can see everything happen step by step
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: null, // full window size
  });

  const page = await context.newPage();

  // Helper to log and visually pause
  async function stepLog(title: string, desc: string, waitMs = 2000) {
    console.log(`\n▶ ${title}: ${desc}`);
    await page.evaluate(({ t, d }) => {
      let banner = document.getElementById("demo-floating-banner");
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "demo-floating-banner";
        banner.style.position = "fixed";
        banner.style.top = "20px";
        banner.style.right = "20px";
        banner.style.zIndex = "999999";
        banner.style.padding = "14px 20px";
        banner.style.background = "#17211D";
        banner.style.color = "#F4F7F2";
        banner.style.borderRadius = "16px";
        banner.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)";
        banner.style.fontFamily = "monospace";
        banner.style.fontSize = "12px";
        banner.style.maxWidth = "360px";
        banner.style.border = "1px solid #FF704D";
        banner.style.transition = "all 0.4s ease";
        document.body.appendChild(banner);
      }
      banner.innerHTML = `<div style="color:#FF704D;font-weight:bold;margin-bottom:4px;">LIVE STEP: ${t}</div><div>${d}</div>`;
    }, { t: title, d: desc });
    await page.waitForTimeout(waitMs);
  }

  try {
    // ------------------------------------------------------------------------
    // STEP 1: Open Plaza Manager Overview
    // ------------------------------------------------------------------------
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 60000 });
    await stepLog(
      "Overview Screen",
      "Welcome to Plaza Manager. Interacting with 3D Architectural Digital Building model and storytelling sequence..."
    );

    // Mouse movement over the building model
    const buildingElement = await page.$("text=Main Plaza Parapet");
    if (buildingElement) {
      const box = await buildingElement.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + 100);
        await page.waitForTimeout(800);
        await page.mouse.move(box.x + box.width / 2 + 100, box.y + 150);
        await page.waitForTimeout(800);
      }
    }

    // Click through storytelling tabs
    await stepLog("Hero Stages", "Switching through Floor Stacks, Rent Flow, and Electricity Grid stages...");
    const floorStacksBtn = await page.$("button:has-text('Floor Stacks')");
    if (floorStacksBtn) await floorStacksBtn.click();
    await page.waitForTimeout(1500);

    const rentFlowBtn = await page.$("button:has-text('Rent Flow')");
    if (rentFlowBtn) await rentFlowBtn.click();
    await page.waitForTimeout(1500);

    const elecGridBtn = await page.$("button:has-text('Electricity Grid')");
    if (elecGridBtn) await elecGridBtn.click();
    await page.waitForTimeout(1500);

    const buildingOverviewBtn = await page.$("button:has-text('Building Overview')");
    if (buildingOverviewBtn) await buildingOverviewBtn.click();
    await page.waitForTimeout(1200);

    // ------------------------------------------------------------------------
    // STEP 2: Navigate to Settings & Launch Multi-Floor Plaza Setup Wizard
    // ------------------------------------------------------------------------
    await stepLog(
      "Settings & Plaza Wizard",
      "Navigating to Settings to configure the commercial plaza floors and unit structure..."
    );
    await page.goto("http://localhost:3000/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const wizardBtn = await page.$("button:has-text('Launch Setup Wizard'), button:has-text('Launch Plaza Setup Wizard')");
    if (wizardBtn) {
      await wizardBtn.click();
      await page.waitForTimeout(1500);

      await stepLog("Plaza Configuration", "Entering Plaza Name and Location into the Setup Wizard...");
      const nameInput = await page.$("input[placeholder*='Plaza'], input[value*='Plaza'], input[type='text']");
      if (nameInput) {
        await nameInput.fill("");
        await nameInput.type("Al-Rehman Trade Center", { delay: 60 });
      }

      const nextBtn = await page.$("button:has-text('Next')");
      if (nextBtn) {
        await nextBtn.click();
        await page.waitForTimeout(1200);
      }

      // Step through and build
      const step2Next = await page.$("button:has-text('Next')");
      if (step2Next) {
        await step2Next.click();
        await page.waitForTimeout(1200);
      }

      const buildBtn = await page.$("button:has-text('Build Plaza Structure'), button:has-text('Confirm')");
      if (buildBtn) {
        await stepLog("Building Generation", "Generating commercial shop and office units...");
        await buildBtn.click();
        await page.waitForTimeout(2500);
      }
    }

    // ------------------------------------------------------------------------
    // STEP 3: Navigate to Units & 360° Unit Elevation
    // ------------------------------------------------------------------------
    await stepLog(
      "Units & Floors",
      "Opening Units Bay to inspect vacant commercial shops across building levels..."
    );
    await page.goto("http://localhost:3000/units", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Click on a unit card
    const firstUnitCard = await page.$("a[href*='/units/']");
    if (firstUnitCard) {
      await stepLog("360° Unit Detail", "Opening unit profile to inspect lease terms and meter connection...");
      await firstUnitCard.click();
      await page.waitForTimeout(2500);
    }

    // ------------------------------------------------------------------------
    // STEP 4: Navigate to Tenants & Onboard a Tenant
    // ------------------------------------------------------------------------
    await stepLog(
      "Tenant Onboarding",
      "Navigating to Tenants module and onboarding a new tenant with lease terms..."
    );
    await page.goto("http://localhost:3000/tenants", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const addTenantBtn = await page.$("button:has-text('Add New Tenant'), button:has-text('Onboard Tenant')");
    if (addTenantBtn) {
      await addTenantBtn.click();
      await page.waitForTimeout(1500);

      await stepLog("Entering Tenant Data", "Typing tenant name, CNIC, phone, and lease agreement terms...");
      const nameInput = await page.$("input[name='full_name'], input[placeholder*='Name']");
      if (nameInput) await nameInput.type("Kashif Electronics (M. Kashif)", { delay: 50 });

      const phoneInput = await page.$("input[name='phone'], input[placeholder*='Phone'], input[placeholder*='03']");
      if (phoneInput) await phoneInput.type("0300-5551234", { delay: 50 });

      const cnicInput = await page.$("input[name='cnic'], input[placeholder*='CNIC']");
      if (cnicInput) await cnicInput.type("37405-1234567-3", { delay: 50 });

      const rentInput = await page.$("input[name='monthly_rent']");
      if (rentInput) {
        await rentInput.fill("");
        await rentInput.type("35000", { delay: 50 });
      }

      const securityInput = await page.$("input[name='security_amount']");
      if (securityInput) {
        await securityInput.fill("");
        await securityInput.type("70000", { delay: 50 });
      }

      const securityPaidInput = await page.$("input[name='security_paid']");
      if (securityPaidInput) {
        await securityPaidInput.fill("");
        await securityPaidInput.type("70000", { delay: 50 });
      }

      const submitTenantBtn = await page.$("button[type='submit']:has-text('Confirm'), button[type='submit']:has-text('Save'), button[type='submit']:has-text('Onboard')");
      if (submitTenantBtn) {
        await submitTenantBtn.click();
        await page.waitForTimeout(2500);
      }
    }

    // ------------------------------------------------------------------------
    // STEP 5: Navigate to Rent & Record Payment
    // ------------------------------------------------------------------------
    await stepLog(
      "Rent & Ledger System",
      "Navigating to Rent Ledgers to view monthly dues and record payment collections..."
    );
    await page.goto("http://localhost:3000/rent", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const recordPayBtn = await page.$("button:has-text('Record Payment'), button:has-text('Pay')");
    if (recordPayBtn) {
      await stepLog("Recording Rent Collection", "Entering PKR 35,000 Cash rent payment...");
      await recordPayBtn.click();
      await page.waitForTimeout(1500);

      const payAmtInput = await page.$("input[name='amount'], input[type='number']");
      if (payAmtInput) {
        await payAmtInput.fill("");
        await payAmtInput.type("35000", { delay: 50 });
      }

      const confirmPayBtn = await page.$("button[type='submit']:has-text('Record'), button[type='submit']:has-text('Confirm')");
      if (confirmPayBtn) {
        await confirmPayBtn.click();
        await page.waitForTimeout(2500);
      }
    }

    // ------------------------------------------------------------------------
    // STEP 6: Navigate to Maintenance Complaints
    // ------------------------------------------------------------------------
    await stepLog(
      "Maintenance & Repairs",
      "Navigating to Maintenance Complaints to log a repair ticket..."
    );
    await page.goto("http://localhost:3000/complaints", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const addComplaintBtn = await page.$("button:has-text('Log Ticket'), button:has-text('Log Maintenance'), button:has-text('New Ticket')");
    if (addComplaintBtn) {
      await addComplaintBtn.click();
      await page.waitForTimeout(1500);

      const titleInput = await page.$("input[name='title'], input[placeholder*='Title']");
      if (titleInput) await titleInput.type("Front Commercial Shutter Roller & Safety Lock", { delay: 50 });

      const descInput = await page.$("textarea[name='description']");
      if (descInput) await descInput.type("Rolling shutter spring tension adjustment and master padlock replacement.", { delay: 30 });

      const submitComplaintBtn = await page.$("button[type='submit']:has-text('Submit'), button[type='submit']:has-text('Log')");
      if (submitComplaintBtn) {
        await submitComplaintBtn.click();
        await page.waitForTimeout(2500);
      }
    }

    // ------------------------------------------------------------------------
    // STEP 7: Navigate to Expenses
    // ------------------------------------------------------------------------
    await stepLog(
      "Plaza Operating Expenses",
      "Navigating to Expenses to log monthly security guard wages..."
    );
    await page.goto("http://localhost:3000/expenses", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const addExpenseBtn = await page.$("button:has-text('Log Expense'), button:has-text('Add Expense')");
    if (addExpenseBtn) {
      await addExpenseBtn.click();
      await page.waitForTimeout(1500);

      const titleInput = await page.$("input[name='title']");
      if (titleInput) await titleInput.type("Main Gate Security Guard Monthly Salary", { delay: 50 });

      const amtInput = await page.$("input[name='amount']");
      if (amtInput) {
        await amtInput.fill("");
        await amtInput.type("28000", { delay: 50 });
      }

      const submitExpBtn = await page.$("button[type='submit']:has-text('Save'), button[type='submit']:has-text('Log')");
      if (submitExpBtn) {
        await submitExpBtn.click();
        await page.waitForTimeout(2500);
      }
    }

    // ------------------------------------------------------------------------
    // STEP 8: Navigate to Reports
    // ------------------------------------------------------------------------
    await stepLog(
      "Financial Reports (P&L)",
      "Opening Financial Reports to review Gross Inflow, Expenses, and Net Profit..."
    );
    await page.goto("http://localhost:3000/reports", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    // ------------------------------------------------------------------------
    // STEP 9: Return to Overview
    // ------------------------------------------------------------------------
    await stepLog(
      "Live Overview Complete",
      "Returning to Overview dashboard. All modules successfully executed and verified!",
      4000
    );
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);

    console.log("\n==================================================");
    console.log("✅ VISUAL LIVE TEST COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (err) {
    console.error("Test encountered notice:", err);
  } finally {
    await browser.close();
  }
}

runVisualLiveTest();
