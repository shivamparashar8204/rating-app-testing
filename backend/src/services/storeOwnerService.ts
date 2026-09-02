import pool from '../config/database';
import { StoreRow, StoreOwnerProfile, RatingWithUser } from '../types';

interface DashboardData {
  store: { id: number; name: string; email: string; address: string };
  averageRating: number | null;
  totalRatings: number;
}

export async function getDashboard(userId: number): Promise<DashboardData | null> {
  const [storeRows] = await pool.query<StoreRow[]>(
    'SELECT * FROM stores WHERE store_owner_id = ?',
    [userId]
  );
  const store = storeRows[0];
  if (!store) return null;

  const [ratingRows] = await pool.query(
    'SELECT AVG(rating) AS avg_rating, COUNT(*) AS total FROM ratings WHERE store_id = ?',
    [store.id]
  );
  const row = (ratingRows as { avg_rating: number | null; total: number }[])[0];

  return {
    store: { id: store.id, name: store.name, email: store.email, address: store.address },
    averageRating: row.avg_rating ? Math.round(row.avg_rating * 10) / 10 : null,
    totalRatings: row.total,
  };
}

export async function getStoreByOwnerId(userId: number): Promise<StoreRow | null> {
  const [rows] = await pool.query<StoreRow[]>(
    'SELECT * FROM stores WHERE store_owner_id = ?',
    [userId]
  );
  return rows[0] || null;
}

export async function getRatingsForStore(userId: number): Promise<RatingWithUser[]> {
  const [storeRows] = await pool.query<StoreRow[]>(
    'SELECT id FROM stores WHERE store_owner_id = ?',
    [userId]
  );
  const store = storeRows[0];
  if (!store) return [];

  const [rows] = await pool.query<RatingWithUser[]>(
    `SELECT r.id, r.rating, r.user_id, u.name AS user_name, u.email AS user_email,
            r.created_at, r.updated_at
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     WHERE r.store_id = ?
     ORDER BY r.created_at DESC`,
    [store.id]
  );
  return rows;
}

export async function getProfile(userId: number): Promise<StoreOwnerProfile | null> {
  const [rows] = await pool.query<StoreOwnerProfile[]>(
    `SELECT u.id, u.name, u.email, u.address, u.role,
            s.id AS store_id, s.name AS store_name, s.email AS store_email, s.address AS store_address
     FROM users u
     LEFT JOIN stores s ON s.store_owner_id = u.id
     WHERE u.id = ?`,
    [userId]
  );
  return rows[0] || null;
}
