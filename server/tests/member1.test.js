import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let baseUrl;
let adminToken = '';
let salesToken = '';
let testRegisteredUserId = '';

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('👤 Member 1: Authentication API Tests', () => {
  test('POST /api/v1/auth/login - Admin Login Success', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@sunpowersolutions.in',
        password: 'Password@123',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.token, 'Token must be returned');
    assert.equal(data.user.role, 'ADMIN');
    assert.equal(data.user.status, 'ACTIVE');
    assert.equal(data.user.password, undefined, 'Password must not be returned');

    adminToken = data.token;
  });

  test('POST /api/v1/auth/login - Sales Staff Login Success', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sales@sunpowersolutions.in',
        password: 'Password@123',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.token);
    assert.equal(data.user.role, 'SALES');

    salesToken = data.token;
  });

  test('POST /api/v1/auth/login - Invalid Password returns 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@sunpowersolutions.in',
        password: 'WrongPassword999',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 401);
    assert.equal(data.success, false);
    assert.ok(data.error.includes('Invalid email or password'));
  });

  test('POST /api/v1/auth/login - Non-existent User returns 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ghost.user@sunpowersolutions.in',
        password: 'Password@123',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 401);
    assert.equal(data.success, false);
  });

  test('POST /api/v1/auth/login - Pending Approval User returns 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rohan.d@gmail.com',
        password: 'Password@123',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 403);
    assert.equal(data.success, false);
    assert.ok(data.error.includes('pending administrator approval'));
  });

  test('POST /api/v1/auth/admin-login - Non-Admin rejected with 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sales@sunpowersolutions.in',
        password: 'Password@123',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 403);
    assert.equal(data.success, false);
    assert.ok(data.error.includes('Access restricted'));
  });

  test('POST /api/v1/auth/admin-login - Admin succeeds with 200', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@sunpowersolutions.in',
        password: 'Password@123',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.token);
  });

  test('POST /api/v1/auth/register - Staff Self-Registration defaults to PENDING_APPROVAL', async () => {
    const testEmail = `neha.sharma.${Date.now()}@sunpowersolutions.in`;
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Neha Sharma',
        email: testEmail,
        password: 'SecurePass@2026',
        phone: '+91 98111 22334',
        department: 'Customer Care',
        role: 'SUPPORT_AGENT',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.userId);
    assert.equal(data.data.status, 'PENDING_APPROVAL');
    assert.equal(data.data.role, 'SUPPORT_AGENT');

    testRegisteredUserId = data.userId;
  });

  test('POST /api/v1/auth/register - Privilege Escalation Prevention (cannot self-assign ADMIN)', async () => {
    const testEmail = `sneaky.hacker.${Date.now()}@gmail.com`;
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sneaky User',
        email: testEmail,
        password: 'SecurePass@2026',
        role: 'ADMIN', // Attempting to self-grant ADMIN
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 201);
    // Role must be forced back to SALES
    assert.equal(data.data.role, 'SALES');
    assert.equal(data.data.status, 'PENDING_APPROVAL');
  });

  test('POST /api/v1/auth/register - Duplicate Email returns 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Admin Attempt',
        email: 'admin@sunpowersolutions.in',
        password: 'Password@123',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 409);
    assert.equal(data.success, false);
    assert.ok(data.error.includes('already exists'));
  });

  test('POST /api/v1/auth/register - Validation errors (short password, bad email)', async () => {
    const res1 = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test',
        email: 'invalid-email',
        password: 'Password@123',
      }),
    });
    assert.equal(res1.status, 400);

    const res2 = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test',
        email: 'valid@example.com',
        password: '123', // short
      }),
    });
    assert.equal(res2.status, 400);
  });

  test('GET /api/v1/auth/me - Missing token returns 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`);
    const data = await res.json();
    assert.equal(res.status, 401);
    assert.equal(data.success, false);
  });

  test('GET /api/v1/auth/me - Invalid token returns 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: 'Bearer this-is-an-invalid-jwt-token' },
    });
    const data = await res.json();
    assert.equal(res.status, 401);
    assert.equal(data.success, false);
  });

  test('GET /api/v1/auth/me - Valid token returns employee profile', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.user.email, 'admin@sunpowersolutions.in');
    assert.equal(data.user.role, 'ADMIN');
  });
});

