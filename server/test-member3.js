/**
 * Test script for Member 3 endpoints:
 * - Inventory & Stock Movements
 * - Dispatch & Serial Anti-Duplicate Scanning
 * - Warranty Registry & Verification
 */

import jwt from 'jsonwebtoken';
import { config } from './src/config/config.js';
import app from './src/app.js';
import { db } from './src/db/database.js';

// Generate mock auth token for test
const token = jwt.sign(
  { id: 'usr-wh-01', email: 'warehouse@sunpowersolutions.in', role: 'WAREHOUSE_MANAGER', name: 'Suresh Patel' },
  config.jwtSecret,
  { expiresIn: '1h' }
);

function mockRequest(method, url, body = null) {
  return new Promise((resolve) => {
    // Simple in-memory fetch simulation via Supertest-like listener
    const req = {
      method,
      url,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: body || {},
      query: {},
      params: {},
    };

    // Use express router handle
    let parsedUrl = new URL(`http://localhost:5001${url}`);
    req.path = parsedUrl.pathname;
    parsedUrl.searchParams.forEach((v, k) => {
      req.query[k] = v;
    });

    let statusCode = 200;
    let responseData = null;

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        resolve({ status: statusCode, body: data });
      },
      setHeader() {},
      getHeader() {},
    };

    app(req, res, (err) => {
      if (err) {
        resolve({ status: 500, body: { error: err.message } });
      } else {
        resolve({ status: 404, body: { error: 'Not Found' } });
      }
    });
  });
}

