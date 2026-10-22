// Comprehensive Automated Test Suite for AnnaSetu REST API
// Run: npm test

process.env.DATABASE_URL = '';
process.env.DB_FILE = ':memory:';
process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert');
const { app, seed } = require('../src/server');
const { validateDonationInput, validateRequestInput } = require('../src/middleware/validation');

const validDonation = {
  title: 'Fresh Veg Biryani',
  category: 'Food',
  quantity: 25,
  pickup: 'Hostel 4 Mess, Campus Center'
};

// --- Test Group 1: Unit Testing - Boundary Value Analysis (BVA) ---
test('UT: Boundary Value Analysis on Quantity (0, 1, 500, 501)', () => {
  assert.strictEqual(validateDonationInput({ ...validDonation, quantity: 0 }).length, 1, 'Quantity 0 should fail BVA');
  assert.strictEqual(validateDonationInput({ ...validDonation, quantity: 1 }).length, 0, 'Quantity 1 should pass BVA');
  assert.strictEqual(validateDonationInput({ ...validDonation, quantity: 500 }).length, 0, 'Quantity 500 should pass BVA');
  assert.strictEqual(validateDonationInput({ ...validDonation, quantity: 501 }).length, 1, 'Quantity 501 should fail BVA');
});

// --- Test Group 2: Unit Testing - Equivalence Partitioning (EP) ---
test('UT: Equivalence Partitioning on Title, Category, Pickup, Decimal Quantity', () => {
  assert.ok(validateDonationInput({ ...validDonation, category: 'Diamonds' }).length > 0, 'Invalid category must fail');
  assert.ok(validateDonationInput({ ...validDonation, title: 'ab' }).length > 0, 'Short title must fail');
  assert.ok(validateDonationInput({ ...validDonation, pickup: '' }).length > 0, 'Empty pickup must fail');
  assert.ok(validateDonationInput({ ...validDonation, quantity: 4.5 }).length > 0, 'Fractional quantity must fail');
});

