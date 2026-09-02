import pool from '../config/database';
import { StoreWithUserRating, RatingRow } from '../types';
import { RowDataPacket } from 'mysql2';

interface StoreIdRow extends RowDataPacket {
  id: number;
}

export async function getAllStores(userId: number, search?: string): Promise<StoreWithUserRating[]> {
  let query = `
    SELECT s.id, s.name, s.email, s.address, s.store_owner_id,
           IFNULL(AVG(r.rating), 0) AS avg_rating,
           ur.rating AS user_rating
    FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
    LEFT JOIN ratings ur ON s.id = ur.store_id AND ur.user_id = ?
  `;

  const params: (number | string)[] = [userId];

  if (search && search.trim()) {
    query += ` WHERE s.name LIKE ? OR s.address LIKE ?`;
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  query += ` GROUP BY s.id, s.name, s.email, s.address, s.store_owner_id, ur.rating`;
  query += ` ORDER BY s.name ASC`;

  const [rows] = await pool.query<StoreWithUserRating[]>(query, params);
  return rows;
}

export async function submitRating(userId: number, storeId: number, rating: number): Promise<{ insertId: number }> {
  const [result] = await pool.query(
    'INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)',
    [userId, storeId, rating]
  );
  return { insertId: (result as { insertId: number }).insertId };
}

export async function findRatingById(ratingId: number): Promise<RatingRow | null> {
  const [rows] = await pool.query<RatingRow[]>(
    'SELECT * FROM ratings WHERE id = ?',
    [ratingId]
  );
  return rows[0] || null;
}

export async function updateRating(ratingId: number, rating: number): Promise<void> {
  await pool.query(
    'UPDATE ratings SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [rating, ratingId]
  );
}

export async function findStoreById(storeId: number): Promise<{ id: number } | null> {
  const [rows] = await pool.query<StoreIdRow[]>(
    'SELECT id FROM stores WHERE id = ?',
    [storeId]
  );
  return rows[0] || null;
}
