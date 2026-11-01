import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { db } from '../src/db/database.js';

let server;
let baseUrl;
let authToken = '';

function cleanupSecurityTestData() {
  db.prepare(`
    DELETE FROM customers WHERE email LIKE '%@securitytest.com'
  `).run();
  db.prepare(`
    DELETE FROM inventory_items WHERE sku LIKE 'SEC-TEST-%'
  `).run();
  db.prepare(`
    DELETE FROM surveys WHERE id LIKE 'surv-sec-%'
  `).run();
  db.prepare(`
    DELETE FROM quotations WHERE id LIKE 'quote-sec-%'
  `).run();
}

before(async () => {
  cleanupSecurityTestData();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  // Login as admin to get bearer token for protected resource tests
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
  cleanupSecurityTestData();
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('🛡️ Security & Input Validation Hardening Test Suite', () => {
  describe('1. HTTP Security Headers & Information Disclosure', () => {
    test('X-Powered-By header is removed to prevent framework fingerprinting', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bad@test.com', password: 'bad' }),
      });
      assert.equal(res.headers.get('x-powered-by'), null);
    });

    test('Defensive HTTP security headers are applied to responses', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customers`);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
      assert.equal(res.headers.get('x-xss-protection'), '1; mode=block');
      assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    });
  });

  describe('2. Authentication Endpoint Hardening', () => {
    test('POST /api/v1/auth/login rejects malformed emails with 400', async () => {
      const invalidEmails = ['invalid-email', 'plainaddress', '@missingusername.com', 'user@domain'];
      for (const email of invalidEmails) {
        const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'Password@123' }),
        });
        const data = await res.json();
        assert.equal(res.status, 400);
        assert.equal(data.success, false);
        assert.match(data.error, /gmail/i);
      }
    });

    test('POST /api/v1/auth/login rejects non-gmail domains like nikhil@abc.com with 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nikhil@abc.com', password: 'Password@123' }),
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.match(data.error, /gmail\.com/i);
    });

    test('POST /api/v1/auth/login rejects excessively long passwords (>128 chars anti-DoS)', async () => {
      const oversizedPassword = 'A'.repeat(129);
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@sunpowersolutions.in',
          password: oversizedPassword,
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.match(data.error, /128 characters/i);
    });

    test('POST /api/v1/auth/login successfully sanitizes trimmed and uppercase email', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '   ADMIN@sunpowersolutions.in  ',
          password: 'Password@123',
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(data.token);
    });

    test('POST /api/v1/auth/register rejects invalid email and short phone numbers', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Security Test User',
          email: 'not-valid',
          password: 'Password@123',
          phone: '12345',
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.success, false);
    });
  });

  describe('3. Customer Module Input Validation & Sanitization', () => {
    test('POST /api/v1/customers rejects invalid email format', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: 'Invalid Email Customer',
          phone: '9876543210',
          email: 'nikhil@abc.com',
          address: '123 Solar Street',
          city: 'Delhi',
          pincode: '110001',
          monthlyBill: 3000,
          requiredCapacityKW: 3,
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.match(data.error, /gmail/i);
    });

    test('POST /api/v1/customers rejects invalid phone (< 10 digits)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: 'Invalid Phone Customer',
          phone: '98765',
          email: 'valid@securitytest.com',
          address: '123 Solar Street',
          city: 'Delhi',
          pincode: '110001',
          monthlyBill: 3000,
          requiredCapacityKW: 3,
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.match(data.error, /10 digits/i);
    });

    test('POST /api/v1/customers rejects negative monthly bill or out-of-range capacity', async () => {
      // Negative monthly bill
      const res1 = await fetch(`${baseUrl}/api/v1/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: 'Negative Bill Customer',
          phone: '9876543210',
          email: 'bill@securitytest.com',
          address: '123 Solar Street',
          city: 'Delhi',
          pincode: '110001',
          monthlyBill: -500,
          requiredCapacityKW: 3,
        }),
      });
      const data1 = await res1.json();
      assert.equal(res1.status, 400);
      assert.match(data1.error, /(non-negative|cannot be negative)/i);

      // Out of range capacity (0 or 600 kW)
      const res2 = await fetch(`${baseUrl}/api/v1/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: 'Excessive kW Customer',
          phone: '9876543210',
          email: 'capacity@securitytest.com',
          address: '123 Solar Street',
          city: 'Delhi',
          pincode: '110001',
          monthlyBill: 3000,
          requiredCapacityKW: 999,
        }),
      });
      const data2 = await res2.json();
      assert.equal(res2.status, 400);
      assert.match(data2.error, /capacity/i);
    });
  });

  describe('4. Inventory Stock & Price Validation', () => {
    test('POST /api/v1/inventory rejects negative stock or pricing', async () => {
      const res = await fetch(`${baseUrl}/api/v1/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          sku: 'SEC-TEST-NEG-1',
          name: 'Security Test Panel',
          brand: 'Adani',
          category: 'PANEL',
          currentStock: -10,
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.match(data.error, /cannot be negative/i);
    });
  });

  describe('5. Technical Survey Measurements Validation', () => {
    test('POST /api/v1/surveys rejects shadow-free area exceeding total roof area', async () => {
      // First get a valid customer
      const custRes = await fetch(`${baseUrl}/api/v1/customers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const custData = await custRes.json();
      const validCustomerId = custData.data[0].id;

      const res = await fetch(`${baseUrl}/api/v1/surveys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          id: 'surv-sec-01',
          customerId: validCustomerId,
          roofAreaSqFt: 500,
          shadowFreeAreaSqFt: 800, // Invalid: exceeds 500
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.match(data.error, /exceed total roof area/i);
    });
  });

  describe('6. Quotation Capacity Validation', () => {
    test('POST /api/v1/quotations rejects non-positive solar capacity', async () => {
      const custRes = await fetch(`${baseUrl}/api/v1/customers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const custData = await custRes.json();
      const validCustomerId = custData.data[0].id;

      const res = await fetch(`${baseUrl}/api/v1/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          id: 'quote-sec-01',
          customerId: validCustomerId,
          capacityKW: -5,
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.match(data.error, /greater than 0/i);
    });
  });
});
