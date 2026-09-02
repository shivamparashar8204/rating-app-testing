import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import pool from '../src/config/database';

const SALT_ROUNDS = 10;

async function seed() {
  let connection;
  try {
    console.log('Connecting to MySQL...');
    connection = await pool.getConnection();
    console.log('Connected.');

    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    const count = (existingUsers as { count: number }[])[0].count;
    if (count > 0) {
      console.log('Database already seeded. Skipping.');
      return;
    }

    console.log('Seeding users...');
    const adminHash = await bcrypt.hash('admin', SALT_ROUNDS);
    const customerHash = await bcrypt.hash('customer', SALT_ROUNDS);
    const storeOwnerHash = await bcrypt.hash('storeowner', SALT_ROUNDS);

    await connection.query(
      `INSERT INTO users (name, email, address, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      ['System Administrator Account', 'admin', '123 Admin Street', adminHash, 'ADMIN']
    );
    await connection.query(
      `INSERT INTO users (name, email, address, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      ['Regular Customer Account', 'customer', '456 Customer Avenue', customerHash, 'CUSTOMER']
    );
    await connection.query(
      `INSERT INTO users (name, email, address, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      ['Store Owner Test Account', 'storeowner', '789 Store Boulevard', storeOwnerHash, 'STORE_OWNER']
    );

    const [storeOwnerRows] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      ['storeowner']
    );
    const storeOwnerId = (storeOwnerRows as { id: number }[])[0].id;

    console.log('Seeding stores...');
    await connection.query(
      `INSERT INTO stores (name, email, address, store_owner_id) VALUES (?, ?, ?, ?)`,
      ['Alpha Electronics Store', 'alpha@example.com', '100 Tech Park Road', storeOwnerId]
    );

    const [customerRows] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      ['customer']
    );
    const customerId = (customerRows as { id: number }[])[0].id;

    const [storeRows] = await connection.query('SELECT id FROM stores LIMIT 1');
    const storeId = (storeRows as { id: number }[])[0].id;

    console.log('Seeding ratings...');
    await connection.query(
      `INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)`,
      [customerId, storeId, 4]
    );

    console.log('Seed complete.');
    console.log('');
    console.log('Test accounts:');
    console.log('  Admin:      email=admin      password=admin');
    console.log('  Customer:   email=customer   password=customer');
    console.log('  StoreOwner: email=storeowner password=storeowner');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

seed();
