import pool from '../config/database';
import { StoreRow, StoreOwnerProfile, RatingWithUser } from '../types';

interface DashboardData {
  store: { id: number; name: string; email: string; address: string };
  averageRating: number | null;
  totalRatings: number;
}

export async function getDashboard(userId: number): Promise<DashboardData | null> {
  const storeResult = await pool.query(
    'SELECT * FROM stores WHERE store_owner_id = $1',
    [userId]
  );
  const store = storeResult.rows[0];
  if (!store) return null;

  const ratingResult = await pool.query(
    'SELECT AVG(rating) AS avg_rating, COUNT(*) AS total FROM ratings WHERE store_id = $1',
    [store.id]
  );
  const row = ratingResult.rows[0];

  return {
    store: { id: store.id, name: store.name, email: store.email, address: store.address },
    averageRating: row.avg_rating ? Math.round(parseFloat(row.avg_rating) * 10) / 10 : null,
    totalRatings: parseInt(row.total, 10),
  };
}

export async function getStoreByOwnerId(userId: number): Promise<StoreRow | null> {
  const result = await pool.query(
    'SELECT * FROM stores WHERE store_owner_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

export async function getRatingsForStore(userId: number): Promise<RatingWithUser[]> {
  const storeResult = await pool.query(
    'SELECT id FROM stores WHERE store_owner_id = $1',
    [userId]
  );
  const store = storeResult.rows[0];
  if (!store) return [];

  const result = await pool.query(
    `SELECT r.id, r.rating, r.user_id, u.name AS user_name, u.email AS user_email,
            r.created_at, r.updated_at
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     WHERE r.store_id = $1
     ORDER BY r.created_at DESC`,
    [store.id]
  );
  return result.rows;
}

export async function getProfile(userId: number): Promise<StoreOwnerProfile | null> {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.address, u.role,
            s.id AS store_id, s.name AS store_name, s.email AS store_email, s.address AS store_address
     FROM users u
     LEFT JOIN stores s ON s.store_owner_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}
