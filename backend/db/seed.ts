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

async function main() {
  try {
    await seed();
    await seedDemoCustomer();
    await seedDemoStoreOwner();
    await seedDemoAdmin();
  } finally {
    await pool.end();
  }
}

main();
