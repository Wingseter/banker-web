import { RowDataPacket } from 'mysql2';
import { pool } from '../lib/db';
import { User, NewUser } from '../types/domain';

type UserRow = User & RowDataPacket;

export async function getAllUsers(): Promise<User[]> {
  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users');
  return rows;
}

export async function findById(id: number | string): Promise<User | undefined> {
  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
}

export async function findByEmail(email: string): Promise<User | undefined> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT * FROM users WHERE email = ? ORDER BY id DESC LIMIT 1',
    [email],
  );
  return rows[0];
}

export async function saveUser(user: NewUser): Promise<number> {
  const [result] = await pool.query(
    `INSERT INTO users (email, name, birth, phone, password, address, job)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user.email, user.name, user.birth, user.phone, user.password, user.address, user.job ?? null],
  );
  return (result as { insertId: number }).insertId;
}

export async function updateUser(user: User): Promise<void> {
  await pool.query(
    `UPDATE users
       SET email = ?, name = ?, birth = ?, phone = ?, password = ?, address = ?, job = ?
     WHERE id = ?`,
    [user.email, user.name, user.birth, user.phone, user.password, user.address, user.job, user.id],
  );
}

export async function deleteUser(id: number | string): Promise<void> {
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
}
