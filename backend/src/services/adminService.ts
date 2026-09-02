import pool from '../config/database';
import { DashboardCounts, UserRow, AdminUserDetail, AdminStoreDetail, StoreRow } from '../types';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function getDashboard(): Promise<DashboardCounts> {
  const [userRows] = await pool.query('SELECT COUNT(*) AS total_users FROM users');
  const [storeRows] = await pool.query('SELECT COUNT(*) AS total_stores FROM stores');
  const [ratingRows] = await pool.query('SELECT COUNT(*) AS total_ratings FROM ratings');

  const users = (userRows as DashboardCounts[])[0];
  const stores = (storeRows as DashboardCounts[])[0];
  const ratings = (ratingRows as DashboardCounts[])[0];

  return {
    total_users: users.total_users,
    total_stores: stores.total_stores,
    total_ratings: ratings.total_ratings,
  } as DashboardCounts;
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

  if (filters.name) {
    query += ` AND name LIKE ?`;
    params.push(`%${filters.name}%`);
  }
  if (filters.email) {
    query += ` AND email LIKE ?`;
    params.push(`%${filters.email}%`);
  }
  if (filters.address) {
    query += ` AND address LIKE ?`;
    params.push(`%${filters.address}%`);
  }
  if (filters.role) {
    query += ` AND role = ?`;
    params.push(filters.role.toUpperCase());
  }

  query += ` ORDER BY ${sortField} ${sortOrder}`;

  const [rows] = await pool.query<AdminUserDetail[]>(query, params);
  return rows;
}

export async function getUserById(id: number): Promise<{
  user: AdminUserDetail;
  store?: StoreRow;
  avg_rating?: number | null;
  total_ratings?: number;
} | null> {
  const [userRows] = await pool.query<AdminUserDetail[]>(
    'SELECT id, name, email, address, role, created_at FROM users WHERE id = ?',
    [id]
  );
  const user = userRows[0];
  if (!user) return null;

  if (user.role === 'STORE_OWNER') {
    const [storeRows] = await pool.query<StoreRow[]>(
      'SELECT * FROM stores WHERE store_owner_id = ?',
      [id]
    );
    const store = storeRows[0];
    if (store) {
      const [ratingRows] = await pool.query(
        'SELECT AVG(rating) AS avg_rating, COUNT(*) AS total_ratings FROM ratings WHERE store_id = ?',
        [store.id]
      );
      const ratingData = (ratingRows as { avg_rating: number | null; total_ratings: number }[])[0];
      return {
        user,
        store,
        avg_rating: ratingData.avg_rating ? Math.round(ratingData.avg_rating * 10) / 10 : null,
        total_ratings: ratingData.total_ratings,
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
           IFNULL(AVG(r.rating), 0) AS avg_rating,
           COUNT(r.id) AS total_ratings
    FROM stores s
    JOIN users u ON s.store_owner_id = u.id
    LEFT JOIN ratings r ON s.id = r.store_id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (filters.name) {
    query += ` AND s.name LIKE ?`;
    params.push(`%${filters.name}%`);
  }
  if (filters.email) {
    query += ` AND s.email LIKE ?`;
    params.push(`%${filters.email}%`);
  }
  if (filters.address) {
    query += ` AND s.address LIKE ?`;
    params.push(`%${filters.address}%`);
  }

  query += ` GROUP BY s.id, s.name, s.email, s.address, s.store_owner_id, u.name, u.email`;
  query += ` ORDER BY ${sortField} ${sortOrder}`;

  const [rows] = await pool.query<AdminStoreDetail[]>(query, params);
  return rows;
}

export async function createStore(
  name: string,
  email: string,
  address: string,
  storeOwnerId: number
): Promise<StoreRow> {
  const [result] = await pool.query(
    `INSERT INTO stores (name, email, address, store_owner_id) VALUES (?, ?, ?, ?)`,
    [name.trim(), email.trim().toLowerCase(), address.trim(), storeOwnerId]
  );
  const insertId = (result as { insertId: number }).insertId;
  const [rows] = await pool.query<StoreRow[]>('SELECT * FROM stores WHERE id = ?', [insertId]);
  return rows[0];
}

export async function createUser(
  name: string,
  email: string,
  address: string,
  password: string,
  role: string
): Promise<{ id: number; name: string; email: string; address: string | null; role: string; created_at: Date }> {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [result] = await pool.query(
    `INSERT INTO users (name, email, address, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
    [name.trim(), email.trim().toLowerCase(), address.trim(), passwordHash, role.toUpperCase()]
  );
  const insertId = (result as { insertId: number }).insertId;
  const [rows] = await pool.query<AdminUserDetail[]>(
    'SELECT id, name, email, address, role, created_at FROM users WHERE id = ?',
    [insertId]
  );
  return rows[0];
}

export async function getStoreById(id: number): Promise<AdminStoreDetail | null> {
  const [rows] = await pool.query<AdminStoreDetail[]>(
    `SELECT s.id, s.name, s.email, s.address, s.store_owner_id,
            u.name AS owner_name, u.email AS owner_email,
            IFNULL(AVG(r.rating), 0) AS avg_rating,
            COUNT(r.id) AS total_ratings
     FROM stores s
     JOIN users u ON s.store_owner_id = u.id
     LEFT JOIN ratings r ON s.id = r.store_id
     WHERE s.id = ?
     GROUP BY s.id, s.name, s.email, s.address, s.store_owner_id, u.name, u.email`,
    [id]
  );
  return rows[0] || null;
}

export async function findUserByIdForAdmin(id: number): Promise<UserRow | null> {
  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}
