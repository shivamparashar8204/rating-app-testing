import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import pool from '../src/config/database';

const SALT_ROUNDS = 10;

async function seed() {
  console.log('Connecting to PostgreSQL...');
  console.log('Connected.');

  const existingUsers = await pool.query('SELECT COUNT(*) as count FROM users');
  const count = parseInt(existingUsers.rows[0].count, 10);
  if (count > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  console.log('Seeding users...');
  const adminHash = await bcrypt.hash('Admin@123', SALT_ROUNDS);
  const customerHash = await bcrypt.hash('Customer@123', SALT_ROUNDS);
  const storeOwnerHash = await bcrypt.hash('StoreOwner@123', SALT_ROUNDS);

  await pool.query(
    `INSERT INTO users (name, email, address, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
    ['System Administrator Account', 'admin@test.com', '123 Admin Street', adminHash, 'ADMIN']
  );
  await pool.query(
    `INSERT INTO users (name, email, address, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
    ['Regular Customer Account', 'customer@test.com', '456 Customer Avenue', customerHash, 'CUSTOMER']
  );
  await pool.query(
    `INSERT INTO users (name, email, address, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
    ['Store Owner Test Account', 'owner@test.com', '789 Store Boulevard', storeOwnerHash, 'STORE_OWNER']
  );

  const storeOwnerResult = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    ['owner@test.com']
  );
  const storeOwnerId = storeOwnerResult.rows[0].id;

  console.log('Seeding stores...');
  await pool.query(
    `INSERT INTO stores (name, email, address, store_owner_id) VALUES ($1, $2, $3, $4)`,
    ['Alpha Electronics Store', 'alpha@example.com', '100 Tech Park Road', storeOwnerId]
  );

  const customerResult = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    ['customer@test.com']
  );
  const customerId = customerResult.rows[0].id;

  const storeResult = await pool.query('SELECT id FROM stores LIMIT 1');
  const storeId = storeResult.rows[0].id;

  console.log('Seeding ratings...');
  await pool.query(
    `INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)`,
    [customerId, storeId, 4]
  );

  console.log('Seed complete.');
  console.log('');
  console.log('Test accounts:');
  console.log('  Admin:      email=admin@test.com      password=Admin@123');
  console.log('  Customer:   email=customer@test.com   password=Customer@123');
  console.log('  StoreOwner: email=owner@test.com      password=StoreOwner@123');
  console.log('');
}

async function seedDemoCustomer() {
  try {
    console.log('Checking demo customer account...');

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo.customer@example.com']
    );

    if (existing.rows.length > 0) {
      console.log('Demo customer already exists. Skipping.');
      return;
    }

    const demoHash = await bcrypt.hash('DemoCustomer@123', SALT_ROUNDS);

    await pool.query(
      `INSERT INTO users (name, email, address, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
      ['Demo Customer Account', 'demo.customer@example.com', '100 Demo Street', demoHash, 'CUSTOMER']
    );

    console.log('Demo customer created.');
    console.log('  Demo Customer: email=demo.customer@example.com   password=DemoCustomer@123');
  } catch (error) {
    console.error('Demo customer seed failed:', error);
  }
}

async function seedDemoStoreOwner() {
  try {
    console.log('Checking demo store owner account...');

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo.storeowner@example.com']
    );

    if (existing.rows.length > 0) {
      console.log('Demo store owner already exists. Skipping.');
      return;
    }

    const demoHash = await bcrypt.hash('DemoStoreOwner@123', SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (name, email, address, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Demo Store Owner Account', 'demo.storeowner@example.com', '200 Demo Boulevard', demoHash, 'STORE_OWNER']
    );
    const storeOwnerId = result.rows[0].id;

    await pool.query(
      `INSERT INTO stores (name, email, address, store_owner_id) VALUES ($1, $2, $3, $4)`,
      ['Demo Rating Store', 'demo.storeowner@example.com', '300 Demo Avenue', storeOwnerId]
    );

    console.log('Demo store owner created with store.');
    console.log('  Demo Store Owner: email=demo.storeowner@example.com   password=DemoStoreOwner@123');
  } catch (error) {
    console.error('Demo store owner seed failed:', error);
  }
}

async function seedDemoAdmin() {
  try {
    console.log('Checking demo admin account...');

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo.admin@example.com']
    );

    if (existing.rows.length > 0) {
      console.log('Demo admin already exists. Skipping.');
      return;
    }

    const demoHash = await bcrypt.hash('DemoAdmin@123', SALT_ROUNDS);

    await pool.query(
      `INSERT INTO users (name, email, address, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
      ['Demo Admin Account', 'demo.admin@example.com', '400 Demo Plaza', demoHash, 'ADMIN']
    );

    console.log('Demo admin created.');
    console.log('  Demo Admin: email=demo.admin@example.com   password=DemoAdmin@123');
  } catch (error) {
    console.error('Demo admin seed failed:', error);
  }
}

async function seedDemoStoresAndRatings() {
  try {
    console.log('Checking demo stores and ratings...');

    const existingStores = await pool.query('SELECT COUNT(*) as count FROM stores');
    const storeCount = parseInt(existingStores.rows[0].count, 10);
    if (storeCount > 1) {
      console.log('Demo stores already exist. Skipping.');
      return;
    }

    const storeOwners = [
      { name: 'The Spice Kitchen Owner', email: 'owner.spicekitchen@example.com', storeName: 'The Spice Kitchen', storeEmail: 'contact@spicekitchen.com', address: 'Connaught Place, New Delhi' },
      { name: 'Delhi Darbar Owner', email: 'owner.delhidarbar@example.com', storeName: 'Delhi Darbar', storeEmail: 'info@delhidarbar.com', address: 'Karol Bagh, New Delhi' },
      { name: 'Amritsari Rasoi Owner', email: 'owner.amritsarirasoi@example.com', storeName: 'Amritsari Rasoi', storeEmail: 'hello@amritsarirasoi.com', address: 'Lajpat Nagar, New Delhi' },
      { name: 'Mumbai Tadka Owner', email: 'owner.mumbaitadka@example.com', storeName: 'Mumbai Tadka', storeEmail: 'contact@mumbaitadka.com', address: 'Saket, New Delhi' },
      { name: 'Green Leaf Cafe Owner', email: 'owner.greenleaf@example.com', storeName: 'Green Leaf Cafe', storeEmail: 'info@greenleafcafe.com', address: 'Hauz Khas, New Delhi' },
      { name: 'Royal Biryani House Owner', email: 'owner.royalbiryani@example.com', storeName: 'Royal Biryani House', storeEmail: 'orders@royalbiryani.com', address: 'Rajouri Garden, New Delhi' },
      { name: 'South Indian Express Owner', email: 'owner.southindianexpress@example.com', storeName: 'South Indian Express', storeEmail: 'info@southindianexpress.com', address: 'Vasant Kunj, New Delhi' },
      { name: 'Urban Coffee Owner', email: 'owner.urbancoffee@example.com', storeName: 'Urban Coffee', storeEmail: 'hello@urbancoffee.com', address: 'Greater Kailash, New Delhi' },
    ];

    const ownerHash = await bcrypt.hash('StoreOwner@123', SALT_ROUNDS);
    const customerHash = await bcrypt.hash('Customer@123', SALT_ROUNDS);

    // Create extra customer accounts for realistic ratings
    const extraCustomerEmails = ['reviewer1@example.com', 'reviewer2@example.com'];
    const customerIds: number[] = [];

    // Get existing demo customer ID
    const demoCust = await pool.query('SELECT id FROM users WHERE email = $1', ['demo.customer@example.com']);
    if (demoCust.rows.length > 0) {
      customerIds.push(demoCust.rows[0].id);
    }

    for (const email of extraCustomerEmails) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        customerIds.push(existing.rows[0].id);
      } else {
        const result = await pool.query(
          `INSERT INTO users (name, email, address, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          ['Extra Reviewer Account', email, '500 Reviewer Lane', customerHash, 'CUSTOMER']
        );
        customerIds.push(result.rows[0].id);
      }
    }

    console.log('Seeding demo stores...');
    const storeIds: number[] = [];

    for (const owner of storeOwners) {
      // Create store owner user
      const ownerResult = await pool.query(
        `INSERT INTO users (name, email, address, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [owner.name, owner.email, owner.address, ownerHash, 'STORE_OWNER']
      );
      const ownerId = ownerResult.rows[0].id;

      // Create store
      const storeResult = await pool.query(
        `INSERT INTO stores (name, email, address, store_owner_id) VALUES ($1, $2, $3, $4) RETURNING id`,
        [owner.storeName, owner.storeEmail, owner.address, ownerId]
      );
      storeIds.push(storeResult.rows[0].id);
    }

    // Also include the existing demo store owner's store
    const demoStoreOwner = await pool.query('SELECT id FROM users WHERE email = $1', ['demo.storeowner@example.com']);
    if (demoStoreOwner.rows.length > 0) {
      const existingStore = await pool.query('SELECT id FROM stores WHERE store_owner_id = $1', [demoStoreOwner.rows[0].id]);
      if (existingStore.rows.length > 0) {
        storeIds.push(existingStore.rows[0].id);
      }
    }

    console.log('Seeding demo ratings...');
    // Predefined ratings for realistic data distribution
    const ratingsByCustomer: Record<number, number[]> = {};
    customerIds.forEach((cId, ci) => {
      ratingsByCustomer[cId] = storeIds.map((_, si) => {
        // Deterministic but varied ratings
        const base = [4, 5, 3, 4, 5, 4, 5, 3, 4, 5, 4, 3];
        return base[(ci * 3 + si) % base.length];
      });
    });

    for (const [cIdStr, ratings] of Object.entries(ratingsByCustomer)) {
      const cId = parseInt(cIdStr, 10);
      for (let i = 0; i < storeIds.length; i++) {
        // Skip some ratings randomly to make it realistic (not every customer rates every store)
        if ((cId + i) % 3 === 0) continue;
        try {
          await pool.query(
            `INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3) ON CONFLICT (user_id, store_id) DO NOTHING`,
            [cId, storeIds[i], ratings[i]]
          );
        } catch {
          // Ignore duplicate constraint violations
        }
      }
    }

    console.log('Demo stores and ratings seeded.');
    console.log(`  Created ${storeOwners.length} stores with ratings from ${customerIds.length} customers.`);
  } catch (error) {
    console.error('Demo stores/ratings seed failed:', error);
  }
}

async function main() {
  try {
    await seed();
    await seedDemoCustomer();
    await seedDemoStoreOwner();
    await seedDemoAdmin();
    await seedDemoStoresAndRatings();
  } finally {
    await pool.end();
  }
}

main();
