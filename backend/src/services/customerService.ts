import pool from '../config/database';
import { StoreWithUserRating, RatingRow } from '../types';

interface StoreIdRow {
  id: number;
}

export async function getAllStores(userId: number, search?: string): Promise<StoreWithUserRating[]> {
  let query = `
    SELECT s.id, s.name, s.email, s.address, s.store_owner_id,
           COALESCE(AVG(r.rating), 0) AS avg_rating,
           ur.rating AS user_rating
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

  query += ` GROUP BY s.id, s.name, s.email, s.address, s.store_owner_id, ur.rating`;
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
