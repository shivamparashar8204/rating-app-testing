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

  const [result] = await pool.query(
    `INSERT INTO users (name, email, address, password_hash, role)
     VALUES (?, ?, ?, ?, ?)`,
    [name.trim(), email.trim().toLowerCase(), address.trim(), passwordHash, role]
  );

  const insertId = (result as { insertId: number }).insertId;
  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [insertId]);
  return toSafeUser(rows[0]);
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT * FROM users WHERE email = ?',
    [email.trim().toLowerCase()]
  );
  return rows[0] || null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function updatePassword(userId: number, newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query(
    'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [passwordHash, userId]
  );
}
