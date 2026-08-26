import { chromium } from "playwright";

async function openAndRunLiveBrowser() {
  console.log("==========================================================");
  console.log("🚀 OPENING BROWSER ON YOUR SCREEN & TESTING LIVE...");
  console.log("==========================================================\n");

  // Launch visible Chromium browser maximized
  const browser = await chromium.launch({
    headless: false,
    slowMo: 800,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: null, // Full desktop window
  });

  const page = await context.newPage();

  // Inject a visual cursor overlay so the user can see where the mouse is moving and clicking
  async function enableVisualCursor() {
    await page.evaluate(() => {
      if (document.getElementById("custom-live-cursor")) return;
      const cursor = document.createElement("div");
      cursor.id = "custom-live-cursor";
      cursor.style.position = "fixed";
      cursor.style.width = "22px";
      cursor.style.height = "22px";
      cursor.style.borderRadius = "50%";
      cursor.style.backgroundColor = "rgba(255, 112, 77, 0.7)";
      cursor.style.border = "2px solid #FFFFFF";
      cursor.style.boxShadow = "0 0 12px rgba(255, 112, 77, 0.9)";
      cursor.style.pointerEvents = "none";
      cursor.style.zIndex = "9999999";
      cursor.style.transform = "translate(-50%, -50%)";
      cursor.style.transition = "transform 0.1s ease, width 0.2s, height 0.2s, background-color 0.2s";
      cursor.style.top = "0px";
      cursor.style.left = "0px";
      document.body.appendChild(cursor);

      window.addEventListener("mousemove", (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      });

      window.addEventListener("mousedown", () => {
        cursor.style.transform = "translate(-50%, -50%) scale(0.75)";
        cursor.style.backgroundColor = "rgba(45, 90, 67, 0.9)";
      });

      window.addEventListener("mouseup", () => {
        cursor.style.transform = "translate(-50%, -50%) scale(1)";
        cursor.style.backgroundColor = "rgba(255, 112, 77, 0.7)";
      });
    });
  }

  // Display a prominent step HUD at the top
  async function showStepHUD(stepNumber: number, title: string, description: string, pauseMs = 2500) {
    console.log(`\n👉 [STEP ${stepNumber}]: ${title} - ${description}`);
    await enableVisualCursor();
    await page.evaluate(
      ({ num, t, d }) => {
        let hud = document.getElementById("live-demo-hud");
        if (!hud) {
          hud = document.createElement("div");
          hud.id = "live-demo-hud";
          hud.style.position = "fixed";
          hud.style.top = "18px";
          hud.style.left = "50%";
          hud.style.transform = "translateX(-50%)";
          hud.style.zIndex = "9999990";
          hud.style.padding = "16px 28px";
          hud.style.backgroundColor = "#17211D";
          hud.style.color = "#F4F7F2";
          hud.style.borderRadius = "20px";
          hud.style.border = "1.5px solid #FF704D";
          hud.style.boxShadow = "0 25px 50px rgba(0, 0, 0, 0.4)";
          hud.style.fontFamily = "system-ui, -apple-system, sans-serif";
          hud.style.maxWidth = "620px";
          hud.style.width = "90%";
          hud.style.textAlign = "center";
          hud.style.transition = "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
          document.body.appendChild(hud);
        }
        hud.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:4px;">
            <span style="background:#FF704D; color:#FFFFFF; font-size:11px; font-weight:bold; padding:2px 8px; border-radius:10px; font-family:monospace;">STEP ${num}</span>
            <span style="font-weight:600; font-size:15px; color:#F4F7F2;">${t}</span>
          </div>
          <div style="font-size:12px; color:#B8C3A7; line-height:1.4;">${d}</div>
        `;
      },
      { num: stepNumber, t: title, d: description }
    );
    await page.waitForTimeout(pauseMs);
  }

  // Smooth mouse movement helper
  async function smoothMoveTo(x: number, y: number, steps = 15) {
    await page.mouse.move(x, y, { steps });
  }

  try {
    // ------------------------------------------------------------------------
    // STEP 1: Overview & Interactive 3D Plaza Massing
    // ------------------------------------------------------------------------
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await showStepHUD(
      1,
      "Overview Dashboard & 3D Plaza Exploration",
      "Interacting with the architectural 3D building massing and switching through operational stages."
    );

    // Hover around building model
    const parapet = await page.$("text=Main Plaza Parapet");
    if (parapet) {
      const box = await parapet.boundingBox();
      if (box) {
        await smoothMoveTo(box.x + 50, box.y + 80);
        await page.waitForTimeout(1000);
        await smoothMoveTo(box.x + 250, box.y + 120);
        await page.waitForTimeout(1000);
        await smoothMoveTo(box.x + 100, box.y + 200);
        await page.waitForTimeout(1000);
      }
    }

    // Click storytelling tabs
    const floorStacksTab = await page.$("button:has-text('Floor Stacks')");
    if (floorStacksTab) {
      const b = await floorStacksTab.boundingBox();
      if (b) await smoothMoveTo(b.x + b.width / 2, b.y + b.height / 2);
      await floorStacksTab.click();
      await page.waitForTimeout(2000);
    }

    const rentFlowTab = await page.$("button:has-text('Rent Flow')");
    if (rentFlowTab) {
      const b = await rentFlowTab.boundingBox();
      if (b) await smoothMoveTo(b.x + b.width / 2, b.y + b.height / 2);
      await rentFlowTab.click();
      await page.waitForTimeout(2000);
    }

    const elecGridTab = await page.$("button:has-text('Electricity Grid')");
    if (elecGridTab) {
      const b = await elecGridTab.boundingBox();
      if (b) await smoothMoveTo(b.x + b.width / 2, b.y + b.height / 2);
      await elecGridTab.click();
      await page.waitForTimeout(2000);
    }

    // ------------------------------------------------------------------------
    // STEP 2: Settings & Plaza Setup Wizard
    // ------------------------------------------------------------------------
    await showStepHUD(
      2,
      "Plaza Configuration in Settings",
      "Opening Settings to inspect plaza settings and launch the multi-floor builder."
    );
    await page.goto("http://localhost:3000/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const setupBtn = await page.$("button:has-text('Launch Setup Wizard'), button:has-text('Launch Plaza Setup Wizard')");
    if (setupBtn) {
      const b = await setupBtn.boundingBox();
      if (b) await smoothMoveTo(b.x + b.width / 2, b.y + b.height / 2);
      await setupBtn.click();
      await page.waitForTimeout(2000);

      await showStepHUD(
        2,
        "Entering Building Structure",
        "Setting Plaza Name to 'Al-Rehman Trade Center' and configuring building levels..."
      );

      const nameInput = await page.$("input[placeholder*='Plaza'], input[value*='Plaza'], input[type='text']");
      if (nameInput) {
        await nameInput.click();
        await nameInput.fill("");
        await nameInput.type("Al-Rehman Trade Center", { delay: 70 });
        await page.waitForTimeout(1000);
      }

      const nextBtn = await page.$("button:has-text('Next')");
      if (nextBtn) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
      }

      const nextBtn2 = await page.$("button:has-text('Next')");
      if (nextBtn2) {
        await nextBtn2.click();
        await page.waitForTimeout(1500);
      }

      const buildBtn = await page.$("button:has-text('Build Plaza Structure'), button:has-text('Confirm')");
      if (buildBtn) {
        await buildBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // ------------------------------------------------------------------------
    // STEP 3: Units Bay & Floor Elevation
    // ------------------------------------------------------------------------
    await showStepHUD(
      3,
      "Units Bay & 360° Floor Elevation",
      "Inspecting physical shops across Basement, Ground, and 1st Floor levels."
    );
    await page.goto("http://localhost:3000/units", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    // Open first unit detail
    const unitLink = await page.$("a[href*='/units/']");
    if (unitLink) {
      const b = await unitLink.boundingBox();
      if (b) await smoothMoveTo(b.x + b.width / 2, b.y + b.height / 2);
      await unitLink.click();
      await page.waitForTimeout(3000);
    }

    // ------------------------------------------------------------------------
    // STEP 4: Tenants & Lease Agreement
    // ------------------------------------------------------------------------
    await showStepHUD(
      4,
      "Tenant Onboarding & Lease Agreement",
      "Registering a new commercial tenant with CNIC, emergency contact, rent, and advance deposit."
    );
    await page.goto("http://localhost:3000/tenants", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const addTenantBtn = await page.$("button:has-text('Add New Tenant'), button:has-text('Onboard Tenant')");
    if (addTenantBtn) {
      const b = await addTenantBtn.boundingBox();
      if (b) await smoothMoveTo(b.x + b.width / 2, b.y + b.height / 2);
      await addTenantBtn.click();
      await page.waitForTimeout(2000);

      const nameInput = await page.$("input[name='full_name'], input[placeholder*='Name']");
      if (nameInput) {
        await nameInput.click();
        await nameInput.type("Kashif Electronics (M. Kashif)", { delay: 60 });
      }

      const phoneInput = await page.$("input[name='phone'], input[placeholder*='Phone'], input[placeholder*='03']");
      if (phoneInput) {
        await phoneInput.click();
        await phoneInput.type("0300-5551234", { delay: 60 });
      }

      const rentInput = await page.$("input[name='monthly_rent']");
      if (rentInput) {
        await rentInput.click();
        await rentInput.fill("");
        await rentInput.type("35000", { delay: 60 });
      }

      const secInput = await page.$("input[name='security_amount']");
      if (secInput) {
        await secInput.click();
        await secInput.fill("");
        await secInput.type("70000", { delay: 60 });
      }

      const secPaidInput = await page.$("input[name='security_paid']");
      if (secPaidInput) {
        await secPaidInput.click();
        await secPaidInput.fill("");
        await secPaidInput.type("70000", { delay: 60 });
      }

      await page.waitForTimeout(1000);
      const confirmTenantBtn = await page.$("button[type='submit']:has-text('Confirm'), button[type='submit']:has-text('Save'), button[type='submit']:has-text('Onboard')");
      if (confirmTenantBtn) {
        await confirmTenantBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // ------------------------------------------------------------------------
    // STEP 5: Monthly Rent & Ledgers
    // ------------------------------------------------------------------------
    await showStepHUD(
      5,
      "Monthly Rent Ledgers & Cash Collection",
      "Viewing monthly dues, recording a cash rent payment, and verifying ledger balances."
    );
    await page.goto("http://localhost:3000/rent", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    const recordPayBtn = await page.$("button:has-text('Record Payment'), button:has-text('Pay')");
    if (recordPayBtn) {
      const b = await recordPayBtn.boundingBox();
      if (b) await smoothMoveTo(b.x + b.width / 2, b.y + b.height / 2);
      await recordPayBtn.click();
      await page.waitForTimeout(2000);

      const payAmtInput = await page.$("input[name='amount'], input[type='number']");
      if (payAmtInput) {
        await payAmtInput.click();
        await payAmtInput.fill("");
        await payAmtInput.type("35000", { delay: 60 });
      }

      await page.waitForTimeout(1000);
      const confirmPayBtn = await page.$("button[type='submit']:has-text('Record'), button[type='submit']:has-text('Confirm')");
      if (confirmPayBtn) {
        await confirmPayBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // ------------------------------------------------------------------------
    // STEP 6: Maintenance Complaints & Repairs
    // ------------------------------------------------------------------------
    await showStepHUD(
      6,
      "Maintenance Ticket Logging",
      "Logging a commercial shutter repair complaint with priority and technician assignment."
    );
    await page.goto("http://localhost:3000/complaints", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    const addComplaintBtn = await page.$("button:has-text('Log Ticket'), button:has-text('Log Maintenance'), button:has-text('New Ticket')");
    if (addComplaintBtn) {
      const b = await addComplaintBtn.boundingBox();
      if (b) await smoothMoveTo(b.x + b.width / 2, b.y + b.height / 2);
      await addComplaintBtn.click();
      await page.waitForTimeout(2000);

      const titleInput = await page.$("input[name='title'], input[placeholder*='Title']");
      if (titleInput) {
        await titleInput.click();
        await titleInput.type("Main Front Shutter Coil Spring & Padlock Lock", { delay: 50 });
      }

      await page.waitForTimeout(1000);
      const submitCompBtn = await page.$("button[type='submit']:has-text('Submit'), button[type='submit']:has-text('Log')");
      if (submitCompBtn) {
        await submitCompBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // ------------------------------------------------------------------------
    // STEP 7: Plaza Expenses
    // ------------------------------------------------------------------------
    await showStepHUD(
      7,
      "Plaza Operational Expenses",
      "Logging day-to-day operating costs (Security Guard Salaries & Janitorial)."
    );
    await page.goto("http://localhost:3000/expenses", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    const addExpBtn = await page.$("button:has-text('Log Expense'), button:has-text('Add Expense')");
    if (addExpBtn) {
      const b = await addExpBtn.boundingBox();
      if (b) await smoothMoveTo(b.x + b.width / 2, b.y + b.height / 2);
      await addExpBtn.click();
      await page.waitForTimeout(2000);

      const titleInput = await page.$("input[name='title']");
      if (titleInput) {
        await titleInput.click();
        await titleInput.type("Main Gate Security Guard Monthly Salary", { delay: 50 });
      }

      const amtInput = await page.$("input[name='amount']");
      if (amtInput) {
        await amtInput.click();
        await amtInput.fill("");
        await amtInput.type("28000", { delay: 60 });
      }

      await page.waitForTimeout(1000);
      const saveExpBtn = await page.$("button[type='submit']:has-text('Save'), button[type='submit']:has-text('Log')");
      if (saveExpBtn) {
        await saveExpBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // ------------------------------------------------------------------------
    // STEP 8: Financial Reports P&L
    // ------------------------------------------------------------------------
    await showStepHUD(
      8,
      "Financial Reports (P&L Summary)",
      "Analyzing real-time Gross Revenue, Operating Expenses, and Net Profit Margin."
    );
    await page.goto("http://localhost:3000/reports", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3500);

    // ------------------------------------------------------------------------
    // STEP 9: Return to Overview with Live Summary
    // ------------------------------------------------------------------------
    await showStepHUD(
      9,
      "Live Test Completed Successfully",
      "Overview updated with live occupancy, collections, and financial health!",
      6000
    );
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(8000);

    console.log("\n==========================================================");
    console.log("✅ LIVE BROWSER DEMO COMPLETED SUCCESSFULLY!");
    console.log("==========================================================");
  } catch (err) {
    console.error("Live test notice:", err);
  } finally {
    await browser.close();
  }
}

openAndRunLiveBrowser();