describe('👤 Member 1: User Administration & RBAC Tests', () => {
  test('GET /api/v1/admin/users - Rejected for non-Admin (SALES) with 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 403);
    assert.equal(data.success, false);
    assert.ok(data.error.includes('Access denied'));
  });

  test('GET /api/v1/admin/users - Admin lists all staff members', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.length > 0);
  });

  test('GET /api/v1/admin/users - Query filtering by role, status, search', async () => {
    // Filter by role
    const resRole = await fetch(`${baseUrl}/api/v1/admin/users?role=SALES`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataRole = await resRole.json();
    assert.equal(resRole.status, 200);
    assert.ok(dataRole.data.every((u) => u.role === 'SALES'));

    // Filter by status
    const resStatus = await fetch(`${baseUrl}/api/v1/admin/users?status=PENDING_APPROVAL`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataStatus = await resStatus.json();
    assert.equal(resStatus.status, 200);
    assert.ok(dataStatus.data.every((u) => u.status === 'PENDING_APPROVAL'));

    // Search by name
    const resSearch = await fetch(`${baseUrl}/api/v1/admin/users?search=Rajesh`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataSearch = await resSearch.json();
    assert.equal(resSearch.status, 200);
    assert.ok(dataSearch.data.some((u) => u.name.includes('Rajesh')));
  });

  test('GET /api/v1/admin/users/:id - Fetch single employee details', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/users/usr-sales-01`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.data.id, 'usr-sales-01');
    assert.equal(data.data.name, 'Vikram Mehta');
  });

  test('PATCH /api/v1/admin/users/:id/status - Approve pending user account to ACTIVE', async () => {
    assert.ok(testRegisteredUserId, 'Must have a registered user id');
    const res = await fetch(`${baseUrl}/api/v1/admin/users/${testRegisteredUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.status, 'ACTIVE');
  });

  test('PATCH /api/v1/admin/users/:id/status - Self-suspension prevention returns 400', async () => {
    // Current admin attempting to suspend their own account
    const res = await fetch(`${baseUrl}/api/v1/admin/users/usr-admin-01/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'SUSPENDED' }),
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.ok(data.error.includes('cannot suspend their own active account'));
  });

  test('PATCH /api/v1/admin/users/:id/role - Change role + records immutable audit log', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/users/${testRegisteredUserId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        role: 'TECHNICIAN',
        reason: 'Passed technical PV certification exam',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.user.role, 'TECHNICIAN');
    assert.equal(data.data.auditLog.oldRole, 'SUPPORT_AGENT');
    assert.equal(data.data.auditLog.newRole, 'TECHNICIAN');
    assert.equal(data.data.auditLog.reason, 'Passed technical PV certification exam');
  });

  test('PATCH /api/v1/admin/users/:id/role - Self-demotion prevention returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/users/usr-admin-01/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        role: 'SALES',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.ok(data.error.includes('cannot demote their own account'));
  });

  test('GET /api/v1/admin/audit-logs - Fetches role escalation history', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.length >= 4); // 3 seeded + 1 created in test
  });

  test('GET /api/v1/admin/users/:id/audit-logs - Single user audit logs', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/users/${testRegisteredUserId}/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.length, 1);
    assert.equal(data.data[0].newRole, 'TECHNICIAN');
  });

  test('Compatibility Aliases - /api/v1/users and /api/auth/login work properly', async () => {
    // /api/auth/login alias
    const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@sunpowersolutions.in',
        password: 'Password@123',
      }),
    });
    assert.equal(resLogin.status, 200);

    // /api/v1/users alias
    const resUsers = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(resUsers.status, 200);
  });
});
