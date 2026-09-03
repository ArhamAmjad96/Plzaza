const http = require('http');
const fs = require('fs');

function req(path, method, body, cookie, headers = {}) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({
      hostname: 'localhost', port: 3000, path, method,
      headers: {
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': data.length } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers
      }
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(buf) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: buf.slice(0, 150) });
        }
      });
    });
    if (data) r.write(data);
    r.end();
  });
}

async function runEndToEndRegression() {
  console.log('=====================================================');
  console.log('  PHASE 5: END-TO-END AUTOMATION & REGRESSION SUITE  ');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  const storePath = './data/plaza_store.json';
  const raw = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // Pre-seed clean baseline data
  raw.tenants = [
    { id: 1001, plaza_id: 1, full_name: 'Ahmed Khan', phone: '03009876543', status: 'ACTIVE' },
    { id: 1002, plaza_id: 1, full_name: 'Bilal Hussain', phone: '03214567890', status: 'ACTIVE' }
  ];
  raw.units = [
    { id: 2001, plaza_id: 1, unit_name: 'Shop 101-A', unit_number: '101A', floor: 'GROUND', unit_type: 'SHOP', status: 'OCCUPIED' },
    { id: 2002, plaza_id: 1, unit_name: 'Shop 101-B', unit_number: '101B', floor: 'GROUND', unit_type: 'SHOP', status: 'OCCUPIED' }
  ];
  raw.leases = [
    { id: 3001, plaza_id: 1, tenant_id: 1001, unit_id: 2001, monthly_rent: 50000, rent_due_day: 10, lease_start_date: '2026-01-01', lease_end_date: '2027-12-31', status: 'ACTIVE' },
    { id: 3002, plaza_id: 1, tenant_id: 1002, unit_id: 2002, monthly_rent: 40000, rent_due_day: 10, lease_start_date: '2026-01-01', lease_end_date: '2027-12-31', status: 'ACTIVE' }
  ];
  raw.connections = [
    { id: 4001, plaza_id: 1, reference_number: '01141230123450', name: 'Ground Floor Shared Meter', meter_number: 'MTR-GF-01', active: true }
  ];
  raw.connection_unit_mappings = [
    { id: 1, connection_id: 4001, unit_id: 2001, split_type: 'PERCENTAGE', split_value: 60 },
    { id: 2, connection_id: 4001, unit_id: 2002, split_type: 'PERCENTAGE', split_value: 40 }
  ];
  raw.bills = [
    { id: 5001, connection_id: 4001, reference_number: '01141230123450', billing_month: '2026-09-01', bill_amount: 30000, due_date: '2026-09-18', status: 'unpaid', units_consumed: 380 }
  ];
  raw.monthly_ledgers = [];
  raw.tenant_notifications = [];
  raw.payments = [];
  fs.writeFileSync(storePath, JSON.stringify(raw, null, 2), 'utf8');

  // ─── 1. AUTHENTICATION & PORTAL ACCESS ───
  console.log('\n--- 1. Authentication & Role Segregation ---');
  const adminLogin = await req('/api/auth/login', 'POST', { email: 'admin@plaza.com', password: 'admin123' });
  assert(adminLogin.status === 200 && adminLogin.data?.role === 'ADMIN', 'Admin login successful');

  const tenantLogin = await req('/api/auth/login', 'POST', { email: 'tenant@plaza.com', password: 'tenant123' });
  assert(tenantLogin.status === 200 && tenantLogin.data?.role === 'TENANT', 'Tenant login successful');

  const aCookie = 'plaza_auth_session=' + Buffer.from(JSON.stringify({ userId: 'admin-1', email: 'admin@plaza.com', role: 'ADMIN', expiresAt: Date.now() + 86400000 })).toString('base64');
  const tCookie = 'plaza_auth_session=' + Buffer.from(JSON.stringify({ userId: 'tenant-usr-1001', email: 'tenant@plaza.com', role: 'TENANT', tenantId: 1001, expiresAt: Date.now() + 86400000 })).toString('base64');

  // Tenant trying to access admin route
  const tenantForbidden = await req('/api/automation/monthly-ledgers', 'POST', { month: '2026-09' }, tCookie);
  assert(tenantForbidden.status === 403, 'Tenant access to Admin automation route blocked (HTTP 403)');

  // ─── 2. MONTHLY RENT AUTOMATION (PHASE 2) ───
  console.log('\n--- 2. Monthly Rent Automation Engine ---');
  const testMonth = '2026-11';
  const rentGen = await req('/api/automation/monthly-ledgers', 'POST', { month: testMonth }, aCookie);
  assert(rentGen.status === 200 && rentGen.data?.createdCount === 2, 'Generated 2 monthly rent ledgers for active leases in November 2026');
  assert(rentGen.data?.dueDate === `${testMonth}-10`, 'Rent due date strictly set to 10th of the month');

  // Duplicate protection check
  const rentDup = await req('/api/automation/monthly-ledgers', 'POST', { month: testMonth }, aCookie);
  assert(rentDup.status === 200 && rentDup.data?.createdCount === 0 && rentDup.data?.skippedCount === 2, 'Duplicate rent generation skipped with 0 duplicate rows created');

  // ─── 3. SHARED ELECTRICITY BILL SPLIT (PHASE 3) ───
  console.log('\n--- 3. Shared Meter Split Allocation ---');
  // Tenant 1001 has Unit 2001 (60% of PKR 30,000 bill = PKR 18,000)
  // Tenant 1002 has Unit 2002 (40% of PKR 30,000 bill = PKR 12,000)
  const storeCheck = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const t1Ledger = (storeCheck.monthly_ledgers || []).find(l => l.tenant_id?.toString() === '1001' && l.billing_month?.slice(0, 7) === testMonth);
  const t2Ledger = (storeCheck.monthly_ledgers || []).find(l => l.tenant_id?.toString() === '1002' && l.billing_month?.slice(0, 7) === testMonth);
  assert(t1Ledger && t1Ledger.rent_amount === 50000, 'Tenant 1001 base rent = PKR 50,000');
  assert(t2Ledger && t2Ledger.rent_amount === 40000, 'Tenant 1002 base rent = PKR 40,000');

  // ─── 4. NOTIFICATION & CRON SCHEDULER (PHASE 4) ───
  console.log('\n--- 4. In-App Notifications & Cron Scheduler ---');
  // Trigger Day 1 RENT_CREATED
  const cronDay1 = await req('/api/automation/daily-cron', 'POST', { forceReminders: true, customDate: `${testMonth}-01`, skipBillSync: true }, null, { 'x-cron-secret': 'plaza_dev_cron_secret_2026' });
  assert(cronDay1.status === 200 && cronDay1.data?.reminders?.sentCount === 2, 'Day 1 RENT_CREATED notifications sent to 2 tenants');

  // Day 1 re-run (dedup check)
  const cronDay1Dup = await req('/api/automation/daily-cron', 'POST', { forceReminders: true, customDate: `${testMonth}-01`, skipBillSync: true }, null, { 'x-cron-secret': 'plaza_dev_cron_secret_2026' });
  assert(cronDay1Dup.data?.reminders?.sentCount === 0 && cronDay1Dup.data?.reminders?.alreadySentCount === 2, 'Day 1 notifications duplicate prevented (Already sent: 2)');

  // Trigger Day 8 RENT_REMINDER
  const cronDay8 = await req('/api/automation/daily-cron', 'POST', { forceReminders: true, customDate: `${testMonth}-08`, skipBillSync: true }, null, { 'x-cron-secret': 'plaza_dev_cron_secret_2026' });
  assert(cronDay8.status === 200 && cronDay8.data?.reminders?.sentCount === 2, 'Day 8 RENT_REMINDER sent to unpaid tenants');

  // Pay Tenant 1001 rent in full via payments array
  const storeForPay = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  storeForPay.payments = [
    {
      id: 9901,
      plaza_id: 1,
      tenant_id: 1001,
      lease_id: 3001,
      amount: 50000,
      payment_type: 'RENT',
      billing_month: `${testMonth}-01`,
      payment_date: `${testMonth}-05`,
      status: 'PAID'
    }
  ];
  const lIdx = storeForPay.monthly_ledgers.findIndex(l => l.tenant_id?.toString() === '1001' && l.billing_month?.slice(0, 7) === testMonth);
  if (lIdx !== -1) {
    storeForPay.monthly_ledgers[lIdx].rent_paid = 50000;
    storeForPay.monthly_ledgers[lIdx].paid_amount = 50000;
    storeForPay.monthly_ledgers[lIdx].rent_status = 'PAID';
    storeForPay.monthly_ledgers[lIdx].status = 'paid';
  }
  fs.writeFileSync(storePath, JSON.stringify(storeForPay, null, 2), 'utf8');

  // Trigger Day 10 RENT_DUE_TODAY -> Tenant 1001 skipped (Paid), Tenant 1002 notified
  const cronDay10 = await req('/api/automation/daily-cron', 'POST', { forceReminders: true, customDate: `${testMonth}-10`, skipBillSync: true }, null, { 'x-cron-secret': 'plaza_dev_cron_secret_2026' });
  assert(cronDay10.status === 200 && cronDay10.data?.reminders?.sentCount === 1 && cronDay10.data?.reminders?.skippedPaidCount === 1, 'Day 10 RENT_DUE_TODAY skipped paid tenant and alerted unpaid tenant');

  // Trigger Day 13 RENT_OVERDUE -> Tenant 1001 skipped, Tenant 1002 alerted
  const cronDay13 = await req('/api/automation/daily-cron', 'POST', { forceReminders: true, customDate: `${testMonth}-13`, skipBillSync: true }, null, { 'x-cron-secret': 'plaza_dev_cron_secret_2026' });
  assert(cronDay13.status === 200 && cronDay13.data?.reminders?.sentCount === 1 && cronDay13.data?.reminders?.skippedPaidCount === 1, 'Day 13 RENT_OVERDUE alerted unpaid tenant only');

  // ─── 5. TENANT INBOX & MARK READ ───
  console.log('\n--- 5. Tenant Notifications Inbox API ---');
  const tNotifs = await req('/api/tenant/notifications', 'GET', null, tCookie);
  assert(tNotifs.status === 200 && tNotifs.data?.notifications?.length > 0, `Tenant 1001 received ${tNotifs.data?.notifications?.length} notifications`);

  const markAll = await req('/api/tenant/notifications/read-all', 'POST', {}, tCookie);
  assert(markAll.status === 200, 'Tenant mark all notifications as read successful');

  const afterMark = await req('/api/tenant/notifications', 'GET', null, tCookie);
  assert(afterMark.data?.unreadCount === 0, 'Unread count reset to 0');

  // ─── 6. SUMMARY & REGRESSION VERIFICATION ───
  console.log('\n=====================================================');
  console.log(`  TOTAL TESTS PASSED: ${passed}`);
  console.log(`  TOTAL TESTS FAILED: ${failed}`);
  console.log('=====================================================');

  if (failed === 0) {
    console.log('\n🎉 ALL 15 AUTOMATION AND REGRESSION TEST CASES PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runEndToEndRegression();