async function runTests() {
  console.log('🧪 Starting Member 3 verification tests...\n');

  // Test 1: Get Inventory
  console.log('1. Testing GET /api/v1/inventory');
  const getInv = await mockRequest('GET', '/api/v1/inventory');
  console.log(`   Status: ${getInv.status}, Items count: ${getInv.body.count}`);
  if (getInv.status !== 200 || !getInv.body.success) throw new Error('Inventory fetch failed');

  // Test 2: Create new SKU
  console.log('2. Testing POST /api/v1/inventory');
  const testSku = `TEST-PNL-${Date.now().toString(36).toUpperCase()}`;
  const newSku = await mockRequest('POST', '/api/v1/inventory', {
    sku: testSku,
    name: 'Test Monocrystalline Panel 600W',
    brand: 'SunPower Labs',
    model: 'SP-600W',
    category: 'SOLAR_PANEL',
    unit: 'Nos',
    currentStock: 50,
    lowStockThreshold: 10,
    unitCostPrice: 12000,
    unitSellingPrice: 16000,
    hasSerialNumbers: true,
    warrantyYears: 25,
  });
  console.log(`   Status: ${newSku.status}, Created ID: ${newSku.body.data.id}`);
  if (newSku.status !== 201) throw new Error('SKU creation failed');
  const createdItemId = newSku.body.data.id;

  // Test 3: Record stock movement
  console.log('3. Testing POST /api/v1/inventory/stock-movement');
  const mov = await mockRequest('POST', '/api/v1/inventory/stock-movement', {
    inventoryItemId: createdItemId,
    movementType: 'INWARD',
    quantity: 20,
    reason: 'Fresh shipment received from OEM',
    reference: 'PO-TEST-001',
  });
  console.log(`   Status: ${mov.status}, Updated stock: ${mov.body.updatedStock}`);
  if (mov.status !== 200 || mov.body.updatedStock !== 70) throw new Error('Movement recording failed');

  // Test 4: Get stock movements
  console.log('4. Testing GET /api/v1/inventory/movements/list');
  const movements = await mockRequest('GET', `/api/v1/inventory/movements/list?itemId=${createdItemId}`);
  console.log(`   Status: ${movements.status}, Movements count for item: ${movements.body.count}`);

  // Test 5: Create dispatch picking list
  console.log('5. Testing POST /api/v1/dispatch');
  const newDispatch = await mockRequest('POST', '/api/v1/dispatch', {
    orderId: 'ord-01',
    customerId: 'cust-01',
    customerName: 'Rajesh Malhotra',
    items: [
      {
        inventoryItemId: createdItemId,
        itemName: 'Test Monocrystalline Panel 600W',
        quantity: 2,
        warrantyYears: 25,
      },
    ],
  });
  console.log(`   Status: ${newDispatch.status}, Dispatch Number: ${newDispatch.body.data.dispatchNumber}`);
  if (newDispatch.status !== 201) throw new Error('Dispatch creation failed');
  const dispatchId = newDispatch.body.data.id;

  // Test 6: Validate serial uniqueness (Anti-Duplicate check)
  console.log('6. Testing POST /api/v1/dispatch/validate-serial');
  const testSerial1 = `TEST-SN-${Date.now()}-A`;
  const val1 = await mockRequest('POST', '/api/v1/dispatch/validate-serial', { serialNumber: testSerial1 });
  console.log(`   Unique serial valid: ${val1.body.valid} (Expected: true)`);
  if (!val1.body.valid) throw new Error('Unique serial reported invalid');

  // Test 7: Scan serial (Serial 1)
  console.log('7. Testing POST /api/v1/dispatch/:id/scan-serial (Valid)');
  const scan1 = await mockRequest('POST', `/api/v1/dispatch/${dispatchId}/scan-serial`, {
    inventoryItemId: createdItemId,
    serialNumber: testSerial1,
  });
  console.log(`   Status: ${scan1.status}, Scanned count: ${scan1.body.scannedCount}/${scan1.body.requiredCount}`);
  if (scan1.status !== 200) throw new Error('Valid scan failed');

  // Test 8: Anti-Duplicate Scan - Try scanning the SAME serial again
  console.log('8. Testing POST /api/v1/dispatch/:id/scan-serial (Duplicate Prevention)');
  const scanDup = await mockRequest('POST', `/api/v1/dispatch/${dispatchId}/scan-serial`, {
    inventoryItemId: createdItemId,
    serialNumber: testSerial1,
  });
  console.log(`   Duplicate scan status: ${scanDup.status} (Expected: 409 Conflict)`);
  if (scanDup.status !== 409) throw new Error('Duplicate scan was NOT rejected with 409!');

  // Test 9: Scan second serial to complete picking
  console.log('9. Testing Scan Serial 2 to complete dispatch order');
  const testSerial2 = `TEST-SN-${Date.now()}-B`;
  const scan2 = await mockRequest('POST', `/api/v1/dispatch/${dispatchId}/scan-serial`, {
    inventoryItemId: createdItemId,
    serialNumber: testSerial2,
  });
  console.log(`   Status: ${scan2.status}, Dispatch Status: ${scan2.body.dispatchStatus}`);
  if (scan2.body.dispatchStatus !== 'READY') throw new Error('Dispatch should be READY when all serials scanned');

  // Test 10: Mark dispatch completed with vehicle
  console.log('10. Testing PATCH /api/v1/dispatch/:id/status (Mark DISPATCHED)');
  const dispUpdate = await mockRequest('PATCH', `/api/v1/dispatch/${dispatchId}/status`, {
    status: 'DISPATCHED',
    vehicleNumber: 'DL-01-AB-1234',
    driverName: 'Surender Singh',
  });
  console.log(`   Status: ${dispUpdate.status}, Updated status: ${dispUpdate.body.data.status}`);
  if (dispUpdate.body.data.status !== 'DISPATCHED') throw new Error('Dispatch update failed');

  // Test 11: Verify Warranty Registry auto-created warranties
  console.log('11. Testing GET /api/v1/warranties');
  const warranties = await mockRequest('GET', '/api/v1/warranties');
  console.log(`   Status: ${warranties.status}, Total Warranties: ${warranties.body.count}`);
  const foundWarr = warranties.body.data.find((w) => w.serialNumber === testSerial1);
  if (!foundWarr) throw new Error(`Auto-created warranty for ${testSerial1} not found in registry!`);
  console.log(`   Auto-created warranty verified: ${foundWarr.serialNumber} -> Customer: ${foundWarr.customerName}`);

  // Test 12: Instant Warranty Verification by Serial
  console.log('12. Testing GET /api/v1/warranties/verify/:serialNumber');
  const verifyRes = await mockRequest('GET', `/api/v1/warranties/verify/${testSerial1}`);
  console.log(`   Status: ${verifyRes.status}, Warranty Status: ${verifyRes.body.data.status}, Days Remaining: ${verifyRes.body.data.daysRemaining}`);
  if (verifyRes.status !== 200 || verifyRes.body.data.status !== 'ACTIVE') throw new Error('Warranty verification failed');

  // Test 13: Clean up test SKU
  console.log('13. Clean up test records');
  db.prepare('DELETE FROM warranty_records WHERE serialNumber IN (?, ?)').run(testSerial1, testSerial2);
  db.prepare('DELETE FROM dispatch_orders WHERE id = ?').run(dispatchId);
  db.prepare('DELETE FROM stock_movements WHERE inventoryItemId = ?').run(createdItemId);
  db.prepare('DELETE FROM inventory_items WHERE id = ?').run(createdItemId);
  console.log('   Clean up completed.');

  console.log('\n🎉 ALL MEMBER 3 TESTS PASSED SUCCESSFULLY! 🚀');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});

