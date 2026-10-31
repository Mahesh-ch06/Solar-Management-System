import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { db } from '../src/db/database.js';

let server;
let baseUrl;
let authToken = '';

function cleanupTestData() {
  db.prepare(`
    DELETE FROM customers 
    WHERE email LIKE '%@example.com' 
       OR name LIKE '%Auto Assigned%' 
       OR name LIKE '%Capacity Filler%' 
       OR name LIKE '%Waiting Queued%'
  `).run();
}

before(async () => {
  cleanupTestData();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  // Login as Admin to get auth token
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@sunpowersolutions.in',
      password: 'Password@123',
    }),
  });
  const data = await res.json();
  authToken = data.token;
});

after(async () => {
  cleanupTestData();
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('🤖 Smart Staff Assignment & Enquiry Queue Suite', () => {
  test('1. GET /api/v1/customers/queue/status - Checks staff capacity and queue metrics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/customers/queue/status`);
    const json = await res.json();

    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.ok(json.maxCapacityPerStaff >= 1);
    assert.ok(Array.isArray(json.staff));
    assert.ok(json.staff.length > 0);
    assert.ok(json.queue !== undefined);
  });

  test('2. POST /api/v1/customers (Public) - Guest can submit enquiry without auth and gets auto-assigned to not-busy staff', async () => {
    const res = await fetch(`${baseUrl}/api/v1/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Auto Assigned Customer A',
        phone: '9876543201',
        email: 'auto.a@example.com',
        address: 'Sector 45',
        city: 'Gurugram',
        pincode: '122003',
        monthlyBill: 5000,
        requiredCapacityKW: 4,
        systemType: 'ON_GRID',
        subsidyRequired: true,
        enquirySource: 'WEB_FORM',
      }),
    });

    const json = await res.json();
    assert.equal(res.status, 201);
    assert.equal(json.success, true);
    assert.ok(json.data.id.startsWith('cust-'));
    // Staff must be assigned since there are available consultants with 0 or low workload
    assert.ok(json.data.assignedTo && json.data.assignedTo !== 'UNASSIGNED');
    assert.equal(json.data.status, 'NEW');
    assert.match(json.message, /assigned to solar consultant/i);
  });

  test('3. Fill consultant capacity until all staff are busy, then new enquiry queues with appropriate message', async () => {
    // Check queue status
    const statusRes = await fetch(`${baseUrl}/api/v1/customers/queue/status`);
    const statusJson = await statusRes.json();
    const availableSlots = statusJson.staff.reduce((acc, s) => acc + s.availableSlots, 0);

    // Create leads to fill all available slots
    for (let i = 0; i < availableSlots; i++) {
      await fetch(`${baseUrl}/api/v1/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Capacity Filler Customer ${i + 1}`,
          phone: `98765000${String(i).padStart(2, '0')}`,
          email: `filler.${i}@example.com`,
          address: 'Main Street',
          city: 'Noida',
          pincode: '201301',
          monthlyBill: 4000,
          requiredCapacityKW: 3,
          systemType: 'ON_GRID',
          subsidyRequired: true,
          enquirySource: 'WEB_FORM',
        }),
      });
    }

    // Now all consultants must be busy!
    // Next customer enquiry MUST be placed in queue with appropriate waiting message
    const queueRes = await fetch(`${baseUrl}/api/v1/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Waiting Queued Customer',
        phone: '9999988888',
        email: 'waiting.customer@example.com',
        address: 'DLF Phase 2',
        city: 'Gurugram',
        pincode: '122002',
        monthlyBill: 8000,
        requiredCapacityKW: 6,
        systemType: 'ON_GRID',
        subsidyRequired: true,
        enquirySource: 'WEB_FORM',
      }),
    });

    const queueJson = await queueRes.json();
    assert.equal(queueRes.status, 201);
    assert.equal(queueJson.success, true);
    assert.equal(queueJson.isQueued, true);
    assert.equal(queueJson.assignedTo, 'UNASSIGNED');
    assert.equal(queueJson.data.status, 'QUEUED');
    assert.ok(queueJson.queuePosition >= 1);
    // Verifies appropriate friendly message displayed when no staff is available
    assert.match(queueJson.message, /consultants are currently engaged/i);
    assert.match(queueJson.message, /priority queue/i);
  });

  test('4. When a staff is released (lead CONVERTED or CLOSED_LOST), waiting queued enquiry is automatically assigned to them', async () => {
    // Find an active customer created during tests assigned to any staff member
    const activeLead = db.prepare(`
      SELECT id, name, assignedTo 
      FROM customers 
      WHERE email LIKE '%@example.com'
        AND status IN ('NEW', 'CONTACTED', 'SURVEY_SCHEDULED', 'QUOTATION_SENT') 
        AND assignedTo != 'UNASSIGNED' 
        AND assignedTo != '' 
      LIMIT 1
    `).get();

    assert.ok(activeLead, 'Must have at least one active lead to release');
    const releasedStaffName = activeLead.assignedTo;

    // Verify there is a queued lead waiting
    const waitingBefore = db.prepare(`
      SELECT id, name, status, assignedTo 
      FROM customers 
      WHERE status = 'QUEUED' 
      ORDER BY createdAt ASC 
      LIMIT 1
    `).get();
    assert.ok(waitingBefore, 'Must have a queued lead waiting');

    // Release the staff member by transitioning their active lead to CONVERTED
    const releaseRes = await fetch(`${baseUrl}/api/v1/customers/${activeLead.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: 'CONVERTED' }),
    });

    const releaseJson = await releaseRes.json();
    assert.equal(releaseRes.status, 200);
    assert.equal(releaseJson.success, true);
    assert.ok(Array.isArray(releaseJson.assignedFromQueue));
    assert.ok(releaseJson.assignedFromQueue.length >= 1);

    // The previously queued customer should now be assigned to the released staff member!
    const assignedEnquiry = releaseJson.assignedFromQueue.find((q) => q.customerId === waitingBefore.id);
    assert.ok(assignedEnquiry, 'The waiting queued enquiry was assigned upon staff release');
    assert.equal(assignedEnquiry.assignedTo, releasedStaffName);

    // Verify in database that customer status progressed to NEW
    const updatedCustomer = db.prepare('SELECT status, assignedTo FROM customers WHERE id = ?').get(waitingBefore.id);
    assert.equal(updatedCustomer.status, 'NEW');
    assert.equal(updatedCustomer.assignedTo, releasedStaffName);
  });
});
