import pool from '../config/database';
import { StoreWithUserRating, RatingRow, RatingWithUser } from '../types';

interface StoreIdRow {
  id: number;
}

export async function getAllStores(userId: number, search?: string): Promise<StoreWithUserRating[]> {
  let query = `
    SELECT s.id, s.name, s.email, s.address, s.store_owner_id,
           COALESCE(AVG(r.rating), 0) AS avg_rating,
           COUNT(DISTINCT r.id) AS total_ratings,
           ur.rating AS user_rating,
           ur.id AS user_rating_id
    FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
    LEFT JOIN ratings ur ON s.id = ur.store_id AND ur.user_id = $1
  `;

  const params: (number | string)[] = [userId];
  let paramIndex = 2;

  if (search && search.trim()) {
    query += ` WHERE s.name LIKE $${paramIndex} OR s.address LIKE $${paramIndex + 1}`;
    const term = `%${search.trim()}%`;
    params.push(term, term);
    paramIndex += 2;
  }

  query += ` GROUP BY s.id, s.name, s.email, s.address, s.store_owner_id, ur.rating, ur.id`;
  query += ` ORDER BY s.name ASC`;

  const result = await pool.query(query, params);
  return result.rows;
}

export async function submitRating(userId: number, storeId: number, rating: number): Promise<{ insertId: number }> {
  const result = await pool.query(
    'INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3) RETURNING id',
    [userId, storeId, rating]
  );
  return { insertId: result.rows[0].id };
}

export async function findRatingById(ratingId: number): Promise<RatingRow | null> {
  const result = await pool.query(
    'SELECT * FROM ratings WHERE id = $1',
    [ratingId]
  );
  return result.rows[0] || null;
}

export async function updateRating(ratingId: number, rating: number): Promise<void> {
  await pool.query(
    'UPDATE ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [rating, ratingId]
  );
}

export async function findStoreById(storeId: number): Promise<{ id: number } | null> {
  const result = await pool.query(
    'SELECT id FROM stores WHERE id = $1',
    [storeId]
  );
  return result.rows[0] || null;
}

export async function getStoreDetails(storeId: number, userId: number) {
  const storeResult = await pool.query(
    `SELECT s.id, s.name, s.email, s.address, s.store_owner_id,
            COALESCE(AVG(r.rating), 0) AS avg_rating,
            COUNT(r.id) AS total_ratings
     FROM stores s
     LEFT JOIN ratings r ON s.id = r.store_id
     WHERE s.id = $1
     GROUP BY s.id`,
    [storeId]
  );
  const store = storeResult.rows[0];
  if (!store) return null;

  const userRatingResult = await pool.query(
    'SELECT id, rating FROM ratings WHERE user_id = $1 AND store_id = $2',
    [userId, storeId]
  );
  const userRating = userRatingResult.rows[0] || null;

  return {
    ...store,
    avg_rating: store.avg_rating ? Math.round(parseFloat(store.avg_rating) * 10) / 10 : null,
    total_ratings: parseInt(store.total_ratings, 10),
    user_rating: userRating ? userRating.rating : null,
    user_rating_id: userRating ? userRating.id : null,
  };
}

export async function getRatingsForCustomer(userId: number): Promise<RatingWithUser[]> {
  const result = await pool.query(
    `SELECT r.id, r.rating, r.user_id, u.name AS user_name, u.email AS user_email,
            r.created_at, r.updated_at
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     WHERE r.user_id = $1
     ORDER BY r.updated_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getCustomerDashboard(userId: number) {
  const profileResult = await pool.query(
    'SELECT id, name, email, address, role FROM users WHERE id = $1',
    [userId]
  );
  const profile = profileResult.rows[0] || null;

  const statsResult = await pool.query(
    `SELECT
       COUNT(*) AS total_ratings,
       COALESCE(AVG(rating), 0) AS avg_rating
     FROM ratings WHERE user_id = $1`,
    [userId]
  );
  const stats = statsResult.rows[0];

  const storesResult = await pool.query('SELECT COUNT(*) AS total_stores FROM stores');
  const totalStores = parseInt(storesResult.rows[0].total_stores, 10);

  const recentResult = await pool.query(
    `SELECT r.id, r.rating, r.user_id, u.name AS user_name, u.email AS user_email,
            r.created_at, r.updated_at
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     WHERE r.user_id = $1
     ORDER BY r.updated_at DESC
     LIMIT 5`,
    [userId]
  );

  return {
    profile,
    totalRatings: parseInt(stats.total_ratings, 10),
    avgRatingGiven: stats.avg_rating ? Math.round(parseFloat(stats.avg_rating) * 10) / 10 : null,
    totalStores,
    recentRatings: recentResult.rows,
  };
}
