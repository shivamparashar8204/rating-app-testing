import pool from '../config/database';
import { DashboardCounts, UserRow, AdminUserDetail, AdminStoreDetail, StoreRow } from '../types';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function getDashboard(): Promise<DashboardCounts> {
  const userResult = await pool.query('SELECT COUNT(*) AS total_users FROM users');
  const storeResult = await pool.query('SELECT COUNT(*) AS total_stores FROM stores');
  const ratingResult = await pool.query('SELECT COUNT(*) AS total_ratings FROM ratings');

  return {
    total_users: parseInt(userResult.rows[0].total_users, 10),
    total_stores: parseInt(storeResult.rows[0].total_stores, 10),
    total_ratings: parseInt(ratingResult.rows[0].total_ratings, 10),
  };
}

export async function getAllUsers(
  filters: { name?: string; email?: string; address?: string; role?: string },
  sort: { sortBy: string; order: 'ASC' | 'DESC' }
): Promise<AdminUserDetail[]> {
  const allowedSort = ['name', 'email', 'address', 'role', 'created_at'];
  const sortField = allowedSort.includes(sort.sortBy) ? sort.sortBy : 'name';
  const sortOrder = sort.order === 'DESC' ? 'DESC' : 'ASC';

  let query = `SELECT id, name, email, address, role, created_at FROM users WHERE 1=1`;
  const params: string[] = [];
  let paramIndex = 1;

  if (filters.name) {
    query += ` AND name LIKE $${paramIndex}`;
    params.push(`%${filters.name}%`);
    paramIndex++;
  }
  if (filters.email) {
    query += ` AND email LIKE $${paramIndex}`;
    params.push(`%${filters.email}%`);
    paramIndex++;
  }
  if (filters.address) {
    query += ` AND address LIKE $${paramIndex}`;
    params.push(`%${filters.address}%`);
    paramIndex++;
  }
  if (filters.role) {
    query += ` AND role = $${paramIndex}`;
    params.push(filters.role.toUpperCase());
    paramIndex++;
  }

  query += ` ORDER BY ${sortField} ${sortOrder}`;

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getUserById(id: number): Promise<{
  user: AdminUserDetail;
  store?: StoreRow;
  avg_rating?: number | null;
  total_ratings?: number;
} | null> {
  const userResult = await pool.query(
    'SELECT id, name, email, address, role, created_at FROM users WHERE id = $1',
    [id]
  );
  const user = userResult.rows[0];
  if (!user) return null;

  if (user.role === 'STORE_OWNER') {
    const storeResult = await pool.query(
      'SELECT * FROM stores WHERE store_owner_id = $1',
      [id]
    );
    const store = storeResult.rows[0];
    if (store) {
      const ratingResult = await pool.query(
        'SELECT AVG(rating) AS avg_rating, COUNT(*) AS total_ratings FROM ratings WHERE store_id = $1',
        [store.id]
      );
      const ratingData = ratingResult.rows[0];
      return {
        user,
        store,
        avg_rating: ratingData.avg_rating ? Math.round(parseFloat(ratingData.avg_rating) * 10) / 10 : null,
        total_ratings: parseInt(ratingData.total_ratings, 10),
      };
    }
  }

  return { user };
}

export async function getAllStores(
  filters: { name?: string; email?: string; address?: string },
  sort: { sortBy: string; order: 'ASC' | 'DESC' }
): Promise<AdminStoreDetail[]> {
  const allowedSort = ['name', 'email', 'address', 'created_at'];
  const sortField = allowedSort.includes(sort.sortBy) ? sort.sortBy : 'name';
  const sortOrder = sort.order === 'DESC' ? 'DESC' : 'ASC';

  let query = `
    SELECT s.id, s.name, s.email, s.address, s.store_owner_id,
           u.name AS owner_name, u.email AS owner_email,
           COALESCE(AVG(r.rating), 0) AS avg_rating,
           COUNT(r.id) AS total_ratings
    FROM stores s
    JOIN users u ON s.store_owner_id = u.id
    LEFT JOIN ratings r ON s.id = r.store_id
    WHERE 1=1
  `;
  const params: string[] = [];
  let paramIndex = 1;

  if (filters.name) {
    query += ` AND s.name LIKE $${paramIndex}`;
    params.push(`%${filters.name}%`);
    paramIndex++;
  }
  if (filters.email) {
    query += ` AND s.email LIKE $${paramIndex}`;
    params.push(`%${filters.email}%`);
    paramIndex++;
  }
  if (filters.address) {
    query += ` AND s.address LIKE $${paramIndex}`;
    params.push(`%${filters.address}%`);
    paramIndex++;
  }

  query += ` GROUP BY s.id, s.name, s.email, s.address, s.store_owner_id, u.name, u.email`;
  query += ` ORDER BY ${sortField} ${sortOrder}`;

  const result = await pool.query(query, params);
  return result.rows;
}

export async function createStore(
  name: string,
  email: string,
  address: string,
  storeOwnerId: number
): Promise<StoreRow> {
  const result = await pool.query(
    `INSERT INTO stores (name, email, address, store_owner_id) VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name.trim(), email.trim().toLowerCase(), address.trim(), storeOwnerId]
  );
  return result.rows[0];
}

export async function createUser(
  name: string,
  email: string,
  address: string,
  password: string,
  role: string
): Promise<{ id: number; name: string; email: string; address: string | null; role: string; created_at: Date }> {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query(
    `INSERT INTO users (name, email, address, password_hash, role) VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, address, role, created_at`,
    [name.trim(), email.trim().toLowerCase(), address.trim(), passwordHash, role.toUpperCase()]
  );
  return result.rows[0];
}

export async function getStoreById(id: number): Promise<AdminStoreDetail | null> {
  const result = await pool.query(
    `SELECT s.id, s.name, s.email, s.address, s.store_owner_id,
            u.name AS owner_name, u.email AS owner_email,
            COALESCE(AVG(r.rating), 0) AS avg_rating,
            COUNT(r.id) AS total_ratings
     FROM stores s
     JOIN users u ON s.store_owner_id = u.id
     LEFT JOIN ratings r ON s.id = r.store_id
     WHERE s.id = $1
     GROUP BY s.id, s.name, s.email, s.address, s.store_owner_id, u.name, u.email`,
    [id]
  );
  return result.rows[0] || null;
}

export async function findUserByIdForAdmin(id: number): Promise<UserRow | null> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}
