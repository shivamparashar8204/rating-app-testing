const admin = require('firebase-admin');
const http = require('http');

// Connect to the emulators
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({ projectId: 'star-rating-83004' });

const db = admin.firestore();
const auth = admin.auth();

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  FAIL: ${testName}`);
    failed++;
  }
}

// Firestore REST API helper (simulates client SDK - subject to rules)
// For POST with specific ID: use ?documentId=id query param
// For PATCH: use /path/docId
// For GET/DELETE: use /path/docId
async function firestoreClient(method, path, token, body, queryExtra) {
  return new Promise((resolve, reject) => {
    let urlPath = `/v1/projects/star-rating-83004/databases/(default)/documents${path}`;
    if (queryExtra) urlPath += queryExtra;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const bodyStr = body ? JSON.stringify(body) : null;
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const req = http.request({
      hostname: '127.0.0.1', port: 8080, path: urlPath, method, headers,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// Auth REST API helper
async function signInWithCustomToken(customToken) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ token: customToken, returnSecureToken: true });
    const req = http.request({
      hostname: '127.0.0.1', port: 9099,
      path: '/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data).idToken); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('\n=== Phase 1: Firestore Security Rules Validation ===\n');

  // ---- Cleanup any leftover test users from prior runs ----
  const ts = Date.now();
  const cleanupEmails = ['test-customer', 'test-storeowner', 'test-attacker', 'test-admin'];
  const listResult = await auth.listUsers();
  for (const u of listResult.users) {
    if (cleanupEmails.some(e => u.email && u.email.startsWith(e))) {
      try { await auth.deleteUser(u.uid); } catch {}
    }
  }

  // ---- Setup via Admin SDK (bypasses rules) ----
  console.log('Setting up test data via Admin SDK (bypasses rules)...');
  const customerUid = await auth.createUser({ email: `test-customer-${ts}@test.com`, password: 'Test1234!', displayName: 'Test Customer Account' }).then(u => u.uid);
  const storeOwnerUid = await auth.createUser({ email: `test-storeowner-${ts}@test.com`, password: 'Test1234!', displayName: 'Test Store Owner Account' }).then(u => u.uid);
  const attackerUid = await auth.createUser({ email: `test-attacker-${ts}@test.com`, password: 'Test1234!', displayName: 'Test Attacker Account' }).then(u => u.uid);
  const adminUid = await auth.createUser({ email: `test-admin-${ts}@test.com`, password: 'Test1234!', displayName: 'Test Admin Account' }).then(u => u.uid);

  const now = admin.firestore.FieldValue.serverTimestamp();

  // Create user documents via Admin SDK
  await db.collection('users').doc(customerUid).set({ name: 'Test Customer Account', email: `test-customer-${ts}@test.com`, address: '123 Test St', role: 'CUSTOMER', created_at: now, updated_at: now });
  await db.collection('users').doc(storeOwnerUid).set({ name: 'Test Store Owner Account', email: `test-storeowner-${ts}@test.com`, address: '456 Store Ln', role: 'STORE_OWNER', created_at: now, updated_at: now });
  await db.collection('users').doc(attackerUid).set({ name: 'Test Attacker Account', email: `test-attacker-${ts}@test.com`, address: '789 Hack Rd', role: 'CUSTOMER', created_at: now, updated_at: now });
  await db.collection('users').doc(adminUid).set({ name: 'Test Admin Account', email: `test-admin-${ts}@test.com`, address: '100 Admin Blvd', role: 'ADMIN', created_at: now, updated_at: now });

  // Create a test store
  const storeRef = await db.collection('stores').add({ name: 'Test Store', email: 'store@test.com', address: '100 Store Rd', store_owner_id: storeOwnerUid, created_at: now, updated_at: now });
  const storeId = storeRef.id;

  // Create a test rating via Admin SDK
  const ratingId = `${customerUid}_${storeId}`;
  await db.collection('ratings').doc(ratingId).set({ user_id: customerUid, store_id: storeId, rating: 4, created_at: now, updated_at: now });

  console.log('Setup complete.\n');

  // Get ID tokens via Auth emulator REST API
  const customerToken = await signInWithCustomToken(await auth.createCustomToken(customerUid));
  const storeOwnerToken = await signInWithCustomToken(await auth.createCustomToken(storeOwnerUid));
  const attackerToken = await signInWithCustomToken(await auth.createCustomToken(attackerUid));
  const adminToken = await signInWithCustomToken(await auth.createCustomToken(adminUid));

  // ======================================================================
  // 1. USER SECURITY
  // ======================================================================
  console.log('--- 1. User Security Tests ---');

  // 1a. Unauthenticated cannot create a user
  let r = await firestoreClient('POST', '/users', null, {
    fields: { name: { stringValue: 'X' }, role: { stringValue: 'ADMIN' }, created_at: { timestampValue: new Date().toISOString() }, updated_at: { timestampValue: new Date().toISOString() } },
  }, `?documentId=${attackerUid}`);
  assert(r.status === 403 || r.status === 401, '1a. Unauthenticated user cannot create a user');

  // 1b. Authenticated user CAN create own profile with CUSTOMER role
  // Document ID must match request.auth.uid for the create rule to pass
  const newUserId = `testnew_${customerUid.substring(0, 8)}`;
  const newUserToken = await signInWithCustomToken(await auth.createCustomToken(newUserId));
  try { await auth.createUser({ uid: newUserId, email: `new-${newUserId}@test.com`, password: 'Test1234!', displayName: 'New Test User' }); } catch {}
  r = await firestoreClient('POST', '/users', newUserToken, {
    fields: { name: { stringValue: 'New User Profile' }, email: { stringValue: `new-${newUserId}@test.com` }, address: { stringValue: '123 New St' }, role: { stringValue: 'CUSTOMER' }, created_at: { timestampValue: new Date().toISOString() }, updated_at: { timestampValue: new Date().toISOString() } },
  }, `?documentId=${newUserId}`);
  assert(r.status === 200, '1b. Authenticated user can create own profile with CUSTOMER role');

  // 1c. Authenticated user CANNOT create profile with ADMIN role
  r = await firestoreClient('POST', '/users', attackerToken, {
    fields: { name: { stringValue: 'Attacker Admin' }, email: { stringValue: `attacker-admin-${ts}@test.com` }, role: { stringValue: 'ADMIN' }, created_at: { timestampValue: new Date().toISOString() }, updated_at: { timestampValue: new Date().toISOString() } },
  }, `?documentId=${attackerUid}_admin`);
  assert(r.status === 403 || r.status === 401, '1c. User cannot create profile with role=ADMIN (admin escalation blocked)');

  // 1d. Authenticated user CAN create profile with STORE_OWNER role (allowed)
  const newSoUserId = `testso_${customerUid.substring(0, 8)}`;
  try { await auth.createUser({ uid: newSoUserId, email: `so-${newSoUserId}@test.com`, password: 'Test1234!', displayName: 'New SO User' }); } catch {}
  const newSoUserToken = await signInWithCustomToken(await auth.createCustomToken(newSoUserId));
  r = await firestoreClient('POST', '/users', newSoUserToken, {
    fields: { name: { stringValue: 'New SO Profile' }, email: { stringValue: `so-${newSoUserId}@test.com` }, role: { stringValue: 'STORE_OWNER' }, created_at: { timestampValue: new Date().toISOString() }, updated_at: { timestampValue: new Date().toISOString() } },
  }, `?documentId=${newSoUserId}`);
  assert(r.status === 200, '1d. Authenticated user can create profile with STORE_OWNER role (allowed)');

  // 1e. Customer cannot change own role to ADMIN
  r = await firestoreClient('PATCH', `/users/${attackerUid}`, attackerToken, {
    fields: { name: { stringValue: 'Test Attacker Account' }, email: { stringValue: `test-attacker-${ts}@test.com` }, role: { stringValue: 'ADMIN' }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 403, '1e. Customer cannot change own role to ADMIN (returns 403)');
  const attDoc = await db.collection('users').doc(attackerUid).get();
  assert(attDoc.data().role === 'CUSTOMER', '1e-verify. Customer role unchanged after attempt');

  // 1f. Store owner cannot change own role to ADMIN
  r = await firestoreClient('PATCH', `/users/${storeOwnerUid}`, storeOwnerToken, {
    fields: { name: { stringValue: 'Test Store Owner Account' }, email: { stringValue: `test-storeowner-${ts}@test.com` }, role: { stringValue: 'ADMIN' }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 403, '1f. Store owner cannot change own role to ADMIN (returns 403)');
  const soDoc = await db.collection('users').doc(storeOwnerUid).get();
  assert(soDoc.data().role === 'STORE_OWNER', '1f-verify. Store owner role unchanged');

  // 1g. Attacker cannot modify another user's profile
  r = await firestoreClient('PATCH', `/users/${customerUid}`, attackerToken, {
    fields: { name: { stringValue: 'Hijacked' }, role: { stringValue: 'ADMIN' }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 403 || r.status === 401, '1g. Attacker cannot modify another user\'s profile');

  // 1h. Customer CAN update own profile fields (non-role)
  r = await firestoreClient('PATCH', `/users/${customerUid}`, customerToken, {
    fields: { name: { stringValue: 'Test Customer Updated' }, email: { stringValue: 'test-customer@test.com' }, address: { stringValue: '123 New St' }, role: { stringValue: 'CUSTOMER' }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 200, '1h. Customer CAN update own profile fields (non-role)');

  // 1i. Admin CAN update another user's profile (including role)
  r = await firestoreClient('PATCH', `/users/${customerUid}`, adminToken, {
    fields: { name: { stringValue: 'Test Customer Account' }, email: { stringValue: 'test-customer@test.com' }, address: { stringValue: '123 Test St' }, role: { stringValue: 'CUSTOMER' }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 200, '1i. Admin CAN update another user\'s profile');

  // 1j. Non-admin cannot list all users
  r = await firestoreClient('GET', '/users', customerToken);
  assert(r.status === 403, '1j. Non-admin cannot list all users');

  // 1k. Admin CAN list all users
  r = await firestoreClient('GET', '/users', adminToken);
  assert(r.status === 200, '1k. Admin CAN list all users');

  // ======================================================================
  // 2. STORE SECURITY
  // ======================================================================
  console.log('\n--- 2. Store Security Tests ---');

  // 2a. Unauthenticated cannot update a store
  r = await firestoreClient('PATCH', `/stores/${storeId}`, null, {
    fields: { name: { stringValue: 'Hacked' }, store_owner_id: { stringValue: attackerUid }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 403 || r.status === 401, '2a. Unauthenticated cannot update a store');

  // 2b. Store owner CAN update allowed fields
  r = await firestoreClient('PATCH', `/stores/${storeId}`, storeOwnerToken, {
    fields: { name: { stringValue: 'Test Store Updated' }, email: { stringValue: 'store@test.com' }, address: { stringValue: '100 Updated Rd' }, store_owner_id: { stringValue: storeOwnerUid }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 200, '2b. Store owner CAN update allowed fields');

  // 2c. Store owner CANNOT change store_owner_id
  r = await firestoreClient('PATCH', `/stores/${storeId}`, storeOwnerToken, {
    fields: { name: { stringValue: 'Test Store Updated' }, email: { stringValue: 'store@test.com' }, address: { stringValue: '100 Updated Rd' }, store_owner_id: { stringValue: attackerUid }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 403, '2c. Store owner CANNOT change store_owner_id (returns 403)');
  const storeDoc = await db.collection('stores').doc(storeId).get();
  assert(storeDoc.data().store_owner_id === storeOwnerUid, '2c-verify. store_owner_id unchanged after attempt');

  // 2d. Store owner cannot update a store they don't own
  const otherStoreRef = await db.collection('stores').add({ name: 'Other Store', email: 'other@test.com', address: '200 Other Rd', store_owner_id: customerUid, created_at: now, updated_at: now });
  r = await firestoreClient('PATCH', `/stores/${otherStoreRef.id}`, storeOwnerToken, {
    fields: { name: { stringValue: 'Hijacked Store' }, email: { stringValue: 'other@test.com' }, address: { stringValue: '200 Other Rd' }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 403, '2d. Store owner cannot update a store they do not own');

  // 2e. Admin CAN update any store
  r = await firestoreClient('PATCH', `/stores/${storeId}`, adminToken, {
    fields: { name: { stringValue: 'Admin Updated Store' }, email: { stringValue: 'store@test.com' }, address: { stringValue: '100 Admin Rd' }, store_owner_id: { stringValue: storeOwnerUid }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 200, '2e. Admin CAN update any store');

  // 2f. Admin CAN change store ownership
  r = await firestoreClient('PATCH', `/stores/${storeId}`, adminToken, {
    fields: { name: { stringValue: 'Admin Updated Store' }, email: { stringValue: 'store@test.com' }, address: { stringValue: '100 Admin Rd' }, store_owner_id: { stringValue: attackerUid }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 200, '2f. Admin CAN change store ownership');
  const storeDoc2 = await db.collection('stores').doc(storeId).get();
  assert(storeDoc2.data().store_owner_id === attackerUid, '2f-verify. Ownership changed by admin');

  // Reset ownership
  await db.collection('stores').doc(storeId).update({ store_owner_id: storeOwnerUid });

  // 2g. Non-admin cannot create a store
  r = await firestoreClient('POST', '/stores', customerToken, {
    fields: { name: { stringValue: 'New Store' }, email: { stringValue: 'new@test.com' }, address: { stringValue: '1 New Rd' }, store_owner_id: { stringValue: customerUid }, created_at: { timestampValue: new Date().toISOString() }, updated_at: { timestampValue: new Date().toISOString() } },
  }, '?documentId=should-not-exist');
  assert(r.status === 403, '2g. Non-admin cannot create a store');

  // 2h. Non-admin cannot delete a store
  r = await firestoreClient('DELETE', `/stores/${otherStoreRef.id}`, customerToken);
  assert(r.status === 403, '2h. Non-admin cannot delete a store');

  // ======================================================================
  // 3. RATING SECURITY
  // ======================================================================
  console.log('\n--- 3. Rating Security Tests ---');

  // First delete the existing rating to test create
  await db.collection('ratings').doc(ratingId).delete();

  // 3a. Customer CAN create own rating
  r = await firestoreClient('POST', '/ratings', customerToken, {
    fields: { user_id: { stringValue: customerUid }, store_id: { stringValue: storeId }, rating: { integerValue: '5' }, created_at: { timestampValue: new Date().toISOString() }, updated_at: { timestampValue: new Date().toISOString() } },
  }, `?documentId=${ratingId}`);
  assert(r.status === 200, '3a. Customer CAN create own rating');

  // 3b. Customer CANNOT create rating on behalf of another user
  const fakeRatingId = `${attackerUid}_${storeId}`;
  r = await firestoreClient('POST', '/ratings', customerToken, {
    fields: { user_id: { stringValue: attackerUid }, store_id: { stringValue: storeId }, rating: { integerValue: '3' }, created_at: { timestampValue: new Date().toISOString() }, updated_at: { timestampValue: new Date().toISOString() } },
  }, `?documentId=${fakeRatingId}`);
  assert(r.status === 403, '3b. Customer CANNOT create rating on behalf of another user');

  // 3c. Attacker cannot modify another user's rating
  r = await firestoreClient('PATCH', `/ratings/${ratingId}`, attackerToken, {
    fields: { rating: { integerValue: '1' }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 403, '3c. Attacker cannot modify another user\'s rating');

  // 3d. Customer CAN update own rating
  r = await firestoreClient('PATCH', `/ratings/${ratingId}`, customerToken, {
    fields: { rating: { integerValue: '4' }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 200, '3d. Customer CAN update own rating');

  // 3e. Rating with invalid value (>5) rejected
  const invalidRatingId = `${customerUid}_${otherStoreRef.id}`;
  r = await firestoreClient('POST', '/ratings', customerToken, {
    fields: { user_id: { stringValue: customerUid }, store_id: { stringValue: otherStoreRef.id }, rating: { integerValue: '10' }, created_at: { timestampValue: new Date().toISOString() }, updated_at: { timestampValue: new Date().toISOString() } },
  }, `?documentId=${invalidRatingId}`);
  assert(r.status === 403, '3e. Rating with invalid value (>5) rejected');

  // 3f. Rating with invalid value (0) rejected
  const zeroRatingId = `${customerUid}_zero`;
  r = await firestoreClient('POST', '/ratings', customerToken, {
    fields: { user_id: { stringValue: customerUid }, store_id: { stringValue: 'zero' }, rating: { integerValue: '0' }, created_at: { timestampValue: new Date().toISOString() }, updated_at: { timestampValue: new Date().toISOString() } },
  }, `?documentId=${zeroRatingId}`);
  assert(r.status === 403, '3f. Rating with invalid value (0) rejected');

  // 3g. Deterministic ID prevents duplicates (POST to existing doc returns 409 Conflict)
  r = await firestoreClient('POST', '/ratings', customerToken, {
    fields: { user_id: { stringValue: customerUid }, store_id: { stringValue: storeId }, rating: { integerValue: '3' }, created_at: { timestampValue: new Date().toISOString() }, updated_at: { timestampValue: new Date().toISOString() } },
  }, `?documentId=${ratingId}`);
  assert(r.status === 409, '3g. Deterministic rating ID prevents duplicate creation (POST returns 409)');

  // 3h. Unauthenticated cannot read ratings
  r = await firestoreClient('GET', `/ratings/${ratingId}`, null);
  assert(r.status === 403 || r.status === 401, '3h. Unauthenticated cannot read ratings');

  // 3i. Admin CAN update any rating
  r = await firestoreClient('PATCH', `/ratings/${ratingId}`, adminToken, {
    fields: { rating: { integerValue: '5' }, updated_at: { timestampValue: new Date().toISOString() } },
  });
  assert(r.status === 200, '3i. Admin CAN update any rating');

  // 3j. Admin CAN delete any rating
  r = await firestoreClient('DELETE', `/ratings/${ratingId}`, adminToken);
  assert(r.status === 200, '3j. Admin CAN delete any rating');

  // 3k. Non-admin/non-owner cannot delete a rating
  await db.collection('ratings').doc(ratingId).set({ user_id: customerUid, store_id: storeId, rating: 4, created_at: new Date(), updated_at: new Date() });
  r = await firestoreClient('DELETE', `/ratings/${ratingId}`, attackerToken);
  assert(r.status === 403, '3k. Non-owner non-admin cannot delete a rating');

  // ======================================================================
  // CLEANUP
  // ======================================================================
  console.log('\n--- Cleanup ---');
  for (const uid of [customerUid, storeOwnerUid, attackerUid, adminUid, newUserId, newSoUserId]) {
    try { await auth.deleteUser(uid); } catch {}
  }
  try { await db.collection('stores').doc(storeId).delete(); } catch {}
  try { await db.collection('stores').doc(otherStoreRef.id).delete(); } catch {}
  try { await db.collection('ratings').doc(ratingId).delete(); } catch {}
  console.log('Cleanup complete.\n');

  // ======================================================================
  // RESULTS
  // ======================================================================
  console.log('=== RESULTS ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);

  if (failed > 0) {
    console.log('\n!! SOME TESTS FAILED !!');
    process.exit(1);
  } else {
    console.log('\nAll security tests PASSED.');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