// --- Test Group 3: System, Integration & End-to-End API Tests ---
test('ST/IT: Full Lifecycle, Security RBAC, Matching, Auto-Fulfillment, and Analytics', async () => {
  await seed();

  let server;
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const request = async (method, path, body, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await res.json();
    return { status: res.status, body: json };
  };

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/health`);
  assert.strictEqual(healthRes.status, 200, 'Health check must return 200');
  const healthJson = await healthRes.json();
  assert.strictEqual(healthJson.status, 'healthy');

  // 2. Authentication: Invalid password must return 401
  const badLogin = await request('POST', '/login', { email: 'donor@demo.test', password: 'WrongPassword' });
  assert.strictEqual(badLogin.status, 401, 'Bad credentials must fail with 401');

  // 3. Login all 5 demo roles
  const loginUser = async (role) => {
    const res = await request('POST', '/login', { email: `${role}@demo.test`, password: 'AnnaSetu@1234' });
    assert.strictEqual(res.status, 200, `Login for ${role} should succeed`);
    return res.body.token;
  };


  const donorToken = await loginUser('donor');
  const ngoToken = await loginUser('ngo');
  const volToken = await loginUser('volunteer');
  const adminToken = await loginUser('admin');
  const benToken = await loginUser('beneficiary');

  // 4. Role Authorization: Unauthenticated & Forbidden access
  const unauthDonations = await request('GET', '/donations');
  assert.strictEqual(unauthDonations.status, 401, 'Unauthenticated request must return 401');

  const ngoCreateDonation = await request('POST', '/donations', validDonation, ngoToken);
  assert.strictEqual(ngoCreateDonation.status, 403, 'NGO cannot create donations');

  const donorListUsers = await request('GET', '/users', null, donorToken);
  assert.strictEqual(donorListUsers.status, 403, 'Donor cannot list all users');

  // 5. Emergency Relief Request creation by Beneficiary
  const reqRes = await request(
    'POST',
    '/requests',
    {
      category: 'Food',
      quantity: 25,
      location: 'Relief Camp Sector 9',
      urgency: 'Critical',
      description: 'Urgent meals needed for shelter residents'
    },
    benToken
  );
  assert.strictEqual(reqRes.status, 201, 'Beneficiary should create emergency request');
  const createdRequestId = reqRes.body.id;

  // 6. Donor creates donation linked to the request
  const donationRes = await request(
    'POST',
    '/donations',
    {
      ...validDonation,
      request_id: createdRequestId
    },
    donorToken
  );
  assert.strictEqual(donationRes.status, 201, 'Donor should create donation');
  const donationId = donationRes.body.id;

  const act = (token, id, action, extra = {}) =>
    request('POST', '/donations/action', { id, action, ...extra }, token);

  // 7. Lifecycle constraint: NGO cannot review before submission
  const prematureReview = await act(ngoToken, donationId, 'review');
  assert.strictEqual(prematureReview.status, 409, 'Cannot review before submit');

  // 8. Donor submits donation for review
  const submitRes = await act(donorToken, donationId, 'submit');
  assert.strictEqual(submitRes.status, 200);
  assert.strictEqual(submitRes.body.status, 'Submitted');

  // 9. Smart Matching: Match between donation and request of same category
  const matchesRes = await request('GET', '/matches', null, ngoToken);
  assert.strictEqual(matchesRes.status, 200);
  assert.ok(matchesRes.body.length >= 1, 'Smart match should pair donation and request');

  // 10. Admin cannot review donation (only verified NGOs can)
  const adminReview = await act(adminToken, donationId, 'review');
  assert.strictEqual(adminReview.status, 403, 'Admin cannot review');

  // 11. NGO starts review
  const ngoReview = await act(ngoToken, donationId, 'review');
  assert.strictEqual(ngoReview.status, 200);

  // 12. Cannot assign volunteer while in UnderReview state
  const prematureAssign = await act(ngoToken, donationId, 'assign', {});
  assert.strictEqual(prematureAssign.status, 409, 'Cannot assign before Available');

  // 13. NGO approves and releases donation to Available
  const approveRes = await act(ngoToken, donationId, 'approve');
  assert.strictEqual(approveRes.status, 200);

  const releaseRes = await act(ngoToken, donationId, 'release');
  assert.strictEqual(releaseRes.status, 200);

  // 14. Donor cannot cancel once Available
  const cancelAttempt = await act(donorToken, donationId, 'cancel');
  assert.strictEqual(cancelAttempt.status, 409, 'Cannot cancel once Available');

  // 15. NGO assigns verified volunteer
  const volsRes = await request('GET', '/volunteers', null, ngoToken);
  assert.strictEqual(volsRes.status, 200);
  const volProfile = await request('GET', '/me', null, volToken);
  const volunteerId = volProfile.body.id;

  // Missing delivery location should fail
  const missingLoc = await act(ngoToken, donationId, 'assign', { volunteer_id: volunteerId });
  assert.strictEqual(missingLoc.status, 400, 'Delivery location is required');

  const assignRes = await act(ngoToken, donationId, 'assign', {
    volunteer_id: volunteerId,
    delivery_location: 'Relief Camp Sector 9 Distribution Point'
  });
  assert.strictEqual(assignRes.status, 200);

  // 16. Volunteer delivery workflow
  // Cannot deliver before starting transit
  const skipTransit = await act(volToken, donationId, 'deliver');
  assert.strictEqual(skipTransit.status, 409, 'Cannot skip InTransit');

  const startRes = await act(volToken, donationId, 'start');
  assert.strictEqual(startRes.status, 200);

  const deliverRes = await act(volToken, donationId, 'deliver');
  assert.strictEqual(deliverRes.status, 200);

  // 17. Verify emergency request was automatically marked Fulfilled upon delivery
  const requestsRes = await request('GET', '/requests', null, adminToken);
  const matchedReq = requestsRes.body.find((r) => r.id === createdRequestId);
  assert.strictEqual(matchedReq.status, 'Fulfilled', 'Linked request should be fulfilled on delivery');

  // 18. Rejection and Reopen flow test
  const rejDonationRes = await request('POST', '/donations', validDonation, donorToken);
  const rejId = rejDonationRes.body.id;
  await act(donorToken, rejId, 'submit');
  await act(ngoToken, rejId, 'review');
  const rejectRes = await act(ngoToken, rejId, 'reject');
  assert.strictEqual(rejectRes.status, 200);

  // Reopen returns donation to Created state
  const reopenRes = await act(donorToken, rejId, 'reopen');
  assert.strictEqual(reopenRes.status, 200);
  assert.strictEqual(reopenRes.body.status, 'Created');

  // 19. Registration and Verification test
  const newNgo = await request('POST', '/register', {
    name: 'Jan Seva Trust',
    email: 'janseva@ngo.org',
    password: 'Password@123',
    role: 'ngo'
  });
  assert.strictEqual(newNgo.status, 201);

  // Duplicate email registration should return 409
  const dupNgo = await request('POST', '/register', {
    name: 'Jan Seva Trust',
    email: 'janseva@ngo.org',
    password: 'Password@123',
    role: 'ngo'
  });
  assert.strictEqual(dupNgo.status, 409, 'Duplicate email must conflict');

  // Unverified NGO cannot review
  const newNgoToken = (await request('POST', '/login', { email: 'janseva@ngo.org', password: 'Password@123' })).body.token;
  const testDonation = (await request('POST', '/donations', validDonation, donorToken)).body.id;
  await act(donorToken, testDonation, 'submit');
  const unverifiedReview = await act(newNgoToken, testDonation, 'review');
  assert.strictEqual(unverifiedReview.status, 403, 'Unverified NGO blocked');

  // Admin verifies the new NGO
  const allUsers = (await request('GET', '/users', null, adminToken)).body;
  const newNgoUser = allUsers.find((u) => u.email === 'janseva@ngo.org');
  assert.ok(newNgoUser);
  const verifyRes = await request('POST', '/users/verify', { id: newNgoUser.id }, adminToken);
  assert.strictEqual(verifyRes.status, 200);

  // Verified NGO can now review
  const verifiedReview = await act(newNgoToken, testDonation, 'review');
  assert.strictEqual(verifiedReview.status, 200, 'Verified NGO can review');

  // 20. Reports and Analytics verification
  const reportsRes = await request('GET', '/reports', null, adminToken);
  assert.strictEqual(reportsRes.status, 200);
  assert.ok(reportsRes.body.donations_delivered >= 1);
  assert.ok(reportsRes.body.users >= 6);

  // Clean shutdown
  server.close();
});
