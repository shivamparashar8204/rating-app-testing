import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import pool from '../src/config/database';

const SALT_ROUNDS = 10;

async function seed() {
  try {
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
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
