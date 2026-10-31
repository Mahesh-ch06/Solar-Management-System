import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let baseUrl;
let authToken = '';
let testCustomerId = '';
let testSurveyId = '';
let testQuotationId = '';
let testOrderId = '';

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  // Login to acquire Bearer token
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
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('👤 Member 2: CRM Leads & Customer Pipeline Tests', () => {
  test('GET /api/v1/customers - Fetch list of customer leads', async () => {
    const res = await fetch(`${baseUrl}/api/v1/customers`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.length > 0);
  });

  test('GET /api/v1/customers - Query filtering by search term', async () => {
    const res = await fetch(`${baseUrl}/api/v1/customers?search=Malhotra`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.length, 1);
    assert.ok(data.data[0].name.includes('Malhotra'));
  });

  test('POST /api/v1/customers - Create new prospective customer lead', async () => {
    const res = await fetch(`${baseUrl}/api/v1/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Aarav Deshpande',
        phone: '9820123456',
        email: 'aarav.d@gmail.com',
        address: 'B-104, Model Colony',
        city: 'Pune',
        pincode: '411016',
        monthlyBill: 6000,
        requiredCapacityKW: 5,
        systemType: 'ON_GRID',
        subsidyRequired: true,
        enquirySource: 'WEB_FORM',
        notes: 'Interested in PM Surya Ghar scheme',
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.id.startsWith('cust-'));
    assert.equal(data.data.status, 'NEW');
    testCustomerId = data.data.id;
  });

  test('GET /api/v1/customers/:id - Retrieve single customer with profile', async () => {
    const res = await fetch(`${baseUrl}/api/v1/customers/${testCustomerId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.name, 'Aarav Deshpande');
    assert.ok(Array.isArray(data.data.surveys));
    assert.ok(Array.isArray(data.data.quotations));
    assert.ok(Array.isArray(data.data.orders));
  });

  test('PUT /api/v1/customers/:id - Update lead details', async () => {
    const res = await fetch(`${baseUrl}/api/v1/customers/${testCustomerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        notes: 'Consultation callback completed. Ready for technical audit.',
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.notes.includes('Ready for technical audit'));
  });

  test('PATCH /api/v1/customers/:id/status - Progress pipeline status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/customers/${testCustomerId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: 'CONTACTED' }),
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.status, 'CONTACTED');
  });
});

describe('👤 Member 2: Rooftop Technical Feasibility Audits', () => {
  test('POST /api/v1/surveys - Record survey and auto-transition customer status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/surveys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        customerId: testCustomerId,
        surveyDate: '2026-11-01',
        roofAreaSqFt: 1000,
        shadowFreeAreaSqFt: 850,
        roofType: 'RCC_FLAT',
        roofTiltAngle: 15,
        roofAzimuth: 'SOUTH',
        cableRunLengthMeters: 25,
        electricalConnection: 'THREE_PHASE',
        sanctionedLoadKW: 8,
        remarks: 'Unobstructed rooftop with optimal south orientation.',
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.id.startsWith('surv-'));
    assert.equal(data.data.feasibilityStatus, 'PENDING');
    testSurveyId = data.data.id;

    // Verify customer moved to SURVEY_SCHEDULED
    const custRes = await fetch(`${baseUrl}/api/v1/customers/${testCustomerId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const custData = await custRes.json();
    assert.equal(custData.data.status, 'SURVEY_SCHEDULED');
  });

  test('GET /api/v1/surveys - List all technical surveys', async () => {
    const res = await fetch(`${baseUrl}/api/v1/surveys`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.length > 0);
  });

  test('GET /api/v1/surveys/customer/:customerId - Fetch surveys by customer', async () => {
    const res = await fetch(`${baseUrl}/api/v1/surveys/customer/${testCustomerId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.length, 1);
    assert.equal(data.data[0].id, testSurveyId);
  });

  test('PATCH /api/v1/surveys/:id/feasibility - Feasibility sign-off approval', async () => {
    const res = await fetch(`${baseUrl}/api/v1/surveys/${testSurveyId}/feasibility`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        feasibilityStatus: 'APPROVED',
        remarks: 'Structural and electrical load suitability confirmed.',
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.feasibilityStatus, 'APPROVED');
  });
});

describe('👤 Member 2: Automated Solar BOM, Quotations & Orders', () => {
  test('POST /api/v1/quotations - Generate quotation with automated BOM & PM Surya Ghar subsidy', async () => {
    const res = await fetch(`${baseUrl}/api/v1/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        customerId: testCustomerId,
        capacityKW: 5,
        systemType: 'ON_GRID',
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.id.startsWith('quote-'));
    assert.ok(data.data.quotationNumber.startsWith('QT-2026-'));
    assert.ok(data.data.bomLines.length >= 6);
    assert.equal(data.data.subsidyAmount, 78000);
    assert.ok(data.data.totalAmount > 0);
    testQuotationId = data.data.id;

    // Verify customer transitioned to QUOTATION_SENT
    const custRes = await fetch(`${baseUrl}/api/v1/customers/${testCustomerId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const custData = await custRes.json();
    assert.equal(custData.data.status, 'QUOTATION_SENT');
  });

  test('GET /api/v1/quotations - List all generated quotations', async () => {
    const res = await fetch(`${baseUrl}/api/v1/quotations`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.length > 0);
  });

  test('GET /api/v1/quotations/:id - Single quotation with parsed BOM lines', async () => {
    const res = await fetch(`${baseUrl}/api/v1/quotations/${testQuotationId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.id, testQuotationId);
    assert.ok(Array.isArray(data.data.bomLines));
  });

  test('POST /api/v1/quotations/:id/confirm-order - Customer accepts quote -> Creates Confirmed Order', async () => {
    const res = await fetch(`${baseUrl}/api/v1/quotations/${testQuotationId}/confirm-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ advanceReceived: 50000 }),
    });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.order.id.startsWith('ord-'));
    assert.equal(data.order.advanceReceived, 50000);
    assert.equal(data.order.paymentStatus, 'PARTIALLY_PAID');
    assert.equal(data.order.stage, 'ORDER_CONFIRMED');
    testOrderId = data.order.id;

    // Verify customer finalized as CONVERTED
    const custRes = await fetch(`${baseUrl}/api/v1/customers/${testCustomerId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const custData = await custRes.json();
    assert.equal(custData.data.status, 'CONVERTED');
  });

  test('GET /api/v1/quotations/orders/list - Fetch list of confirmed orders', async () => {
    const res = await fetch(`${baseUrl}/api/v1/quotations/orders/list`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.length >= 3);
  });

  test('GET /api/v1/orders - Direct orders route compatibility', async () => {
    const res = await fetch(`${baseUrl}/api/v1/orders`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.length >= 3);
  });

  test('GET /api/v1/orders/:id - Retrieve order with customer and quotation context', async () => {
    const res = await fetch(`${baseUrl}/api/v1/orders/${testOrderId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.id, testOrderId);
    assert.equal(data.data.customer.name, 'Aarav Deshpande');
    assert.ok(data.data.quotation);
  });

  test('DELETE /api/v1/customers/:id - Prevents deletion when active orders exist', async () => {
    const res = await fetch(`${baseUrl}/api/v1/customers/${testCustomerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 409);
    assert.equal(data.success, false);
    assert.ok(data.error.includes('Linked records exist'));
  });
});
