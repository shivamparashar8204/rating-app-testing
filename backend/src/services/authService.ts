import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { UserRow, SafeUser, UserRole } from '../types';

const SALT_ROUNDS = 10;

export function toSafeUser(user: UserRow): SafeUser {
  const { password_hash: _, ...safeUser } = user;
  return safeUser;
}

export async function createUser(
  name: string,
  email: string,
  address: string,
  password: string,
  role: UserRole = 'CUSTOMER'
): Promise<SafeUser> {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (name, email, address, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name.trim(), email.trim().toLowerCase(), address.trim(), passwordHash, role]
  );

  return toSafeUser(result.rows[0]);
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email.trim().toLowerCase()]
  );
  return result.rows[0] || null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function updatePassword(userId: number, newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [passwordHash, userId]
  );
}

export async function findUserByGoogleId(googleId: string): Promise<UserRow | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE google_id = $1',
    [googleId]
  );
  return result.rows[0] || null;
}

export async function linkGoogleId(userId: number, googleId: string): Promise<void> {
  await pool.query(
    'UPDATE users SET google_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [googleId, userId]
  );
}

export async function createGoogleUser(
  name: string,
  email: string,
  googleId: string
): Promise<SafeUser> {
  const result = await pool.query(
    `INSERT INTO users (name, email, address, google_id, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name.trim(), email.trim().toLowerCase(), '', googleId, 'CUSTOMER']
  );

  return toSafeUser(result.rows[0]);
}
