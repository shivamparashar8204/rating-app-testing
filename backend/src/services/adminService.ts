import pool from '../config/database';
import { DashboardCounts, UserRow, AdminUserDetail, AdminStoreDetail, StoreRow, AdminRatingDetail, RatingRow } from '../types';
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

export async function updateUser(
  id: number,
  data: { name?: string; email?: string; address?: string; password?: string; role?: string }
): Promise<AdminUserDetail | null> {
  const sets: string[] = [];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    sets.push(`name = $${paramIndex}`);
    params.push(data.name.trim());
    paramIndex++;
  }
  if (data.email !== undefined) {
    sets.push(`email = $${paramIndex}`);
    params.push(data.email.trim().toLowerCase());
    paramIndex++;
  }
  if (data.address !== undefined) {
    sets.push(`address = $${paramIndex}`);
    params.push(data.address.trim());
    paramIndex++;
  }
  if (data.role !== undefined) {
    sets.push(`role = $${paramIndex}`);
    params.push(data.role.toUpperCase());
    paramIndex++;
  }
  if (data.password !== undefined && data.password !== '') {
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    sets.push(`password_hash = $${paramIndex}`);
    params.push(passwordHash);
    paramIndex++;
  }

  if (sets.length === 0) {
    const result = await pool.query(
      'SELECT id, name, email, address, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  sets.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);

  const result = await pool.query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, name, email, address, role, created_at`,
    params
  );
  return result.rows[0] || null;
}

export async function updateUserRole(id: number, role: string): Promise<void> {
  await pool.query(
    'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [role.toUpperCase(), id]
  );
}

export async function updateStore(
  id: number,
  data: { name?: string; email?: string; address?: string }
): Promise<AdminStoreDetail | null> {
  const sets: string[] = [];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    sets.push(`s.name = $${paramIndex}`);
    params.push(data.name.trim());
    paramIndex++;
  }
  if (data.email !== undefined) {
    sets.push(`s.email = $${paramIndex}`);
    params.push(data.email.trim().toLowerCase());
    paramIndex++;
  }
  if (data.address !== undefined) {
    sets.push(`s.address = $${paramIndex}`);
    params.push(data.address.trim());
    paramIndex++;
  }

  if (sets.length === 0) {
    return getStoreById(id);
  }

  sets.push(`s.updated_at = CURRENT_TIMESTAMP`);
  params.push(id);

  const result = await pool.query(
    `UPDATE stores s SET ${sets.join(', ')} WHERE s.id = $${paramIndex}
     RETURNING s.*`,
    params
  );

  if (result.rows.length === 0) return null;

  const storeResult = await pool.query(
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
  return storeResult.rows[0] || null;
}

export async function getAllRatings(
  filters: { customerName?: string; storeName?: string; rating?: number },
  sort: { sortBy: string; order: 'ASC' | 'DESC' }
): Promise<AdminRatingDetail[]> {
  const allowedSort = ['rating', 'created_at', 'updated_at', 'user_name', 'store_name'];
  const sortField = allowedSort.includes(sort.sortBy) ? sort.sortBy : 'created_at';
  const sortOrder = sort.order === 'DESC' ? 'DESC' : 'ASC';

  let query = `
    SELECT r.id, r.rating, r.user_id, u.name AS user_name, u.email AS user_email,
           r.store_id, s.name AS store_name, s.email AS store_email,
           r.created_at, r.updated_at
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    JOIN stores s ON r.store_id = s.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (filters.customerName) {
    query += ` AND u.name LIKE $${paramIndex}`;
    params.push(`%${filters.customerName}%`);
    paramIndex++;
  }
  if (filters.storeName) {
    query += ` AND s.name LIKE $${paramIndex}`;
    params.push(`%${filters.storeName}%`);
    paramIndex++;
  }
  if (filters.rating !== undefined && filters.rating !== null) {
    query += ` AND r.rating = $${paramIndex}`;
    params.push(filters.rating);
    paramIndex++;
  }

  query += ` ORDER BY ${sortField} ${sortOrder}`;

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getRatingById(id: number): Promise<AdminRatingDetail | null> {
  const result = await pool.query(
    `SELECT r.id, r.rating, r.user_id, u.name AS user_name, u.email AS user_email,
            r.store_id, s.name AS store_name, s.email AS store_email,
            r.created_at, r.updated_at
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     JOIN stores s ON r.store_id = s.id
     WHERE r.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createRating(
  userId: number,
  storeId: number,
  rating: number
): Promise<RatingRow> {
  const result = await pool.query(
    `INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, storeId, rating]
  );
  return result.rows[0];
}

export async function updateRating(
  id: number,
  rating: number
): Promise<void> {
  await pool.query(
    'UPDATE ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [rating, id]
  );
}

export async function deleteRating(id: number): Promise<void> {
  await pool.query('DELETE FROM ratings WHERE id = $1', [id]);
}

export async function getRecentReviews(): Promise<AdminRatingDetail[]> {
  const result = await pool.query(
    `SELECT r.id, r.rating, r.user_id, u.name AS user_name, u.email AS user_email,
            r.store_id, s.name AS store_name, s.email AS store_email,
            r.created_at, r.updated_at
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     JOIN stores s ON r.store_id = s.id
     ORDER BY r.created_at DESC
     LIMIT 5`
  );
  return result.rows;
}

export async function getTopRatedStores(): Promise<AdminStoreDetail[]> {
  const result = await pool.query(
    `SELECT s.id, s.name, s.email, s.address, s.store_owner_id,
            u.name AS owner_name, u.email AS owner_email,
            COALESCE(AVG(r.rating), 0) AS avg_rating,
            COUNT(r.id) AS total_ratings
     FROM stores s
     JOIN users u ON s.store_owner_id = u.id
     LEFT JOIN ratings r ON s.id = r.store_id
     GROUP BY s.id, s.name, s.email, s.address, s.store_owner_id, u.name, u.email
     ORDER BY avg_rating DESC
     LIMIT 5`
  );
  return result.rows;
}

export async function getRecentlyRegisteredCustomers(): Promise<AdminUserDetail[]> {
  const result = await pool.query(
    `SELECT id, name, email, address, role, created_at
     FROM users
     WHERE role = 'CUSTOMER'
     ORDER BY created_at DESC
     LIMIT 5`
  );
  return result.rows;
}

export async function getRecentlyAddedStores(): Promise<AdminStoreDetail[]> {
  const result = await pool.query(
    `SELECT s.id, s.name, s.email, s.address, s.store_owner_id,
            u.name AS owner_name, u.email AS owner_email,
            COALESCE(AVG(r.rating), 0) AS avg_rating,
            COUNT(r.id) AS total_ratings
     FROM stores s
     JOIN users u ON s.store_owner_id = u.id
     LEFT JOIN ratings r ON s.id = r.store_id
     GROUP BY s.id, s.name, s.email, s.address, s.store_owner_id, u.name, u.email
     ORDER BY s.created_at DESC
     LIMIT 5`
  );
  return result.rows;
}

export async function getStoreOwnerUsers(): Promise<AdminUserDetail[]> {
  const result = await pool.query(
    `SELECT id, name, email, address, role, created_at
     FROM users
     WHERE role = 'STORE_OWNER'
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function getCustomerUsers(): Promise<AdminUserDetail[]> {
  const result = await pool.query(
    `SELECT id, name, email, address, role, created_at
     FROM users
     WHERE role = 'CUSTOMER'
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function getDashboardExtended(): Promise<{
  total_users: number;
  total_customers: number;
  total_store_owners: number;
  total_stores: number;
  total_ratings: number;
  avg_rating: number | null;
}> {
  const userResult = await pool.query('SELECT COUNT(*) AS total_users FROM users');
  const customerResult = await pool.query("SELECT COUNT(*) AS total_customers FROM users WHERE role = 'CUSTOMER'");
  const storeOwnerResult = await pool.query("SELECT COUNT(*) AS total_store_owners FROM users WHERE role = 'STORE_OWNER'");
  const storeResult = await pool.query('SELECT COUNT(*) AS total_stores FROM stores');
  const ratingResult = await pool.query('SELECT COUNT(*) AS total_ratings FROM ratings');
  const avgResult = await pool.query('SELECT AVG(rating) AS avg_rating FROM ratings');

  return {
    total_users: parseInt(userResult.rows[0].total_users, 10),
    total_customers: parseInt(customerResult.rows[0].total_customers, 10),
    total_store_owners: parseInt(storeOwnerResult.rows[0].total_store_owners, 10),
    total_stores: parseInt(storeResult.rows[0].total_stores, 10),
    total_ratings: parseInt(ratingResult.rows[0].total_ratings, 10),
    avg_rating: avgResult.rows[0].avg_rating ? Math.round(parseFloat(avgResult.rows[0].avg_rating) * 10) / 10 : null,
  };
}
