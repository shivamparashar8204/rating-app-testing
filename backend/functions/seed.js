const admin = require('firebase-admin');

// Initialize with emulator or production
const projectId = process.env.FIREBASE_PROJECT_ID || 'your-project-id';
if (process.env.FUNCTIONS_EMULATOR === 'true' || process.env.NODE_ENV !== 'production') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
}

admin.initializeApp({ projectId });

const db = admin.firestore();
const auth = admin.auth();

const SALT_ROUNDS = 10;

async function seed() {
  try {
    console.log('Seeding Firestore...');

    // Check if already seeded
    const usersSnapshot = await db.collection('users').limit(1).get();
    if (!usersSnapshot.empty) {
      console.log('Database already seeded. Skipping.');
      return;
    }

    console.log('Creating admin user...');
    const adminUser = await auth.createUser({
      email: 'admin@example.com',
      password: 'Admin123!',
      displayName: 'System Administrator Account',
    });
    await db.collection('users').doc(adminUser.uid).set({
      name: 'System Administrator Account',
      email: 'admin@example.com',
      address: '123 Admin Street',
      role: 'ADMIN',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Creating customer user...');
    const customerUser = await auth.createUser({
      email: 'customer@example.com',
      password: 'Customer123!',
      displayName: 'Regular Customer Account',
    });
    await db.collection('users').doc(customerUser.uid).set({
      name: 'Regular Customer Account',
      email: 'customer@example.com',
      address: '456 Customer Avenue',
      role: 'CUSTOMER',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Creating store owner user...');
    const storeOwnerUser = await auth.createUser({
      email: 'storeowner@example.com',
      password: 'StoreOwner123!',
      displayName: 'Store Owner Test Account',
    });
    await db.collection('users').doc(storeOwnerUser.uid).set({
      name: 'Store Owner Test Account',
      email: 'storeowner@example.com',
      address: '789 Store Boulevard',
      role: 'STORE_OWNER',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Creating store...');
    const storeRef = await db.collection('stores').add({
      name: 'Alpha Electronics Store',
      email: 'alpha@example.com',
      address: '100 Tech Park Road',
      store_owner_id: storeOwnerUser.uid,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Creating rating...');
    await db.collection('ratings').add({
      user_id: customerUser.uid,
      store_id: storeRef.id,
      rating: 4,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Seed complete.');
    console.log('');
    console.log('Test accounts:');
    console.log('  Admin:      email=admin@example.com      password=Admin123!');
    console.log('  Customer:   email=customer@example.com   password=Customer123!');
    console.log('  StoreOwner: email=storeowner@example.com password=StoreOwner123!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
