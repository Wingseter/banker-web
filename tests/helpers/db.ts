import bcrypt from 'bcrypt';
import { pool } from '../../src/lib/db';

/**
 * Drops every row from every domain table and re-seeds the demo user.
 * Order matters: FK-children before parents.
 */
export async function resetDb(): Promise<void> {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of ['history', 'cards', 'accounts', 'users']) {
    await pool.query(`TRUNCATE TABLE ${t}`);
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  const hash = await bcrypt.hash('password123', 4);
  await pool.query(
    `INSERT INTO users (id, email, name, birth, phone, password, address, job)
     VALUES (1, 'demo@banker.local', '데모', '1990-01-01', '01000000000', ?, '서울', '학생')`,
    [hash],
  );
}

export async function rowCount(table: string): Promise<number> {
  const [rows] = await pool.query(`SELECT COUNT(*) AS c FROM ${table}`);
  return Number((rows as { c: number }[])[0].c);
}

export async function balance(accountId: number): Promise<number> {
  const [rows] = await pool.query('SELECT money FROM accounts WHERE id = ?', [accountId]);
  const row = (rows as { money: string }[])[0];
  return row ? Number(row.money) : NaN;
}
